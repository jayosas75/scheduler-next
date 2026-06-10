// Login rate-limit coverage. The credentials authorize() caps attempts per
// client IP (10/min, 50/hr) — see src/auth.ts. This proves the per-minute cap
// engages on the 11th attempt, and that the cap is keyed *per IP* (one attacker
// IP getting blocked must not lock everyone else out).
//
// Isolation trick: the limiter keys on the `x-forwarded-for` header
// (lib/rate-limit.ts → getClientIp). Node can set that header freely; browsers
// can't (it's a forbidden header). So each run uses a fresh random IP, getting
// its own empty bucket — it never collides with the other auth tests (which hit
// localhost / the 'unknown' bucket) or with a previous run of this same test.
//
// Same skip semantics as the other server tests: green when DATABASE_URL is
// unset or no server answers at TEST_BASE_URL, so CI without a server stays green.

import { randomUUID } from 'node:crypto';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

// Keep in sync with the per-minute cap in src/auth.ts.
const LOGIN_LIMIT_PER_MIN = 10;

if (!process.env.DATABASE_URL) {
    console.log('⏭  Skipping login-rate-limit test (DATABASE_URL not set)');
    process.exit(0);
}

console.log(`🧪 Running Login Rate-Limit Tests against ${BASE_URL}...\n`);

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
}

// Roll any Set-Cookie values into a jar (last value wins per name).
function mergeCookies(jar: Map<string, string>, setCookieHeader: string | null): void {
    if (!setCookieHeader) return;
    for (const part of setCookieHeader.split(/,(?=\s*[A-Za-z0-9_\-.]+=)/)) {
        const [pair] = part.split(';');
        const eq = pair.indexOf('=');
        if (eq < 0) continue;
        const name = pair.slice(0, eq).trim();
        const value = pair.slice(eq + 1).trim();
        if (name) jar.set(name, value);
    }
}
function cookieHeader(jar: Map<string, string>): string {
    return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

// A run-unique, clearly-non-production IP so this run gets a fresh bucket.
function uniqueIp(): string {
    const o = () => Math.floor(Math.random() * 256);
    return `10.${o()}.${o()}.${1 + Math.floor(Math.random() * 254)}`;
}

async function isServerUp(): Promise<boolean> {
    try {
        const res = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: 'manual' });
        return res.ok;
    } catch {
        return false;
    }
}

// One failed-login attempt from a given IP. Uses a non-existent user so it can
// never accidentally succeed (which would issue a session instead of failing).
// In Node, redirect:'manual' surfaces the real status: a normal failure is a
// 3xx redirect to the sign-in page; a rate-limited one is a 429.
async function attempt(csrfToken: string, jar: Map<string, string>, ip: string): Promise<number> {
    const body = new URLSearchParams({
        csrfToken,
        email: `nobody-${randomUUID()}@scheduler.test`,
        password: 'definitely-the-wrong-password',
        callbackUrl: `${BASE_URL}/login`,
    });
    const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-forwarded-for': ip,
            Cookie: cookieHeader(jar),
        },
        body: body.toString(),
        redirect: 'manual',
    });
    return res.status;
}

async function main() {
    if (!(await isServerUp())) {
        console.log(`⏭  Skipping login-rate-limit test (no server at ${BASE_URL}; start \`npm run dev\` to run it)`);
        process.exit(0);
    }

    // CSRF token is reusable across the burst (double-submit cookie, not single-use).
    const jar = new Map<string, string>();
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: 'manual' });
    mergeCookies(jar, csrfRes.headers.get('set-cookie'));
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
    assert(typeof csrfToken === 'string' && csrfToken.length > 0, 'Obtained a CSRF token');

    // --- Burst from a single fresh IP: cap should engage right after the limit ---
    const ip = uniqueIp();
    const statuses: number[] = [];
    for (let i = 0; i < LOGIN_LIMIT_PER_MIN + 2; i++) {
        statuses.push(await attempt(csrfToken, jar, ip));
    }

    const withinCap = statuses.slice(0, LOGIN_LIMIT_PER_MIN);
    const overCap = statuses.slice(LOGIN_LIMIT_PER_MIN);

    assert(
        withinCap.every((s) => s !== 429),
        `First ${LOGIN_LIMIT_PER_MIN} attempts in the window are allowed through (none 429) — got [${withinCap.join(', ')}]`,
    );
    assert(
        withinCap.every((s) => [301, 302, 303, 307, 308].includes(s)),
        `Allowed attempts reach normal auth handling (failed-login redirect) — got [${withinCap.join(', ')}]`,
    );
    assert(
        overCap.every((s) => s === 429),
        `Attempts past the ${LOGIN_LIMIT_PER_MIN}/min cap are rate-limited with 429 — got [${overCap.join(', ')}]`,
    );

    // --- The cap is per-IP: a different fresh IP is unaffected even though the
    //     first IP is now blocked (also proves the x-forwarded-for keying works). ---
    const otherIpStatus = await attempt(csrfToken, jar, uniqueIp());
    assert(
        otherIpStatus !== 429,
        `A different client IP is not rate-limited by the first IP's burst (got ${otherIpStatus})`,
    );

    console.log(`\n-----------------------\nTests Completed: ${passed + failed}\nPassed: ${passed}\nFailed: ${failed}`);
    process.exit(failed === 0 ? 0 : 1);
}

main();

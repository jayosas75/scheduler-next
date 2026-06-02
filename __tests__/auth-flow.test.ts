// End-to-end auth flow against a running Next dev/start server:
//   register a user → CSRF → credentials callback → session cookie → /calendar 200 → signout → /calendar redirect to /login.
//
// Skips silently when:
//   - DATABASE_URL is unset, or
//   - the test base URL (default http://localhost:3000) isn't responding.
//
// This lets the suite stay green in CI without a server, while still proving the
// real login path when run locally with `npm run dev` up.

import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

if (!process.env.DATABASE_URL) {
    console.log('⏭  Skipping auth-flow test (DATABASE_URL not set)');
    process.exit(0);
}

console.log(`🧪 Running Auth Flow Tests against ${BASE_URL}...\n`);

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
}

// Merge any new Set-Cookie values into the rolling cookie jar. Last value wins per name.
function mergeCookies(jar: Map<string, string>, setCookieHeader: string | null): void {
    if (!setCookieHeader) return;
    // Multiple cookies in one header come back joined; split-by-comma-but-not-inside-expires is messy,
    // so we parse the first key=value pair from each comma-segment that looks like a cookie.
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

async function isServerUp(): Promise<boolean> {
    try {
        const res = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: 'manual' });
        return res.ok;
    } catch {
        return false;
    }
}

async function main() {
    if (!(await isServerUp())) {
        console.log(`⏭  Skipping auth-flow test (no server at ${BASE_URL}; start \`npm run dev\` to run it)`);
        process.exit(0);
    }

    const prisma = new PrismaClient();
    const email = `authflow-${randomUUID()}@scheduler.test`;
    const password = 'authflow-pass-123';
    const jar = new Map<string, string>();

    try {
        // --- Seed the user directly via Prisma (same path the register route uses) ---
        const hash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, name: 'Auth Flow Test', password: hash },
        });
        assert(!!user.id, 'Seeded user for the flow');

        // --- CSRF ---
        const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: 'manual' });
        assert(csrfRes.ok, 'GET /api/auth/csrf returns 200');
        mergeCookies(jar, csrfRes.headers.get('set-cookie'));
        const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
        assert(typeof csrfToken === 'string' && csrfToken.length > 0, 'csrfToken present');

        // --- Credentials sign-in (redirect=false → JSON response) ---
        const body = new URLSearchParams({
            csrfToken,
            email,
            password,
            callbackUrl: `${BASE_URL}/calendar`,
            redirect: 'false',
            json: 'true',
        });
        const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Cookie: cookieHeader(jar),
            },
            body: body.toString(),
            redirect: 'manual',
        });
        mergeCookies(jar, loginRes.headers.get('set-cookie'));
        assert(loginRes.status === 200 || loginRes.status === 302, `Login response is 200 or 302 (got ${loginRes.status})`);

        const sessionCookieName = Array.from(jar.keys()).find((k) => /session-token$/.test(k));
        assert(!!sessionCookieName, `Session cookie was issued (looking for *session-token, found: ${Array.from(jar.keys()).join(',')})`);

        // --- Protected route is reachable ---
        const calRes = await fetch(`${BASE_URL}/calendar`, {
            headers: { Cookie: cookieHeader(jar) },
            redirect: 'manual',
        });
        assert(calRes.status === 200, `GET /calendar with session cookie returns 200 (got ${calRes.status})`);

        // --- Sign out: get a fresh CSRF then POST signout ---
        const csrf2 = await fetch(`${BASE_URL}/api/auth/csrf`, {
            headers: { Cookie: cookieHeader(jar) },
            redirect: 'manual',
        });
        mergeCookies(jar, csrf2.headers.get('set-cookie'));
        const { csrfToken: csrfToken2 } = (await csrf2.json()) as { csrfToken: string };

        const outBody = new URLSearchParams({ csrfToken: csrfToken2, callbackUrl: BASE_URL, json: 'true' });
        const signoutRes = await fetch(`${BASE_URL}/api/auth/signout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Cookie: cookieHeader(jar),
            },
            body: outBody.toString(),
            redirect: 'manual',
        });
        mergeCookies(jar, signoutRes.headers.get('set-cookie'));
        assert(
            signoutRes.status === 200 || signoutRes.status === 302,
            `Signout returns 200 or 302 (got ${signoutRes.status})`
        );

        // The session cookie should be cleared (set to empty or expired).
        const sessionAfter = sessionCookieName ? jar.get(sessionCookieName) : undefined;
        assert(!sessionAfter || sessionAfter === '' , 'Session cookie was cleared on signout');

        // --- Protected route now redirects away ---
        const calAfter = await fetch(`${BASE_URL}/calendar`, {
            headers: { Cookie: cookieHeader(jar) },
            redirect: 'manual',
        });
        // Middleware uses NextResponse.redirect → 307. Some configs use 302/303.
        assert(
            [301, 302, 303, 307, 308].includes(calAfter.status),
            `After signout, GET /calendar redirects (got ${calAfter.status})`
        );
        const location = calAfter.headers.get('location') ?? '';
        assert(location.includes('/login'), `Redirect target is /login (got "${location}")`);
    } catch (err) {
        console.error('❌ FAIL: unexpected error:', err);
        failed++;
    } finally {
        await prisma.user.deleteMany({ where: { email } }).catch(() => {});
        await prisma.$disconnect();
    }

    console.log(`\n-----------------------\nTests Completed: ${passed + failed}\nPassed: ${passed}\nFailed: ${failed}`);
    process.exit(failed === 0 ? 0 : 1);
}

main();

// End-to-end test for the forgot/reset password flow against a running server.
//   seed user → POST /forgot-password → fetch the issued token row via Prisma
//   → POST /reset-password with that token + new password → log in with the new
//   password (credentials callback) → verify the OLD password no longer works.
//
// Same skip semantics as auth-flow.test.ts: green-pass when DATABASE_URL is
// unset (no DB available) or no server is responding at TEST_BASE_URL.

import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { hashToken } from '../src/lib/password-reset';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

if (!process.env.DATABASE_URL) {
    console.log('⏭  Skipping password-reset-flow test (DATABASE_URL not set)');
    process.exit(0);
}

console.log(`🧪 Running Password Reset Flow Tests against ${BASE_URL}...\n`);

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
}

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
        console.log(`⏭  Skipping (no server at ${BASE_URL}; start \`npm run dev\` to run it)`);
        process.exit(0);
    }

    const prisma = new PrismaClient();
    const email = `reset-${randomUUID()}@scheduler.test`;
    const oldPassword = 'old-password-123';
    const newPassword = 'new-password-456';

    try {
        // --- Seed: user with the OLD password ---
        const oldHash = await bcrypt.hash(oldPassword, 10);
        const user = await prisma.user.create({
            data: { email, name: 'Reset Flow Test', password: oldHash },
        });
        assert(!!user.id, 'Seeded user with old password');

        // --- Request reset ---
        const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        assert(forgotRes.status === 200, `POST /forgot-password is 200 (got ${forgotRes.status})`);

        // Email is mocked to console.log in dev mode (no RESEND_API_KEY), so we
        // recover the raw token by asking the DB for the row we just inserted.
        // The row stores tokenHash; we know token issuance is per-request, so we
        // can pull the most recent unconsumed one for this user.
        const tokenRow = await prisma.passwordResetToken.findFirst({
            where: { userId: user.id, consumedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        assert(!!tokenRow, 'A reset token row was created for the user');
        assert(tokenRow!.expiresAt.getTime() > Date.now(), 'Issued token is not already expired');

        // Generate the same raw token by trying a value and confirming the hash
        // — except we can't reverse SHA-256. The route emitted the raw token via
        // email; locally we fish it out of the dev-server stdout. We can't read
        // the dev-server logs from here cleanly, so instead we test the rest of
        // the flow by minting a controlled token directly: invalidate the one
        // the route created, then insert our own with a known raw token. This
        // exercises the same code path on /reset-password.
        await prisma.passwordResetToken.update({
            where: { id: tokenRow!.id },
            data: { consumedAt: new Date() }, // mark void; we'll use our own
        });
        const controlledRaw = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash: hashToken(controlledRaw),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        // --- Reject the wrong token ---
        const wrongRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: 'a'.repeat(64), password: newPassword }),
        });
        assert(wrongRes.status === 400, `Reset with wrong token rejected (got ${wrongRes.status})`);

        // --- Reset with the controlled token ---
        const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: controlledRaw, password: newPassword }),
        });
        assert(resetRes.status === 200, `Reset with valid token is 200 (got ${resetRes.status})`);

        // --- The token is now consumed; using it again must fail ---
        const replayRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: controlledRaw, password: newPassword }),
        });
        assert(replayRes.status === 400, `Replay of consumed token rejected (got ${replayRes.status})`);

        // --- Verify password actually changed: new works, old doesn't ---
        const jar = new Map<string, string>();
        const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: 'manual' });
        mergeCookies(jar, csrfRes.headers.get('set-cookie'));
        const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

        // Old password should be rejected. Credentials returns 302 in both cases
        // (NextAuth redirects to callbackUrl on success, error param on failure),
        // so we inspect the Location for `?error=` instead of the status code.
        const oldBody = new URLSearchParams({
            csrfToken, email, password: oldPassword,
            callbackUrl: `${BASE_URL}/calendar`, redirect: 'true',
        });
        const oldLogin = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader(jar) },
            body: oldBody.toString(),
            redirect: 'manual',
        });
        const oldLocation = oldLogin.headers.get('location') ?? '';
        assert(/error/i.test(oldLocation), `Old password no longer logs in (location: "${oldLocation}")`);

        // Fresh jar for the new attempt so leftover cookies don't poison it.
        const jar2 = new Map<string, string>();
        const csrf2 = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: 'manual' });
        mergeCookies(jar2, csrf2.headers.get('set-cookie'));
        const { csrfToken: csrfToken2 } = (await csrf2.json()) as { csrfToken: string };
        const newBody = new URLSearchParams({
            csrfToken: csrfToken2, email, password: newPassword,
            callbackUrl: `${BASE_URL}/calendar`, redirect: 'false', json: 'true',
        });
        const newLogin = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader(jar2) },
            body: newBody.toString(),
            redirect: 'manual',
        });
        mergeCookies(jar2, newLogin.headers.get('set-cookie'));
        const sessionIssued = Array.from(jar2.keys()).some((k) => /session-token$/.test(k));
        assert(sessionIssued, 'New password issues a session cookie (login works)');
    } catch (err) {
        console.error('❌ FAIL: unexpected error:', err);
        failed++;
    } finally {
        // Cascade delete: dropping the user removes their tokens via FK onDelete.
        await prisma.user.deleteMany({ where: { email } }).catch(() => {});
        await prisma.$disconnect();
    }

    console.log(`\n-----------------------\nTests Completed: ${passed + failed}\nPassed: ${passed}\nFailed: ${failed}`);
    process.exit(failed === 0 ? 0 : 1);
}

main();

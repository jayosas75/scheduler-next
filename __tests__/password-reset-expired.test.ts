// Expired-token rejection. Companion to password-reset-flow.test.ts, which
// covers wrong + replayed tokens but not the expiry path. A leaked email link
// that aged past RESET_TTL_MS must be inert: the route returns the generic
// invalid response, the user's password is unchanged, and the token row is
// NOT marked consumed (since consumption only happens on a valid reset).
//
// Same skip semantics as the other DB tests: green-pass when DATABASE_URL is
// unset or no server responds at TEST_BASE_URL.

import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { hashToken } from '../src/lib/password-reset';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

if (!process.env.DATABASE_URL) {
    console.log('⏭  Skipping password-reset-expired test (DATABASE_URL not set)');
    process.exit(0);
}

console.log(`🧪 Running Expired Token Tests against ${BASE_URL}...\n`);

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
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
    const email = `expired-${randomUUID()}@scheduler.test`;
    const originalPassword = 'original-password-123';
    const attemptedNewPassword = 'should-not-take-456';

    try {
        // --- Seed: user + a token that's already past its expiry ---
        const originalHash = await bcrypt.hash(originalPassword, 10);
        const user = await prisma.user.create({
            data: { email, name: 'Expired Token Test', password: originalHash },
        });

        const rawToken = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
        const tokenRow = await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash: hashToken(rawToken),
                // 1 second in the past. The route checks `expiresAt < now`, so
                // any negative delta is enough — keep it tight so a slow CI
                // box doesn't accidentally make this "still valid".
                expiresAt: new Date(Date.now() - 1000),
            },
        });
        assert(!!tokenRow.id, 'Seeded user + expired token row');

        // --- Submit the expired token ---
        const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: rawToken, password: attemptedNewPassword }),
        });
        assert(res.status === 400, `Expired token rejected with 400 (got ${res.status})`);

        const body = (await res.json()) as { message?: string };
        // Generic message — must not leak that this was specifically an
        // expiry failure vs. an unknown token. Both surface the same string.
        assert(
            !!body.message && /invalid or has expired/i.test(body.message),
            `Response uses the generic invalid-or-expired message (got "${body.message}")`,
        );

        // --- Password must NOT have been updated ---
        const afterUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
        assert(
            afterUser.password === originalHash,
            'User password hash is unchanged after expired-token submission',
        );
        const stillLogsInWithOld = await bcrypt.compare(originalPassword, afterUser.password ?? '');
        assert(stillLogsInWithOld, 'Original password still matches stored hash');

        // --- Token row must NOT be marked consumed ---
        // The route returns 400 before the transaction runs, so consumedAt
        // should remain null. If a future refactor accidentally consumed
        // expired tokens, this catches it.
        const afterToken = await prisma.passwordResetToken.findUniqueOrThrow({
            where: { id: tokenRow.id },
        });
        assert(afterToken.consumedAt === null, 'Expired token row is NOT marked consumed');
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

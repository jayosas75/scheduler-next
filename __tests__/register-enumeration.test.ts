// Account-enumeration guard for /api/auth/register. Registering an address that
// already exists must be indistinguishable from a fresh signup — same status,
// same body — so the endpoint can't be used to discover which emails have
// accounts. (The real owner is nudged out-of-band by email; see lib/email.ts.)
//
// Like the other server tests it skips when DATABASE_URL is unset or no server
// answers at TEST_BASE_URL. It isolates its rate-limit bucket with a unique
// x-forwarded-for per run (register is capped 5/hr per IP), so repeat runs and
// the other auth tests never interfere.

import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

if (!process.env.DATABASE_URL) {
    console.log('⏭  Skipping register-enumeration test (DATABASE_URL not set)');
    process.exit(0);
}

console.log(`🧪 Running Register Enumeration Tests against ${BASE_URL}...\n`);

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
}

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

async function register(email: string, ip: string): Promise<{ status: number; body: string }> {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({ email, password: 'enum-test-pass-9x', name: 'Enum Test' }),
    });
    return { status: res.status, body: await res.text() };
}

async function main() {
    if (!(await isServerUp())) {
        console.log(`⏭  Skipping register-enumeration test (no server at ${BASE_URL}; start \`npm run dev\` to run it)`);
        process.exit(0);
    }

    const prisma = new PrismaClient();
    const email = `enum-${randomUUID()}@scheduler.test`;
    const ip = uniqueIp();

    try {
        // First registration: brand-new address → created.
        const first = await register(email, ip);
        assert(first.status === 201, `New email registers with 201 (got ${first.status})`);

        // Second registration: same address now exists. Must look identical.
        const second = await register(email, ip);
        assert(second.status === 201, `Duplicate email returns 201, not a 4xx tell (got ${second.status})`);
        assert(second.status !== 400, 'Duplicate email does NOT return the old 400 "User already exists"');
        assert(first.body === second.body, 'Response body is byte-identical for new vs. existing email');
        assert(!/exist/i.test(second.body), `Response never says the account "exists" (got: ${second.body})`);

        // And no duplicate row was actually created.
        const count = await prisma.user.count({ where: { email } });
        assert(count === 1, `Exactly one user row exists for the address (got ${count})`);
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

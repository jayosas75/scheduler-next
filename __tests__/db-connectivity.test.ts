// DB smoke test: verifies Prisma can connect to the configured Postgres and that
// the User model supports the exact CRUD path the credentials auth flow needs
// (create with hashed password → read by email → bcrypt.compare → delete).
//
// Skipped silently when DATABASE_URL is unset so this won't break CI without a DB.

import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
    console.log('⏭  Skipping DB connectivity test (DATABASE_URL not set)');
    process.exit(0);
}

console.log('🧪 Running DB Connectivity Tests...\n');

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
}

async function main() {
    const prisma = new PrismaClient();
    // Unique per-run email so concurrent runs and leftover rows can't collide.
    const email = `dbconn-${randomUUID()}@scheduler.test`;
    const password = 'connect-test-pass';

    try {
        await prisma.$connect();
        assert(true, 'Prisma connects to DATABASE_URL');

        const hash = await bcrypt.hash(password, 10);
        const created = await prisma.user.create({
            data: { email, name: 'DB Conn Test', password: hash },
        });
        assert(!!created.id, 'User.create returns a record with an id');
        assert(created.email === email, 'Created user persists the email');

        const fetched = await prisma.user.findUnique({ where: { email } });
        assert(fetched?.id === created.id, 'findUnique({email}) returns the same row');
        assert(typeof fetched?.password === 'string', 'Stored password is a string (hash)');

        const passwordsMatch = await bcrypt.compare(password, fetched!.password!);
        assert(passwordsMatch, 'bcrypt.compare validates the stored hash');

        const wrongMatch = await bcrypt.compare('not-the-password', fetched!.password!);
        assert(!wrongMatch, 'bcrypt.compare rejects the wrong password');

        const deleted = await prisma.user.delete({ where: { id: created.id } });
        assert(deleted.id === created.id, 'User.delete removes the created row');

        const reFetched = await prisma.user.findUnique({ where: { email } });
        assert(reFetched === null, 'Deleted user is gone');
    } catch (err) {
        console.error('❌ FAIL: unexpected error:', err);
        failed++;
    } finally {
        // Belt-and-suspenders cleanup if any assertion failed mid-flight.
        await prisma.user.deleteMany({ where: { email } }).catch(() => {});
        await prisma.$disconnect();
    }

    console.log(`\n-----------------------\nTests Completed: ${passed + failed}\nPassed: ${passed}\nFailed: ${failed}`);
    process.exit(failed === 0 ? 0 : 1);
}

main();

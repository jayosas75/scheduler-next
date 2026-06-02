// Seeds a known dev login. Idempotent — runs safely against an existing user.
// Reads DATABASE_URL from .env (Prisma autoloads it).
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const EMAIL = 'dev@scheduler.local';
const PASSWORD = 'devpass123';

const prisma = new PrismaClient();

const hash = await bcrypt.hash(PASSWORD, 10);
const user = await prisma.user.upsert({
  where: { email: EMAIL },
  update: { password: hash },
  create: { email: EMAIL, name: 'Dev User', password: hash },
});

console.log(`✓ Seeded dev user: ${user.email} (id=${user.id})`);
console.log(`  Password: ${PASSWORD}`);
await prisma.$disconnect();

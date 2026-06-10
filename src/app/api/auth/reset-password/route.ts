import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { hashToken } from '@/lib/password-reset';
import { passwordSchema } from '@/lib/password-policy';

const bodySchema = z.object({
    token: z.string().min(32).max(128),
    // Same creation policy as /api/auth/register (shared in password-policy.ts).
    password: passwordSchema,
});

const GENERIC_INVALID = { message: 'This reset link is invalid or has expired.' };

export async function POST(req: Request) {
    // Modest per-IP cap so the validate path isn't a brute-force surface for
    // the token space. Real tokens have 256 bits of entropy so this is belt +
    // suspenders, but cheap to add.
    const ip = getClientIp(req);
    const limit = rateLimit(`reset:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) {
        return NextResponse.json(
            { message: 'Too many attempts. Please wait and try again.' },
            { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
        );
    }

    let token: string;
    let password: string;
    try {
        const body = await req.json();
        const parsed = bodySchema.parse(body);
        token = parsed.token;
        password = parsed.password;
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Invalid input', errors: err.issues },
                { status: 400 },
            );
        }
        return NextResponse.json(GENERIC_INVALID, { status: 400 });
    }

    try {
        const record = await prisma.passwordResetToken.findUnique({
            where: { tokenHash: hashToken(token) },
            include: { user: true },
        });

        const now = new Date();
        if (!record || record.consumedAt || record.expiresAt < now) {
            // Same error for every failure mode so a probing client can't tell
            // "wrong token" from "expired" from "already used".
            return NextResponse.json(GENERIC_INVALID, { status: 400 });
        }

        const hashed = await bcrypt.hash(password, 10);

        // Atomic: stamp the token consumed in the same transaction as the
        // password update so a crash can't leave the token reusable.
        await prisma.$transaction([
            prisma.user.update({
                where: { id: record.userId },
                data: { password: hashed },
            }),
            prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { consumedAt: now },
            }),
        ]);

        return NextResponse.json(
            { message: 'Password updated. You can sign in with your new password.' },
            { status: 200 },
        );
    } catch (err) {
        console.error('[reset-password] internal error:', err);
        return NextResponse.json(
            { message: 'Unable to reset password right now. Please try again shortly.' },
            { status: 500 },
        );
    }
}

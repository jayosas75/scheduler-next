import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { generateToken, hashToken, tokenExpiresAt } from '@/lib/password-reset';
import { sendPasswordReset } from '@/lib/email';

// Always-same neutral response. Used regardless of whether the address resolves
// to a real account — prevents the endpoint from being used as an enumeration
// oracle. Keep this here as a const so future edits don't accidentally branch it.
const NEUTRAL_RESPONSE = {
    message:
        'If an account exists for that address, a reset link has been sent. ' +
        'Check your inbox (and spam) — links expire after 1 hour.',
};

const bodySchema = z.object({
    email: z.string().email(),
});

export async function POST(req: Request) {
    // Per-IP cap: 5 requests / hour. Catches obvious bursts without blocking
    // legitimate retries from someone who didn't see the first email yet.
    const ip = getClientIp(req);
    const ipLimit = rateLimit(`forgot:ip:${ip}`, 5, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
        return NextResponse.json(NEUTRAL_RESPONSE, {
            status: 200,
            headers: { 'Retry-After': String(ipLimit.retryAfter) },
        });
    }

    let email: string;
    try {
        const body = await req.json();
        const parsed = bodySchema.parse(body);
        email = parsed.email.toLowerCase().trim();
    } catch {
        // Even malformed input gets the neutral response (no validation leak).
        return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
    }

    // Per-email cap: 3 outstanding requests / hour. Slows targeted attempts.
    const emailLimit = rateLimit(`forgot:email:${email}`, 3, 60 * 60 * 1000);

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user && emailLimit.allowed) {
            // Create the token + send the email. Errors are logged inside
            // sendPasswordReset; we never let them change the response shape.
            const raw = generateToken();
            await prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    tokenHash: hashToken(raw),
                    expiresAt: tokenExpiresAt(),
                },
            });

            const base = process.env.AUTH_URL ?? new URL(req.url).origin;
            const resetUrl = `${base}/reset-password?token=${raw}`;
            await sendPasswordReset(email, resetUrl);
        }
    } catch (err) {
        // Log but stay neutral — don't tell the world the DB is down either.
        console.error('[forgot-password] internal error:', err);
    }

    return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
}

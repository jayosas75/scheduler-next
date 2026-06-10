
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Thrown when an IP trips the login cap. Extending CredentialsSignin lets us
// surface a distinct `code` (read in lib/actions.ts) without leaking it as a
// different error *type* — to an attacker a blocked attempt looks like any
// other failed sign-in.
class RateLimitSignin extends CredentialsSignin {
    code = 'rate_limited';
}

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials, request) {
                // Brute-force deterrent: cap login attempts per client IP before
                // doing any work. Same in-memory limiter as register/forgot/reset
                // (a P1 item migrates all of them to Upstash). Two windows catch
                // both rapid bursts (10/min) and slow grinding (50/hr). On Vercel
                // the IP comes from x-forwarded-for; locally it's 'unknown', so
                // all dev logins share one bucket — fine for a deterrent.
                const ip = getClientIp(request);
                const perMinute = rateLimit(`login:min:${ip}`, 10, 60_000);
                const perHour = rateLimit(`login:hr:${ip}`, 50, 60 * 60_000);
                if (!perMinute.allowed || !perHour.allowed) {
                    console.warn(`[auth] login rate-limited for ip=${ip}`);
                    throw new RateLimitSignin();
                }

                // Login only *verifies* an existing password — it must not
                // re-impose the creation policy (min length / complexity), or
                // accounts made under an older rule would be locked out. The
                // strong policy lives in password-policy.ts and is enforced at
                // register + reset, where passwords are set. Here we just need
                // a non-empty string to hand to bcrypt.compare.
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(1) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    // Note: If user created via OAuth (future proofing), they might not have a password. 
                    // But we are sticking to Credentials only as per request.
                    if (!user.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) return user;
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});

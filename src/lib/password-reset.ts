// Token primitives for the password reset flow. Pure and side-effect free,
// so the helpers can be unit-tested without touching the DB or env.
//
// Threat model: a token leaks if (a) the DB is read, or (b) the email is
// intercepted. We mitigate (a) by storing only SHA-256 of the raw token —
// the column is effectively opaque even with full DB access. We mitigate (b)
// by bounding the TTL (1h) and marking the token consumed on first use.

import { createHash, randomBytes } from 'node:crypto';

// 1 hour. Long enough for slow email delivery + the user fishing it out of
// spam; short enough that a stolen email link rapidly becomes useless.
export const RESET_TTL_MS = 60 * 60 * 1000;

// 32 bytes ≈ 256 bits of entropy. Hex-encoded → 64 URL-safe characters.
export function generateToken(): string {
    return randomBytes(32).toString('hex');
}

// Stable, one-way hash of the raw token for storage. SHA-256 is fine here
// because the token itself has 256 bits of entropy — there's nothing to brute
// force (bcrypt is for low-entropy human passwords).
export function hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
}

export function tokenExpiresAt(now: Date = new Date()): Date {
    return new Date(now.getTime() + RESET_TTL_MS);
}

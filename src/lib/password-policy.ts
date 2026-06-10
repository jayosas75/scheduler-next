import { z } from 'zod';

// Single source of truth for the password-creation policy. Applied wherever a
// password is *set* (register, reset-password). The login path deliberately
// does NOT use this — it only verifies an existing hash, so re-imposing the
// creation policy there would lock out accounts created under an older rule.

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt silently truncates input beyond 72 bytes, so anything longer is a
// footgun (the tail is ignored on both hash and compare). Reject it up front.
export const MAX_PASSWORD_LENGTH = 72;

// A short denylist of the most-guessed passwords. This is intentionally small —
// a real breach-corpus check (Have I Been Pwned / zxcvbn) is a later item; this
// just stops the laziest choices from sailing through the 8-char floor.
const COMMON_PASSWORDS = new Set([
    'password', 'password1', 'password123', 'passw0rd',
    '12345678', '123456789', '1234567890', '123123123',
    'qwerty', 'qwertyui', 'qwerty123', 'qwertyuiop',
    'iloveyou', 'admin123', 'letmein', 'welcome', 'welcome1',
    'football', 'baseball', 'sunshine', 'princess', 'whatever',
    'abc12345', 'abcd1234', 'monkey123',
]);

/**
 * Returns a human-readable reason the password is unacceptable, or null if it
 * passes. Pure function so it can be unit-tested without zod.
 */
export function passwordIssue(password: string): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
    }
    // A single repeated character ("aaaaaaaa", "11111111") clears the length
    // floor but is trivially guessable.
    if (/^(.)\1+$/.test(password)) {
        return 'Password cannot be a single repeated character.';
    }
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
        return 'That password is too common. Please choose something less guessable.';
    }
    return null;
}

/** Zod schema for a newly-set password. Use this in register + reset routes. */
export const passwordSchema = z.string().superRefine((password, ctx) => {
    const issue = passwordIssue(password);
    if (issue) {
        ctx.addIssue({ code: 'custom', message: issue });
    }
});

'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    // The login rate-limiter throws a CredentialsSignin subclass
                    // carrying code 'rate_limited' (see auth.ts). Tell the user to
                    // wait; for every other credential failure stay vague.
                    if ('code' in error && error.code === 'rate_limited') {
                        return 'Too many login attempts. Please wait a minute and try again.';
                    }
                    // Unified message (does not reveal whether the email exists)
                    // to avoid account enumeration — see the "Protect identities"
                    // security TODO. Still tells the user the password may be wrong.
                    return 'Incorrect email or password. Please try again.';
                default:
                    return 'Unable to sign in right now. Please try again shortly.';
            }
        }
        throw error;
    }
}

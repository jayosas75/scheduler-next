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

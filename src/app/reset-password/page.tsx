import ResetPasswordForm from '@/components/reset-password-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reset Password - Scheduler 2026',
};

// Token comes in via ?token=...; we just hand it to the client form. The form
// validates it server-side on submit, so a missing/bogus token is caught there.
export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string | string[] }>;
}) {
    const params = await searchParams;
    const tokenParam = Array.isArray(params.token) ? params.token[0] : params.token;

    return (
        <main className="relative flex items-center justify-center md:h-screen bg-black overflow-hidden">
            <div className="cyber-grid-wrapper"><div className="cyber-grid"></div></div>
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32 z-10">
                <ResetPasswordForm token={tokenParam ?? ''} />
            </div>
        </main>
    );
}


import LoginForm from '@/components/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login - Scheduler 2026',
};

export default function LoginPage() {
    return (
        <main className="relative flex items-center justify-center md:h-screen bg-black overflow-hidden">
            <div className="cyber-grid-wrapper"><div className="cyber-grid"></div></div>
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32 z-10">
                <LoginForm />
            </div>
        </main>
    );
}

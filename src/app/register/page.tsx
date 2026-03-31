
import RegisterForm from '@/components/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Register - Scheduler 2026',
};

export default function RegisterPage() {
    return (
        <main className="flex items-center justify-center md:h-screen bg-gradient-to-br from-black via-slate-950 to-black">
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
                <RegisterForm />
            </div>
        </main>
    );
}

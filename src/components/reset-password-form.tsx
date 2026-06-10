'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/lib/sound';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ResetPasswordForm({ token }: { token: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string | null>(null);

    // Missing token = the user landed here without clicking through the email.
    // Render a quiet hint instead of a form they can't actually submit.
    if (!token) {
        return (
            <div className="rounded-xl bg-black/80 border-2 border-red-500/40 px-6 py-8 glow scanlines text-center">
                <h1 className="mb-3 text-2xl font-black font-mono tracking-widest uppercase title-shine">
                    ⊘ Missing Token
                </h1>
                <p className="text-sm text-cyan-100/70 leading-relaxed mb-6">
                    This page needs a reset link from your email. Request a new one if your previous link expired.
                </p>
                <a
                    href="/forgot-password"
                    className="inline-block text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold uppercase tracking-wider transition-colors"
                >
                    ↻ Request New Link
                </a>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (status === 'submitting') return;

        const fd = new FormData(e.currentTarget);
        const password = fd.get('password');
        const confirm = fd.get('confirm');

        if (typeof password !== 'string' || typeof confirm !== 'string') return;
        if (password.length < 8) {
            playSound('error');
            setStatus('error');
            setMessage('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            playSound('error');
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        setStatus('submitting');
        setMessage(null);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json().catch(() => ({} as { message?: string }));
            if (res.ok) {
                playSound('save');
                setStatus('success');
                setMessage(data.message ?? 'Password updated. Redirecting to login...');
                // Brief delay so the user reads the confirmation before the redirect.
                setTimeout(() => router.push('/login'), 1500);
            } else {
                playSound('error');
                setStatus('error');
                setMessage(data.message ?? 'Unable to reset password. The link may have expired.');
            }
        } catch {
            playSound('error');
            setStatus('error');
            setMessage('Network error. Please check your connection and try again.');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md">
            <div className="flex-1 rounded-xl bg-black/80 border-2 border-cyan-500/40 px-6 pb-4 pt-8 glow scanlines">
                <h1 className="mb-3 text-2xl font-black font-mono text-center tracking-widest uppercase title-shine">
                    ⊕ New Password
                </h1>

                <div className="w-full">
                    <div>
                        <label
                            className="mb-3 mt-5 block text-xs font-bold text-cyan-400 uppercase tracking-wider"
                            htmlFor="password"
                        >
                            New Password
                        </label>
                        <input
                            className="block w-full rounded-md border border-cyan-500/30 bg-black/60 py-[9px] pl-3 text-sm text-cyan-100 outline-none placeholder:text-cyan-400/40 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all focus:shadow-[0_0_10px_rgba(217,70,239,0.4)]"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="At least 8 characters"
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="mt-4">
                        <label
                            className="mb-3 mt-5 block text-xs font-bold text-cyan-400 uppercase tracking-wider"
                            htmlFor="confirm"
                        >
                            Confirm Password
                        </label>
                        <input
                            className="block w-full rounded-md border border-cyan-500/30 bg-black/60 py-[9px] pl-3 text-sm text-cyan-100 outline-none placeholder:text-cyan-400/40 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all focus:shadow-[0_0_10px_rgba(217,70,239,0.4)]"
                            id="confirm"
                            type="password"
                            name="confirm"
                            placeholder="Repeat your new password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                <button
                    className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white p-2.5 rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 disabled:opacity-50 transition-all font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.6)]"
                    disabled={status === 'submitting' || status === 'success'}
                    aria-disabled={status === 'submitting' || status === 'success'}
                >
                    {status === 'submitting' ? '⊙ Updating...' : status === 'success' ? '✓ Updated' : '⊕ Update Password'}
                </button>

                <div
                    className="mt-3 min-h-[2.5rem] flex items-start"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {message && status === 'success' && (
                        <p className="text-xs text-cyan-300 leading-relaxed">✓ {message}</p>
                    )}
                    {message && status === 'error' && (
                        <p className="text-xs text-red-400 leading-relaxed">✗ {message}</p>
                    )}
                </div>
            </div>
        </form>
    );
}

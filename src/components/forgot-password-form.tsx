'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { playSound } from '@/lib/sound';

type Status = 'idle' | 'submitting' | 'sent' | 'error';

export default function ForgotPasswordForm() {
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (status === 'submitting') return;

        const form = e.currentTarget;
        const email = new FormData(form).get('email');
        if (typeof email !== 'string' || !email) return;

        setStatus('submitting');
        setMessage(null);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({} as { message?: string }));
            if (res.ok) {
                playSound('save');
                setStatus('sent');
                setMessage(data.message ?? 'If an account exists, a reset link has been sent.');
            } else {
                playSound('error');
                setStatus('error');
                setMessage(data.message ?? 'Something went wrong. Please try again.');
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
                    ⊙ Recover Access
                </h1>

                <div className="w-full">
                    <div>
                        <div className="flex items-center gap-2 mb-3 mt-5">
                            <label
                                className="block text-xs font-bold text-cyan-400 uppercase tracking-wider"
                                htmlFor="email"
                            >
                                Email
                            </label>
                            {/* Hover/focus help. Button so keyboard users can reach it. */}
                            <span className="relative inline-flex group">
                                <button
                                    type="button"
                                    aria-label="How does password recovery work?"
                                    className="peer text-cyan-400/60 hover:text-fuchsia-400 focus:text-fuchsia-400 focus:outline-none transition-colors"
                                >
                                    <Info size={14} />
                                </button>
                                <span
                                    role="tooltip"
                                    className="pointer-events-none absolute left-0 top-6 z-20 w-72 rounded-md border border-fuchsia-500/40 bg-black/95 px-3 py-2 text-[11px] leading-relaxed text-cyan-100/90 opacity-0 -translate-y-1 transition-all duration-150 shadow-[0_0_15px_rgba(217,70,239,0.3)] peer-hover:opacity-100 peer-hover:translate-y-0 peer-focus:opacity-100 peer-focus:translate-y-0"
                                >
                                    <span className="block font-bold text-fuchsia-400 mb-1 uppercase tracking-wider">How it works</span>
                                    Enter the email you registered with. We&rsquo;ll send a one-time link valid for <strong className="text-cyan-300">1 hour</strong>. Check your spam folder if you don&rsquo;t see it. For your security, the response is the same whether or not the email matches an account.
                                </span>
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-cyan-500/30 bg-black/60 py-[9px] pl-3 text-sm text-cyan-100 outline-none placeholder:text-cyan-400/40 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all focus:shadow-[0_0_10px_rgba(217,70,239,0.4)]"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <a
                        href="/login"
                        className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold uppercase tracking-wider transition-colors hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]"
                    >
                        Back to Login
                    </a>
                </div>

                <button
                    className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white p-2.5 rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 disabled:opacity-50 transition-all font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.6)]"
                    disabled={status === 'submitting'}
                    aria-disabled={status === 'submitting'}
                >
                    {status === 'submitting' ? '⊙ Sending...' : '⊕ Send Reset Link'}
                </button>

                <div
                    className="mt-3 min-h-[2.5rem] flex items-start"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {message && status === 'sent' && (
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

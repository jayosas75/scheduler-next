'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';

export default function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

    return (
        <form action={dispatch} className="space-y-3 w-full max-w-md">
            <div className="flex-1 rounded-xl bg-black/80 border-2 border-cyan-500/40 px-6 pb-4 pt-8 glow scanlines">
                <h1 className="mb-3 text-2xl font-black font-mono text-center tracking-widest uppercase title-shine">
                    ⊙ Access Matrix
                </h1>
                <div className="w-full">
                    <div>
                        <label
                            className="mb-3 mt-5 block text-xs font-bold text-cyan-400 uppercase tracking-wider"
                            htmlFor="email"
                        >
                            Email
                        </label>
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
                    <div className="mt-4">
                        <label
                            className="mb-3 mt-5 block text-xs font-bold text-cyan-400 uppercase tracking-wider"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-cyan-500/30 bg-black/60 py-[9px] pl-3 text-sm text-cyan-100 outline-none placeholder:text-cyan-400/40 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all focus:shadow-[0_0_10px_rgba(217,70,239,0.4)]"
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter password"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end">
                    <a href="/register" className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold uppercase tracking-wider transition-colors hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]">Create Account</a>
                </div>
                <button
                    className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white p-2.5 rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 disabled:opacity-50 transition-all font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.6)]"
                    aria-disabled={isPending}
                    disabled={isPending}
                >
                    {isPending ? '⊙ Accessing...' : '⊕ Log In'}
                </button>
                <div
                    className="flex h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {errorMessage && (
                        <p className="text-sm text-red-400 w-full text-center">✗ {errorMessage}</p>
                    )}
                </div>
            </div>
        </form>
    );
}

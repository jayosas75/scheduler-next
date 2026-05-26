'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPending(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            if (!res.ok) {
                const data = await res.json();
                if (data.errors) {
                    throw new Error(data.errors.map((e: { message: string }) => e.message).join(', '));
                }
                throw new Error(data.message || 'Something went wrong');
            }

            router.push('/login?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md">
            <div className="flex-1 rounded-xl bg-black/80 border-2 border-cyan-500/40 px-6 pb-4 pt-8 glow scanlines">
                <h1 className="mb-3 text-2xl font-black font-mono text-cyan-400 text-center tracking-widest uppercase">
                    ⊕ Create Account
                </h1>
                <div className="w-full">
                    <div>
                        <label
                            className="mb-3 mt-5 block text-xs font-bold text-cyan-400 uppercase tracking-wider"
                            htmlFor="name"
                        >
                            Name
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-cyan-500/30 bg-black/60 py-[9px] pl-3 text-sm text-cyan-100 outline-none placeholder:text-cyan-400/40 focus:ring-2 focus:ring-cyan-500 transition-all"
                                id="name"
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label
                            className="mb-3 mt-5 block text-xs font-bold text-cyan-400 uppercase tracking-wider"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-cyan-500/30 bg-black/60 py-[9px] pl-3 text-sm text-cyan-100 outline-none placeholder:text-cyan-400/40 focus:ring-2 focus:ring-cyan-500 transition-all"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                className="peer block w-full rounded-md border border-cyan-500/30 bg-black/60 py-[9px] pl-3 text-sm text-cyan-100 outline-none placeholder:text-cyan-400/40 focus:ring-2 focus:ring-cyan-500 transition-all"
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter password (min 6 characters)"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end">
                    <Link href="/login" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider">Already have an account?</Link>
                </div>
                <button
                    className="mt-6 w-full bg-cyan-500 text-black p-2.5 rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-all font-black uppercase tracking-widest text-sm"
                    disabled={pending}
                >
                    {pending ? '⊙ Creating...' : '⊕ Sign Up'}
                </button>
                <div
                    className="flex h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {error && (
                        <p className="text-sm text-red-400 w-full text-center">✗ {error}</p>
                    )}
                </div>
            </div>
        </form>
    );
}

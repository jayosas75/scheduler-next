'use client';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import ThemeSwitcher from './theme-switcher';
import SoundToggle from './sound-toggle';

export default function Header() {
    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
    }

    return (
        <header className="flex h-16 w-full items-center justify-between border-b border-cyan-500/30 px-6 bg-black/80 backdrop-blur-md sticky top-0 z-50 glow">
            <div className="flex items-center gap-4">
                <Link href="/calendar" className="font-black text-xl tracking-widest title-shine">
                    SCHEDULER // 2026
                </Link>
                <nav className="hidden md:flex gap-4 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    <Link href="/calendar" className="hover:text-cyan-300 transition">Calendar</Link>
                    <Link href="/calendar/import" className="hover:text-cyan-300 transition">Import</Link>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <SoundToggle />
                <ThemeSwitcher />
                <button
                    onClick={handleSignOut}
                    className="text-xs font-bold text-red-400 hover:text-red-300 transition uppercase tracking-wider"
                >
                    ⊗ Sign Out
                </button>
            </div>
        </header>
    );
}

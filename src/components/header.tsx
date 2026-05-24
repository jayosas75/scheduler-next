'use client';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import ThemeSwitcher from './theme-switcher';
import SoundToggle from './sound-toggle';
import { generateICal } from '@/lib/calendar';
import { playSound } from '@/lib/sound';

export default function Header() {
    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
    }

    // Export the user's full schedule as an .ics file. The header has no event
    // state, so it fetches the full set from the API and builds the file itself.
    const handleExport = async () => {
        playSound('save');
        try {
            const res = await fetch('/api/events');
            if (!res.ok) {
                alert('Could not load your events to export. Please try again.');
                return;
            }
            const events = await res.json();
            const ical = generateICal(events);
            const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `calendar-export-${format(new Date(), 'yyyy-MM-dd')}.ics`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed. Please try again.');
        }
    };

    return (
        <header className="flex h-16 w-full items-center justify-between border-b border-cyan-500/30 px-6 bg-black/80 backdrop-blur-md sticky top-0 z-50 glow">
            <div className="flex items-center gap-4">
                <Link href="/calendar" className="font-black text-xl tracking-widest title-shine">
                    SCHEDULER // 2026
                </Link>
                <nav className="hidden md:flex items-center gap-4 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    <Link href="/calendar" className="hover:text-cyan-300 transition">Calendar</Link>
                    <Link href="/calendar/import" className="hover:text-cyan-300 transition">Import</Link>
                    <button
                        onClick={handleExport}
                        title="Download an iCal (.ics) file of your full schedule — import it into Google or Apple Calendar"
                        className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition uppercase tracking-widest"
                    >
                        <Download size={12} />
                        Export
                    </button>
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

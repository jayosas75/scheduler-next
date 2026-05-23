'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Share2, Check } from 'lucide-react';
import VisitorCounter from './visitor-counter';

export default function Footer() {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.origin : '';
        const shareData = {
            title: 'Scheduler // 2026',
            text: 'Jack into the neon time matrix — a cyberpunk calendar for 2026.',
            url,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            // user dismissed the share sheet — no-op
        }
    };

    const handleReset = () => {
        if (window.confirm('Reset local preferences? This does not delete your calendar events.')) {
            localStorage.removeItem('yosas-visited');
        }
    };

    return (
        <footer className="bg-black/95 border-t border-cyan-500/30 w-full mt-auto relative z-20">
            <div className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs mb-3">

                    {/* Version & Links */}
                    <div className="flex items-center gap-4 text-cyan-400">
                        <span className="opacity-60">v1.3.0</span>
                        <span className="opacity-30">|</span>
                        <Link href="/about" className="text-yellow-400 hover:text-yellow-300 transition underline">
                            About
                        </Link>
                        <span className="opacity-30">|</span>
                        <button onClick={handleReset} className="text-red-400 hover:text-red-300 transition underline">
                            Reset Local Data
                        </button>
                    </div>

                    {/* Native Share */}
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-1.5 rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition uppercase tracking-widest text-[10px] font-bold"
                    >
                        {copied ? <Check size={14} /> : <Share2 size={14} />}
                        <span>{copied ? 'Link Copied' : 'Transmit'}</span>
                    </button>

                    {/* Retro Visitor Counter */}
                    <VisitorCounter />
                </div>

                {/* Debug info */}
                <div className="text-[10px] text-cyan-400/40 text-center pt-2 border-t border-cyan-500/10 font-mono uppercase tracking-widest">
                    Running in NEON-MATRIX Environment
                </div>
            </div>
        </footer>
    );
}

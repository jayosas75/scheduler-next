'use client';

import { useState, useSyncExternalStore } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { playSound } from '@/lib/sound';
import { QUOTES, getDayIndex } from '@/lib/quotes';

/**
 * Slim "daily transmission" bar — a CSP-safe rotating inspiration line drawn
 * from a local list ([quotes.ts]). Styled to match the legend / nav panels so
 * it blends into the schedule. Shows the quote of the day (deterministic per
 * calendar day) and lets the user cycle to the next transmission by hand.
 */

// Stable refs for useSyncExternalStore. The quote-of-the-day only depends on the
// clock (nothing to subscribe to), so `subscribe` is a no-op. The server snapshot
// is a sentinel (-1) so SSR and the first client paint render the same placeholder
// — that sidesteps any hydration mismatch from reading `new Date()` at render time.
const subscribe = () => () => {};
const getClientDayIndex = () => getDayIndex(new Date(), QUOTES.length);
const getServerDayIndex = () => -1;

export default function InspirationQuote() {
    const dayIndex = useSyncExternalStore(subscribe, getClientDayIndex, getServerDayIndex);
    const [offset, setOffset] = useState(0);

    const mounted = dayIndex >= 0;
    const quote = QUOTES[(dayIndex + offset) % QUOTES.length];

    const cycle = () => {
        playSound('toggle');
        setOffset((o) => o + 1);
    };

    return (
        <div className="relative bg-black/60 border border-cyan-500/30 rounded-2xl px-4 py-3 scanlines glow mb-6 overflow-hidden">
            <div className="flex items-center gap-3">
                <Sparkles
                    className="w-4 h-4 text-cyan-400 shrink-0"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(var(--accent-rgb), 0.7))' }}
                    aria-hidden="true"
                />

                <div className="flex-1 min-w-0">
                    {mounted ? (
                        <p className="text-[12px] sm:text-[13px] leading-snug text-cyan-100/85 font-mono">
                            <span className="text-cyan-400/50 select-none">{'> '}</span>
                            {quote.text}
                            {quote.author && (
                                <span className="text-cyan-300/50"> — {quote.author}</span>
                            )}
                        </p>
                    ) : (
                        <p className="text-[12px] text-cyan-300/40 font-mono animate-pulse select-none">
                            {'// establishing uplink…'}
                        </p>
                    )}
                </div>

                <button
                    onClick={cycle}
                    title="Next transmission"
                    aria-label="Next inspiration"
                    className="group text-cyan-400/50 hover:text-cyan-400 transition-colors shrink-0 p-0.5"
                >
                    <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
                </button>
            </div>
        </div>
    );
}

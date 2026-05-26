'use client';

import { useEffect, useState } from 'react';
import { getSkyPhase, getSunPosition, getPhaseThemeId } from '@/lib/sky';
import { STORAGE_KEY } from './theme-switcher';

// Deterministic "random" star field (computed from index) so there's no
// server/client mismatch — though the layer only renders after mount anyway.
const STARS = Array.from({ length: 44 }, (_, i) => ({
    left: (i * 97.13) % 100,
    top: (i * 53.7) % 72,
    size: (i % 3) + 1,
    delay: (i % 11) * 0.4,
}));

// Background day-cycle sky shown in the page gutters. Progresses with real
// local time (see src/lib/sky.ts). When the "Auto · Sky" theme is active it
// also nudges the global accent so the UI and sky move together through the day.
export default function SkyGutter() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- clock initialized after mount, deliberately avoids an SSR/client time mismatch
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!now) return;
        try {
            if (localStorage.getItem(STORAGE_KEY) === 'sky') {
                document.documentElement.dataset.theme = getPhaseThemeId(now);
            }
        } catch {
            /* storage unavailable */
        }
    }, [now]);

    // Decorative only; render nothing until mounted to avoid hydration mismatch.
    if (!now) return null;

    const phase = getSkyPhase(now);
    const sun = getSunPosition(now);

    return (
        <div className="sky-gutter" data-phase={phase} aria-hidden="true">
            <div className="sky-bg" />
            <div className="sky-horizon" />
            <div className="sky-stars">
                {STARS.map((s, i) => (
                    <span
                        key={i}
                        className="sky-star"
                        style={{
                            left: `${s.left}%`,
                            top: `${s.top}%`,
                            width: `${s.size}px`,
                            height: `${s.size}px`,
                            animationDelay: `${s.delay}s`,
                        }}
                    />
                ))}
            </div>
            <div
                className={`sky-body sky-body--${sun.body}`}
                style={{ left: `${sun.progress * 100}%`, bottom: `${10 + sun.altitude * 55}%` }}
            />
        </div>
    );
}

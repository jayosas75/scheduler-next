'use client';

import { useEffect, useState } from 'react';
import { getSkyPhase, getSunPosition, getPhaseThemeId, getMoonPhase } from '@/lib/sky';
import { STORAGE_KEY } from './theme-switcher';

// Render the moon as a phase-aware SVG: full bright disc with a dark elliptical
// terminator covering the unlit portion. See lib/sky.ts for phase math.
function MoonDisc({ phase, size }: { phase: number; size: number }) {
    const r = 50; // viewBox units (-50..50); actual pixel size comes from `size`
    const cos = Math.cos(2 * Math.PI * phase);
    const xr = r * Math.abs(cos);
    const litOnRight = phase < 0.5;
    const gibbous = (1 - cos) / 2 > 0.5;

    // Outer half-circle: traces the lit side of the moon's outline.
    const sweepOuter = litOnRight ? 1 : 0;
    // Terminator ellipse: bulges away from the lit side for crescents,
    // toward the lit side for gibbous.
    const sweepInner = litOnRight ? (gibbous ? 1 : 0) : gibbous ? 0 : 1;

    const litPath = `M 0,${-r} A ${r},${r} 0 0,${sweepOuter} 0,${r} A ${xr},${r} 0 0,${sweepInner} 0,${-r} Z`;

    return (
        <svg
            width={size}
            height={size}
            viewBox={`${-r - 2} ${-r - 2} ${2 * r + 4} ${2 * r + 4}`}
            style={{ display: 'block', overflow: 'visible' }}
        >
            <defs>
                <radialGradient id="moon-lit" cx="38%" cy="38%" r="65%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="#e2e6f1" />
                    <stop offset="100%" stopColor="#aeb5c5" />
                </radialGradient>
                <radialGradient id="moon-dark" cx="50%" cy="50%" r="55%">
                    <stop offset="0%" stopColor="#1a1d28" />
                    <stop offset="100%" stopColor="#0a0c14" />
                </radialGradient>
            </defs>
            <circle r={r} fill="url(#moon-dark)" />
            <path d={litPath} fill="url(#moon-lit)" />
        </svg>
    );
}

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
            {sun.body === 'sun' ? (
                <div
                    className="sky-body sky-body--sun"
                    style={{
                        left: `${sun.progress * 100}%`,
                        bottom: `${10 + sun.altitude * 55}%`,
                    }}
                />
            ) : (
                <div
                    className="sky-body sky-body--moon"
                    style={{
                        left: `${sun.progress * 100}%`,
                        bottom: `${10 + sun.altitude * 55}%`,
                    }}
                >
                    <MoonDisc phase={getMoonPhase(now)} size={84} />
                </div>
            )}
        </div>
    );
}

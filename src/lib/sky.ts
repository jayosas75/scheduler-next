// Time-of-day model for the day-cycle gutter background and the "Auto · Sky"
// accent theme. Pure + dependency-free so it can be unit-tested in isolation
// (see __tests__/sky.test.ts).
//
// Day runs roughly sunrise ~5:30 → sunset ~19:30. Phases:
//   night  : 20:00–05:00   day    : 07:00–16:00   dusk : 19:00–20:00
//   dawn   : 05:00–07:00   golden : 16:00–19:00

export type SkyPhase = 'night' | 'dawn' | 'day' | 'golden' | 'dusk';

// Accent theme ids that already exist in theme-switcher.tsx / globals.css.
export type SkyThemeName = 'cyan' | 'tokyo' | 'orange' | 'synth';

export const SUNRISE = 5.5; // sun crosses the horizon (going up)
export const SUNSET = 19.5; // sun crosses the horizon (going down)

/** Fractional local hour, e.g. 19:30 → 19.5. */
export function hourOf(date: Date): number {
    return date.getHours() + date.getMinutes() / 60;
}

export function getSkyPhase(date: Date): SkyPhase {
    const t = hourOf(date);
    if (t < 5 || t >= 20) return 'night';
    if (t < 7) return 'dawn';
    if (t < 16) return 'day';
    if (t < 19) return 'golden';
    return 'dusk';
}

// Each phase reuses an existing full accent palette so the whole UI can shift
// through the day with no new CSS.
const PHASE_THEME: Record<SkyPhase, SkyThemeName> = {
    night: 'synth', // deep violet
    dawn: 'tokyo', // rose sunrise
    day: 'cyan', // clear daylight
    golden: 'orange', // golden hour
    dusk: 'tokyo', // pink-violet sunset
};

export function getPhaseThemeId(date: Date): SkyThemeName {
    return PHASE_THEME[getSkyPhase(date)];
}

export interface SunPosition {
    /** Which body is currently up. */
    body: 'sun' | 'moon';
    /** 0 → just risen (left horizon), 1 → about to set (right horizon). */
    progress: number;
    /** 0 at the horizon, 1 at the zenith (peak of the arc). */
    altitude: number;
}

/**
 * Position of the sun (daytime) or moon (night) along a horizon-to-horizon
 * arc. `progress` drives horizontal travel, `altitude` the height.
 */
export function getSunPosition(date: Date): SunPosition {
    const t = hourOf(date);
    const dayLength = SUNSET - SUNRISE; // 14h

    let body: 'sun' | 'moon';
    let progress: number;

    if (t >= SUNRISE && t < SUNSET) {
        body = 'sun';
        progress = (t - SUNRISE) / dayLength;
    } else {
        body = 'moon';
        const nightLength = 24 - dayLength; // 10h
        // Hours elapsed since sunset, wrapping past midnight.
        const since = t >= SUNSET ? t - SUNSET : t + 24 - SUNSET;
        progress = since / nightLength;
    }

    const clamped = Math.min(1, Math.max(0, progress));
    const altitude = Math.sin(clamped * Math.PI); // 0 at horizons, 1 at peak
    return { body, progress: clamped, altitude };
}

// ── Moon phase ────────────────────────────────────────────────────────────
// Phase is essentially a global value: at any given instant the sun-earth-moon
// geometry is identical for all observers (within a fraction of a percent), so
// we just use absolute UTC time. Local timezone only shifts which calendar day
// a given phase falls on — not the phase itself.

/** Average length of one new-moon → next-new-moon cycle (days). */
const SYNODIC_MONTH = 29.530588853;

/** Reference new moon: 2000-01-06 18:14 UTC (a well-known epoch). */
const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

/**
 * Position in the lunar cycle as a fraction in [0, 1).
 *   0    = new moon (dark)        0.25 = first quarter (right half lit)
 *   0.5  = full moon (fully lit)  0.75 = last quarter  (left half lit)
 */
export function getMoonPhase(date: Date): number {
    const days = (date.getTime() - REF_NEW_MOON_MS) / 86_400_000;
    const phase = (days / SYNODIC_MONTH) % 1;
    return phase < 0 ? phase + 1 : phase;
}

/** Illuminated fraction of the disc, 0 (new) → 1 (full). */
export function getMoonIllumination(phase: number): number {
    return (1 - Math.cos(2 * Math.PI * phase)) / 2;
}

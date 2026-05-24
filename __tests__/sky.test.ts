import {
    getSkyPhase,
    getPhaseThemeId,
    getSunPosition,
    hourOf,
    SUNRISE,
    SUNSET,
} from '../src/lib/sky';

let failures = 0;
function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
    } else {
        console.error(`❌ FAIL: ${message}`);
        failures++;
    }
}

// Helper: build a Date at a given hour/minute today (local time).
function at(hour: number, minute = 0): Date {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
}

console.log('🧪 Testing sky (time-of-day) logic...\n');

// --- hourOf ---
assert(hourOf(at(19, 30)) === 19.5, 'hourOf(19:30) === 19.5');
assert(hourOf(at(0, 0)) === 0, 'hourOf(midnight) === 0');

// --- getSkyPhase boundaries ---
assert(getSkyPhase(at(3, 0)) === 'night', '03:00 is night');
assert(getSkyPhase(at(4, 59)) === 'night', '04:59 is night');
assert(getSkyPhase(at(5, 0)) === 'dawn', '05:00 flips to dawn');
assert(getSkyPhase(at(5, 30)) === 'dawn', '05:30 (sunrise) is dawn');
assert(getSkyPhase(at(6, 59)) === 'dawn', '06:59 is dawn');
assert(getSkyPhase(at(7, 0)) === 'day', '07:00 flips to day');
assert(getSkyPhase(at(12, 0)) === 'day', 'noon is day');
assert(getSkyPhase(at(15, 59)) === 'day', '15:59 is day');
assert(getSkyPhase(at(16, 0)) === 'golden', '16:00 flips to golden hour');
assert(getSkyPhase(at(18, 59)) === 'golden', '18:59 is golden hour');
assert(getSkyPhase(at(19, 0)) === 'dusk', '19:00 flips to dusk');
assert(getSkyPhase(at(19, 30)) === 'dusk', '19:30 (sunset) is dusk');
assert(getSkyPhase(at(20, 0)) === 'night', '20:00 flips back to night');
assert(getSkyPhase(at(23, 0)) === 'night', '23:00 is night');

// --- getPhaseThemeId maps to existing palettes ---
assert(getPhaseThemeId(at(5, 30)) === 'tokyo', 'dawn → tokyo accent');
assert(getPhaseThemeId(at(12, 0)) === 'cyan', 'day → cyan accent');
assert(getPhaseThemeId(at(17, 0)) === 'orange', 'golden → orange accent');
assert(getPhaseThemeId(at(19, 30)) === 'tokyo', 'dusk → tokyo accent');
assert(getPhaseThemeId(at(23, 0)) === 'synth', 'night → synth accent');

// --- getSunPosition: sun up during the day, moon at night ---
assert(getSunPosition(at(12, 0)).body === 'sun', 'noon shows the sun');
assert(getSunPosition(at(3, 0)).body === 'moon', '03:00 shows the moon');
assert(getSunPosition(at(22, 0)).body === 'moon', '22:00 shows the moon');

// Altitude is ~0 at the horizons and near peak around midday.
const sunrisePos = getSunPosition(at(Math.floor(SUNRISE), (SUNRISE % 1) * 60));
assert(sunrisePos.altitude < 0.05, 'sun altitude ~0 at sunrise');
const noonPos = getSunPosition(at(12, 30));
assert(noonPos.altitude > 0.95, 'sun altitude near peak around 12:30');
const sunsetPos = getSunPosition(at(Math.floor(SUNSET), (SUNSET % 1) * 60));
assert(sunsetPos.altitude < 0.05, 'sun altitude ~0 at sunset');

// Progress is bounded and increases across the day.
const morning = getSunPosition(at(8, 0)).progress;
const afternoon = getSunPosition(at(17, 0)).progress;
assert(morning >= 0 && afternoon <= 1 && afternoon > morning, 'sun progress increases 08:00 → 17:00 within [0,1]');

console.log(`\n${failures === 0 ? '🎉 All sky tests passed' : `💥 ${failures} test(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);

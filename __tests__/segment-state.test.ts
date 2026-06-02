// Unit tests for the per-segment past/active/future logic that drives the
// "now" treatment on each segment row. Boundary cases here are what make the
// scanline / segment-fade behavior correct.

import { getSegmentState } from '../src/lib/segment-state';

console.log('🧪 Testing per-segment time state...\n');

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
}

// Dinner/Unwind pattern — the one in the user's screenshot.
// Dinner: 0..15. Unwind: 15..60.
assert(getSegmentState(0, 0, 15) === 'active', 'Dinner at minute 0 → active (segment just started)');
assert(getSegmentState(7, 0, 15) === 'active', 'Dinner at minute 7 → active (mid-segment)');
assert(getSegmentState(14, 0, 15) === 'active', 'Dinner at minute 14 → active (last minute)');
assert(getSegmentState(15, 0, 15) === 'past',   'Dinner at minute 15 → past (end is exclusive)');
assert(getSegmentState(30, 0, 15) === 'past',   'Dinner long after → past');

assert(getSegmentState(0, 15, 60)  === 'future', 'Unwind at minute 0 → future (not yet started)');
assert(getSegmentState(14, 15, 60) === 'future', 'Unwind at minute 14 → future');
assert(getSegmentState(15, 15, 60) === 'active', 'Unwind at minute 15 → active (right on the start)');
assert(getSegmentState(20, 15, 60) === 'active', 'Unwind at minute 20 → active (user’s scenario)');
assert(getSegmentState(59, 15, 60) === 'active', 'Unwind at minute 59 → active (last minute of hour)');
assert(getSegmentState(60, 15, 60) === 'past',   'Unwind at minute 60 → past (end of hour)');

// Single-segment hour (legacy event, full hour 0..60)
assert(getSegmentState(0, 0, 60)  === 'active', 'Full-hour at minute 0 → active');
assert(getSegmentState(45, 0, 60) === 'active', 'Full-hour at minute 45 → active');
assert(getSegmentState(60, 0, 60) === 'past',   'Full-hour at minute 60 → past');

// Mid-hour 30-minute segment (e.g. break)
assert(getSegmentState(10, 20, 50) === 'future', 'Mid-hour segment, before start → future');
assert(getSegmentState(20, 20, 50) === 'active', 'Mid-hour segment, on start → active');
assert(getSegmentState(35, 20, 50) === 'active', 'Mid-hour segment, mid → active');
assert(getSegmentState(50, 20, 50) === 'past',   'Mid-hour segment, on end → past');

// Zero-length segment (shouldn't really happen, but should not crash)
assert(getSegmentState(10, 30, 30) === 'future', 'Zero-length segment, before → future');
assert(getSegmentState(30, 30, 30) === 'past',   'Zero-length segment, at point → past (end is exclusive)');

console.log(`\n-----------------------\nTests Completed: ${passed + failed}\nPassed: ${passed}\nFailed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);

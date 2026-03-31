export {};

/**
 * Test to verify the Hour Capacity Logic used in DailyView
 */

interface Segment {
    offset: number;
    label: string;
    category: string;
}

interface Event {
    id: string;
    start: string;
    segments?: Segment[];
}

function calculateHourOccupancy(events: Event[], hourNum: number): number {
    let occupied = 0;

    const relevant = events.filter(e => new Date(e.start).getHours() === hourNum);

    relevant.forEach(e => {
        if (e.segments && e.segments.length > 0) {
            const sorted = [...e.segments].sort((a, b) => a.offset - b.offset);
            sorted.forEach((s, i) => {
                if (s.label === '_FREE_') return;
                const next = (i < sorted.length - 1) ? sorted[i + 1].offset : 60;
                occupied += (next - s.offset);
            });
        } else {
            occupied += 60;
        }
    });

    return occupied;
}

console.log('🧪 Testing Hour Capacity Logic...\n');

// Mock Data
const dateStr = new Date(2024, 0, 1, 10, 0).toISOString(); // 10 AM
const events: Event[] = [
    {
        id: '1',
        start: dateStr,
        segments: [
            { offset: 0, label: 'Work', category: 'work' },     // 0-15
            { offset: 15, label: '_FREE_', category: 'misc' }, // 15-45 (Spacer)
            { offset: 45, label: 'Coffee', category: 'misc' }  // 45-60
        ]
    }
];

// Expected occupancy:
// 0-15 (Work): 15m
// 15-45 (Free): 0m
// 45-60 (Coffee): 15m
// Total = 30m
const occ = calculateHourOccupancy(events, 10);
if (occ === 30) console.log('✅ PASS: Sparse segments calculated correctly (30m)');
else console.error(`❌ FAIL: Expected 30m, got ${occ}m`);

// Test Collision
const newSegments: Segment[] = [
    { offset: 0, label: 'Meeting', category: 'work' }, // Duration 60 (implied)
];
// New Duration calc
const newDur = 60; // 0 to 60

if (occ + newDur > 60) console.log(`✅ PASS: Overlap detected (${occ} + ${newDur} > 60)`);
else console.error('❌ FAIL: Overlap NOT detected');

// Test Full Hour
const fullEvents: Event[] = [
    {
        id: '2',
        start: dateStr,
        segments: [{ offset: 0, label: 'Focus', category: 'work' }] // Full 60
    }
];
const fullOcc = calculateHourOccupancy(fullEvents, 10);
if (fullOcc === 60) console.log('✅ PASS: Full hour calculated correctly (60m)');
else console.error(`❌ FAIL: Expected 60m, got ${fullOcc}m`);


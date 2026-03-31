
import { generateICal, generateDaySummary } from '../src/lib/calendar';

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
    } else {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
}

console.log('🧪 Testing Calendar Utilities...\n');

const mockEvents = [
    {
        id: '1',
        title: 'Morning Briefing',
        start: new Date(2026, 0, 26, 9, 0),
        end: new Date(2026, 0, 26, 10, 0),
        description: 'Sync with the team',
        location: 'Sector 7'
    },
    {
        id: '2',
        title: 'Neural Link Maintenance',
        start: new Date(2026, 0, 26, 14, 30),
        end: new Date(2026, 0, 26, 15, 30),
        description: null,
        location: null
    }
];

const testDate = new Date(2026, 0, 26);

// --- Test generateICal ---
console.log('--- Testing generateICal ---');
const ical = generateICal(mockEvents);

assert(ical.includes('BEGIN:VCALENDAR'), 'Should start with VCALENDAR header');
assert(ical.includes('SUMMARY:Morning Briefing'), 'Should contain the first event title');
assert(ical.includes('SUMMARY:Neural Link Maintenance'), 'Should contain the second event title');
assert(ical.includes('LOCATION:Sector 7'), 'Should contain location if provided');
assert(ical.includes('END:VCALENDAR'), 'Should end with VCALENDAR footer');
assert((ical.match(/BEGIN:VEVENT/g) || []).length === 2, 'Should contain 2 VEVENT blocks');

// --- Test generateDaySummary ---
console.log('\n--- Testing generateDaySummary ---');
const summary = generateDaySummary(testDate, mockEvents);

assert(summary.includes('🌌 SCHEDULER // 2026'), 'Should contain the app title');
assert(summary.includes('Monday, Jan 26th, 2026'), 'Should contain the formatted date');
assert(summary.includes('[ 09:00 AM ] Morning Briefing'), 'Should contain formatted event time and title');
assert(summary.includes('[ 02:30 PM ] Neural Link Maintenance'), 'Should contain formatted time for PM event');

const emptySummary = generateDaySummary(testDate, []);
assert(emptySummary.includes('// NO TASKS RECORDED'), 'Should show placeholder for empty events');

console.log('\nAll calendar utility tests passed!');

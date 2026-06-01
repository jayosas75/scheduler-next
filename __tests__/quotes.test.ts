import { QUOTES, getDayIndex, getQuoteForDay } from '../src/lib/quotes';

console.log('🧪 Running Inspiration Quotes Tests...\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
    }
}

function AssertEqual(actual: unknown, expected: unknown, message: string) {
    if (actual === expected) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        console.error(`   Expected: ${expected}`);
        console.error(`   Actual:   ${actual}`);
        failed++;
    }
}

// --- List integrity ---
console.log('--- Testing QUOTES list ---');
assert(QUOTES.length > 0, 'Quote list should not be empty');
assert(QUOTES.every(q => typeof q.text === 'string' && q.text.trim().length > 0), 'Every quote has non-empty text');
assert(QUOTES.every(q => q.author === undefined || (typeof q.author === 'string' && q.author.length > 0)), 'Authors, when present, are non-empty strings');

// --- getDayIndex: determinism ---
console.log('\n--- Testing getDayIndex determinism ---');
const d = new Date(2026, 4, 28); // May 28, 2026
AssertEqual(getDayIndex(d, QUOTES.length), getDayIndex(new Date(2026, 4, 28), QUOTES.length), 'Same calendar day yields the same index');

// --- getDayIndex: bounds across a full year ---
console.log('\n--- Testing getDayIndex bounds ---');
let allInRange = true;
for (let day = 0; day < 366; day++) {
    const date = new Date(2026, 0, 1 + day);
    const idx = getDayIndex(date, QUOTES.length);
    if (idx < 0 || idx >= QUOTES.length || !Number.isInteger(idx)) {
        allInRange = false;
        break;
    }
}
assert(allInRange, 'Index stays an integer within [0, length) for every day of the year');

// --- getDayIndex: consecutive days rotate ---
console.log('\n--- Testing rotation ---');
const day1 = getDayIndex(new Date(2026, 4, 28), QUOTES.length);
const day2 = getDayIndex(new Date(2026, 4, 29), QUOTES.length);
AssertEqual(day2, (day1 + 1) % QUOTES.length, 'Next day advances the index by one (mod length)');

// --- getDayIndex: defensive length handling ---
console.log('\n--- Testing defensive handling ---');
AssertEqual(getDayIndex(d, 0), 0, 'Zero-length list returns 0 (no crash / no NaN)');

// --- getQuoteForDay ---
console.log('\n--- Testing getQuoteForDay ---');
const q = getQuoteForDay(d);
assert(QUOTES.includes(q), 'getQuoteForDay returns an entry from the list');

// Final Report
console.log('\n-----------------------');
console.log(`Tests Completed: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) process.exit(1);

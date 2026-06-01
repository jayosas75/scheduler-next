import { eventSchema } from '../src/lib/event-schema';

console.log('🧪 Running Event Schema Validation Tests...\n');

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

const base = {
    title: 'Morning Routine',
    description: 'Segments: Stretch, Coffee',
    start: '2026-05-28T08:00:00.000Z',
    end: '2026-05-28T09:00:00.000Z',
    category: 'health',
    segments: [{ offset: 0, label: 'Stretch', category: 'health' }],
};

// --- The reported bug: empty Details => client sends details: null ---
console.log('--- details handling (the reported bug) ---');
const nullDetails = eventSchema.safeParse({ ...base, details: null });
assert(nullDetails.success, 'Accepts details: null (empty Details field no longer 400s)');
if (nullDetails.success) {
    assert(nullDetails.data.details === null, 'null details passes through as null (not sanitized → no crash)');
}

const omittedDetails = eventSchema.safeParse({ ...base });
assert(omittedDetails.success, 'Accepts a missing/omitted details field');

const stringDetails = eventSchema.safeParse({ ...base, details: '  Bring resistance bands <script>  ' });
assert(stringDetails.success, 'Accepts a real details string');
if (stringDetails.success) {
    assert(stringDetails.data.details === 'Bring resistance bands script', 'String details is trimmed + angle-brackets stripped');
}

// --- The same class of bug for the other nullable text columns ---
console.log('\n--- description / location nullability ---');
assert(eventSchema.safeParse({ ...base, description: null }).success, 'Accepts description: null');
assert(eventSchema.safeParse({ ...base, location: null }).success, 'Accepts location: null');

// --- Guard rails still hold ---
console.log('\n--- guard rails still enforced ---');
assert(!eventSchema.safeParse({ ...base, title: '' }).success, 'Still rejects empty title');
assert(!eventSchema.safeParse({ ...base, start: 'not-a-date' }).success, 'Still rejects a malformed start date');
assert(!eventSchema.safeParse({ ...base, details: 123 }).success, 'Still rejects a non-string, non-null details value');

// Final Report
console.log('\n-----------------------');
console.log(`Tests Completed: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) process.exit(1);

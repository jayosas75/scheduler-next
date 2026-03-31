
import { getButtonState } from '../src/lib/calendar';

function assert(condition: boolean, message: string) {
    if (condition) console.log(`✅ PASS: ${message}`);
    else {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
}

console.log('🧪 Testing Button Logic...\n');

// Mock segments
const emptySegments: any[] = [];
const oneShortSegment: any[] = [{ offset: 0, label: 'Work' }]; // Logic assumes it goes to 60, so this will be 'edit'
const mixedWithFree: any[] = [{ offset: 0, label: 'Work' }, { offset: 15, label: '_FREE_' }]; // Useful=15, 2 segments -> 'add'
const threeSegments: any[] = [{ offset: 0 }, { offset: 15 }, { offset: 30 }]; // Useful=60 if no _FREE_, so I need to specify labels
const threeWithFree: any[] = [
    { offset: 0, label: 'Work' },
    { offset: 15, label: '_FREE_' },
    { offset: 30, label: 'Work' }
]; // Useful=30 (0-15 + 30-60 is NOT right, 0-15 and 30-60 is actually 45. Wait.)
// 0-15 (15m Work)
// 15-30 (15m Free)
// 30-60 (30m Work)
// Total useful = 45m. Length = 3. Should be 'add'.

const fourSegments: any[] = [{ offset: 0 }, { offset: 15 }, { offset: 30 }, { offset: 45 }];

// Test cases
assert(getButtonState(emptySegments) === 'add', 'Should show ADD button when empty');
assert(getButtonState(mixedWithFree) === 'add', 'Should show ADD button when space available');
assert(getButtonState(threeWithFree) === 'add', 'Should show ADD button when 3 segments and space available');
assert(getButtonState(fourSegments) === 'edit', 'Should show EDIT button when 4 segments (full slots)');
assert(getButtonState(oneShortSegment) === 'edit', 'Should show EDIT button when 1 segment occupies full hour');

console.log('\nAll button logic tests passed!');

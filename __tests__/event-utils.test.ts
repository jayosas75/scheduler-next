import { generateEventTitle, generateBorderGradient } from '../src/lib/calendar';
import { CATEGORIES } from '../src/types';

interface MockSegment {
    label: string;
    category: string;
    offset: number;
}

console.log('🧪 Running Event Utils Tests...\n');

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

function AssertEqual(actual: any, expected: any, message: string) {
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

// Test generateEventTitle
console.log('--- Testing generateEventTitle ---');

const segments1: MockSegment[] = [
    { label: 'Meeting', category: 'work', offset: 0 },
    { label: 'Deep Work', category: 'work', offset: 15 }
];
AssertEqual(generateEventTitle(segments1), 'Meeting / Deep Work', 'Should join distinct labels');

const segments2: MockSegment[] = [
    { label: 'Meeting', category: 'work', offset: 0 },
    { label: 'Meeting', category: 'work', offset: 15 }
];
AssertEqual(generateEventTitle(segments2), 'Meeting', 'Should deduplicate identical labels');

const segments3: MockSegment[] = [
    { label: 'Cardio', category: 'health', offset: 0 },
    { label: 'Shower', category: 'health', offset: 15 },
    { label: 'Breakfast', category: 'health', offset: 30 }
];
AssertEqual(generateEventTitle(segments3), 'Cardio / Shower / Breakfast', 'Should join multiple distinct labels');

const segmentsEmpty: MockSegment[] = [];
AssertEqual(generateEventTitle(segmentsEmpty), 'Untitled', 'Should return "Untitled" for empty segments');


// Test generateBorderGradient
console.log('\n--- Testing generateBorderGradient ---');

const singleSegment: MockSegment[] = [{ label: 'Work', category: 'work', offset: 0 }];
AssertEqual(generateBorderGradient(singleSegment), CATEGORIES.work.hex, 'Single segment should return flat color');

// Segments render proportionally by offset (minutes into the hour):
// work covers 0–15min (0%–25%), health covers 15–60min (25%–100%).
const mixedSegments: MockSegment[] = [
    { label: 'Work', category: 'work', offset: 0 },
    { label: 'Health', category: 'health', offset: 15 }
];
const expectedGradient1 = `linear-gradient(to bottom, ${CATEGORIES.work.hex} 0%, ${CATEGORIES.work.hex} 25%, ${CATEGORIES.health.hex} 25%, ${CATEGORIES.health.hex} 100%)`;
AssertEqual(generateBorderGradient(mixedSegments), expectedGradient1, 'Mixed segments should return linear gradient');

const sameCategorySegments: MockSegment[] = [
    { label: 'Work', category: 'work', offset: 0 },
    { label: 'Work', category: 'work', offset: 15 }
];
AssertEqual(generateBorderGradient(sameCategorySegments), CATEGORIES.work.hex, 'Same category segments should return flat color');


// Final Report
console.log('\n-----------------------');
console.log(`Tests Completed: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) process.exit(1);

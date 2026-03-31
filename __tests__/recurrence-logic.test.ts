/**
 * Simple unit tests for recurrence logic
 * Run with: npx tsx __tests__/recurrence-logic.test.ts
 */

import { expandRecurringEvent, getNextOccurrence, expandEvents } from '../src/lib/recurrence-utils';
import { addDays, addWeeks, addMonths } from 'date-fns';

const passedTests: string[] = [];
const failedTests: { name: string; error: string }[] = [];

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passedTests.push(name);
    } catch (error: any) {
        console.log(`✗ ${name}`);
        console.log(`  ${error.message}`);
        failedTests.push({ name, error: error.message });
    }
}

function expect(actual: any) {
    return {
        toBe(expected: any) {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toEqual(expected: any) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toBeGreaterThan(expected: number) {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeLessThanOrEqual(expected: number) {
            if (actual > expected) {
                throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
            }
        }
    };
}

console.log('\n🔄 Recurring Events Logic Tests\n');

// Test 1: getNextOccurrence for daily recurrence
test('getNextOccurrence should return next day for daily recurrence', () => {
    const baseDate = new Date(2026, 0, 1);
    const nextDate = getNextOccurrence(baseDate, 'daily');
    const expected = addDays(baseDate, 1);
    expect(nextDate?.toISOString()).toBe(expected.toISOString());
});

// Test 2: getNextOccurrence for weekly recurrence
test('getNextOccurrence should return next week for weekly recurrence', () => {
    const baseDate = new Date(2026, 0, 1);
    const nextDate = getNextOccurrence(baseDate, 'weekly');
    const expected = addWeeks(baseDate, 1);
    expect(nextDate?.toISOString()).toBe(expected.toISOString());
});

// Test 3: getNextOccurrence for monthly recurrence
test('getNextOccurrence should return next month for monthly recurrence', () => {
    const baseDate = new Date(2026, 0, 1);
    const nextDate = getNextOccurrence(baseDate, 'monthly');
    const expected = addMonths(baseDate, 1);
    expect(nextDate?.toISOString()).toBe(expected.toISOString());
});

// Test 4: getNextOccurrence for null rule
test('getNextOccurrence should return null for non-recurring events', () => {
    const baseDate = new Date(2026, 0, 1);
    const nextDate = getNextOccurrence(baseDate, null);
    expect(nextDate).toBe(null);
});

// Test 5: expandRecurringEvent for daily recurrence
test('expandRecurringEvent should expand daily event correctly', () => {
    const event = {
        id: 'test-1',
        title: 'Daily Standup',
        start: new Date(2026, 0, 1, 10, 0),
        end: new Date(2026, 0, 1, 10, 30),
        allDay: false,
        category: 'work',
        recurrenceRule: 'daily' as const,
    };

    const rangeStart = new Date(2026, 0, 1);
    const rangeEnd = new Date(2026, 0, 5);

    const expanded = expandRecurringEvent(event, rangeStart, rangeEnd);
    expect(expanded.length).toBeGreaterThan(2); // Should have multiple instances
});

// Test 6: expandRecurringEvent with recurrenceEnd
test('expandRecurringEvent should respect recurrenceEnd date', () => {
    const event = {
        id: 'test-2',
        title: 'Limited Event',
        start: new Date(2026, 0, 1, 14, 0),
        end: new Date(2026, 0, 1, 15, 0),
        allDay: false,
        category: 'misc',
        recurrenceRule: 'daily' as const,
        recurrenceEnd: new Date(2026, 0, 3),
    };

    const rangeStart = new Date(2026, 0, 1);
    const rangeEnd = new Date(2026, 0, 10);

    const expanded = expandRecurringEvent(event, rangeStart, rangeEnd);
    expect(expanded.length).toBeLessThanOrEqual(3);
});

// Test 7: Virtual IDs
test('Recurring event instances should have unique virtual IDs', () => {
    const event = {
        id: 'test-3',
        title: 'Weekly Meeting',
        start: new Date(2026, 0, 1, 9, 0),
        end: new Date(2026, 0, 1, 10, 0),
        allDay: false,
        category: 'work',
        recurrenceRule: 'weekly' as const,
    };

    const rangeStart = new Date(2026, 0, 1);
    const rangeEnd = new Date(2026, 1, 1);

    const expanded = expandRecurringEvent(event, rangeStart, rangeEnd);
    const ids = expanded.map(e => e.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
});

// Test 8: expandEvents with multiple events
test('expandEvents should expand multiple events correctly', () => {
    const events = [
        {
            id: 'event-1',
            title: 'Daily Task',
            start: new Date(2026, 0, 1, 10, 0),
            end: new Date(2026, 0, 1, 10, 30),
            allDay: false,
            category: 'work',
            recurrenceRule: 'daily' as const,
        },
        {
            id: 'event-2',
            title: 'One-time Meeting',
            start: new Date(2026, 0, 2, 14, 0),
            end: new Date(2026, 0, 2, 15, 0),
            allDay: false,
            category: 'work',
            recurrenceRule: null,
        },
    ];

    const rangeStart = new Date(2026, 0, 1);
    const rangeEnd = new Date(2026, 0, 4);

    const expanded = expandEvents(events, rangeStart, rangeEnd);
    expect(expanded.length).toBeGreaterThan(3);
});

// Results Summary
console.log(`\n📊 Results: ${passedTests.length} passed, ${failedTests.length} failed\n`);

if (failedTests.length > 0) {
    console.log('Failed Tests:');
    failedTests.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
    process.exit(1);
} else {
    console.log('✅ All tests passed!');
    process.exit(0);
}

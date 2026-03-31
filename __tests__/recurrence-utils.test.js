#!/usr/bin/env node

/**
 * Test suite for recurring events functionality
 * Tests recurrence utility functions and event expansion logic
 */

const path = require('path');
const fs = require('fs');

// Dynamic import for ESM module
async function runTests() {
    const { pathToFileURL } = await import('url');
    const recurrenceUtilsPath = pathToFileURL(path.join(__dirname, '../src/lib/recurrence-utils.ts')).href;
    const { expandRecurringEvent, getNextOccurrence, expandEvents } = await import(recurrenceUtilsPath);
    const { addDays, addWeeks, addMonths } = await import('date-fns');

    const passedTests = [];
    const failedTests = [];

    function test(name, fn) {
        try {
            fn();
            console.log(`✓ ${name}`);
            passedTests.push(name);
        } catch (error) {
            console.log(`✗ ${name}`);
            console.log(`  ${error.message}`);
            failedTests.push({ name, error: error.message });
        }
    }

    function expect(actual) {
        return {
            toBe(expected) {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toEqual(expected) {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toBeGreaterThan(expected) {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThanOrEqual(expected) {
                if (actual > expected) {
                    throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
                }
            }
        };
    }

    console.log('\n🔄 Recurring Events Tests\n');

    // Test 1: getNextOccurrence for daily recurrence
    test('getNextOccurrence should return next day for daily recurrence', () => {
        const baseDate = new Date(2026, 0, 1); // Jan 1, 2026
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

    // Test 5: expandRecurringEvent for daily recurrence within range
    test('expandRecurringEvent should expand daily event correctly', () => {
        const event = {
            id: 'test-1',
            title: 'Daily Standup',
            start: new Date(2026, 0, 1, 10, 0),
            end: new Date(2026, 0, 1, 10, 30),
            allDay: false,
            category: 'work',
            recurrenceRule: 'daily',
        };

        const rangeStart = new Date(2026, 0, 1);
        const rangeEnd = new Date(2026, 0, 5); // 5 days

        const expanded = expandRecurringEvent(event, rangeStart, rangeEnd);
        expect(expanded.length).toBe(4); // Days 1, 2, 3, 4 (rangeEnd is exclusive-ish)
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
            recurrenceRule: 'daily',
            recurrenceEnd: new Date(2026, 0, 3), // Ends after 3 days
        };

        const rangeStart = new Date(2026, 0, 1);
        const rangeEnd = new Date(2026, 0, 10);

        const expanded = expandRecurringEvent(event, rangeStart, rangeEnd);
        expect(expanded.length).toBeLessThanOrEqual(3);
    });

    // Test 7: Recurring event IDs should be unique (virtual IDs)
    test('Recurring event instances should have unique virtual IDs', () => {
        const event = {
            id: 'test-3',
            title: 'Weekly Meeting',
            start: new Date(2026, 0, 1, 9, 0),
            end: new Date(2026, 0, 1, 10, 0),
            allDay: false,
            category: 'work',
            recurrenceRule: 'weekly',
        };

        const rangeStart = new Date(2026, 0, 1);
        const rangeEnd = new Date(2026, 1, 1); // About 4 weeks

        const expanded = expandRecurringEvent(event, rangeStart, rangeEnd);
        const ids = expanded.map(e => e.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length); // All IDs should be unique
    });

    // Test 8: expandEvents should handle multiple events
    test('expandEvents should expand multiple events correctly', () => {
        const events = [
            {
                id: 'event-1',
                title: 'Daily Task',
                start: new Date(2026, 0, 1, 10, 0),
                end: new Date(2026, 0, 1, 10, 30),
                allDay: false,
                category: 'work',
                recurrenceRule: 'daily',
            },
            {
                id: 'event-2',
                title: 'One-time Meeting',
                start: new Date(2026, 0, 2, 14, 0),
                end: new Date(2026, 0, 2, 15, 0),
                allDay: false,
                category: 'work',
                recurrenceRule: null, // Non-recurring
            },
        ];

        const rangeStart = new Date(2026, 0, 1);
        const rangeEnd = new Date(2026, 0, 4);

        const expanded = expandEvents(events, rangeStart, rangeEnd);
        expect(expanded.length).toBeGreaterThan(3); // At least 3 daily + 1 one-time
    });

    // Final Report
    process.on('exit', () => {
        const report = `
# Test Report: Recurring Events
**Timestamp**: ${new Date().toLocaleString()}
**Summary**: ${passedTests.length} passed, ${failedTests.length} failed

## Passed Tests
${passedTests.map(p => `- ✓ ${p}`).join('\n')}

${failedTests.length > 0 ? `## Failed Tests\n${failedTests.map(f => `- ✗ ${f.name}\n  > ${f.error}`).join('\n')}` : ''}
`;

        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = path.join(logDir, `recurrence-test-results-${timestamp}.md`);
        fs.writeFileSync(logFile, report);
        console.log(`\n📄 Results logged to: ${logFile}`);

        process.exit(failedTests.length > 0 ? 1 : 0);
    });
}

runTests().catch(err => {
    console.error('Failed to run tests:', err);
    process.exit(1);
});

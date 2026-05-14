#!/usr/bin/env node

/**
 * Drag & Drop Reschedule Logic Tests
 * Tests the pure logic that powers event rescheduling via drag & drop.
 * No DOM or browser APIs required — pure function verification.
 */

const passed = [];
const failed = [];
const fs = require('fs');
const path = require('path');

function test(name, fn) {
    try {
        fn();
        passed.push(name);
    } catch (error) {
        failed.push({ name, error: error.message });
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected)
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        },
        toEqual(expected) {
            const a = JSON.stringify(actual);
            const b = JSON.stringify(expected);
            if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
        },
        toBeTruthy() {
            if (!actual) throw new Error(`Expected truthy, got ${actual}`);
        },
        toBeFalsy() {
            if (actual) throw new Error(`Expected falsy, got ${actual}`);
        },
        toBeGreaterThan(n) {
            if (actual <= n) throw new Error(`Expected ${actual} > ${n}`);
        },
    };
}

// ---------------------------------------------------------------------------
// Helper: mirrors the reschedule logic from DailyView.handleDrop
// ---------------------------------------------------------------------------
function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function computeReschedule(event, targetHourNum, selectedDate) {
    const oldStart = new Date(event.start);
    const oldEnd = new Date(event.end);

    const isSameHour =
        oldStart.getHours() === targetHourNum &&
        isSameDay(oldStart, selectedDate);

    if (isSameHour) return null; // no-op

    const duration = oldEnd.getTime() - oldStart.getTime();
    const newStart = new Date(selectedDate);
    newStart.setHours(targetHourNum, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    return { newStart, newEnd, duration };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log('\n🖱️  Drag & Drop Reschedule Logic Tests\n');

test('Duration should be preserved when rescheduling a 1-hour event', () => {
    const event = {
        id: 'evt-1',
        start: new Date(2026, 4, 14, 9, 0).toISOString(),
        end:   new Date(2026, 4, 14, 10, 0).toISOString(),
    };
    const result = computeReschedule(event, 14, new Date(2026, 4, 14));
    const durationMs = result.newEnd.getTime() - result.newStart.getTime();
    expect(durationMs).toBe(60 * 60 * 1000); // 1 hour
});

test('Duration should be preserved when rescheduling a 30-minute event', () => {
    const event = {
        id: 'evt-2',
        start: new Date(2026, 4, 14, 10, 0).toISOString(),
        end:   new Date(2026, 4, 14, 10, 30).toISOString(),
    };
    const result = computeReschedule(event, 15, new Date(2026, 4, 14));
    const durationMs = result.newEnd.getTime() - result.newStart.getTime();
    expect(durationMs).toBe(30 * 60 * 1000); // 30 minutes
});

test('New start hour should match the target drop hour', () => {
    const event = {
        id: 'evt-3',
        start: new Date(2026, 4, 14, 9, 0).toISOString(),
        end:   new Date(2026, 4, 14, 10, 0).toISOString(),
    };
    const result = computeReschedule(event, 13, new Date(2026, 4, 14));
    expect(result.newStart.getHours()).toBe(13);
});

test('New start minutes should be zeroed on drop', () => {
    const event = {
        id: 'evt-4',
        start: new Date(2026, 4, 14, 9, 45).toISOString(),
        end:   new Date(2026, 4, 14, 10, 45).toISOString(),
    };
    const result = computeReschedule(event, 11, new Date(2026, 4, 14));
    expect(result.newStart.getMinutes()).toBe(0);
});

test('Dropping on same hour and same day should return null (no-op)', () => {
    const event = {
        id: 'evt-5',
        start: new Date(2026, 4, 14, 10, 0).toISOString(),
        end:   new Date(2026, 4, 14, 11, 0).toISOString(),
    };
    const result = computeReschedule(event, 10, new Date(2026, 4, 14));
    expect(result).toBe(null);
});

test('Rescheduling to a different day should use the selectedDate date', () => {
    const event = {
        id: 'evt-6',
        start: new Date(2026, 4, 14, 9, 0).toISOString(),
        end:   new Date(2026, 4, 14, 10, 0).toISOString(),
    };
    const nextDay = new Date(2026, 4, 15); // May 15 in local time
    const result = computeReschedule(event, 9, nextDay);
    // Different day → not a no-op even though same hour number
    expect(result).toBeTruthy();
    expect(result.newStart.getDate()).toBe(15);
    expect(result.newStart.getMonth()).toBe(4); // May (0-indexed)
});

test('PATCH request body shape should include id, start, end ISO strings', () => {
    const event = {
        id: 'evt-7',
        start: new Date(2026, 4, 14, 9, 0).toISOString(),
        end:   new Date(2026, 4, 14, 10, 0).toISOString(),
    };
    const result = computeReschedule(event, 14, new Date(2026, 4, 14));

    const patchBody = {
        id: event.id,
        start: result.newStart.toISOString(),
        end: result.newEnd.toISOString(),
    };

    expect(typeof patchBody.id).toBe('string');
    expect(typeof patchBody.start).toBe('string');
    expect(typeof patchBody.end).toBe('string');
    // ISO strings end with 'Z'
    expect(patchBody.start.endsWith('Z')).toBe(true);
    expect(patchBody.end.endsWith('Z')).toBe(true);
});

test('Multi-hour event duration (2h) should be preserved after reschedule', () => {
    const event = {
        id: 'evt-8',
        start: new Date(2026, 4, 14, 9, 0).toISOString(),
        end:   new Date(2026, 4, 14, 11, 0).toISOString(),
    };
    const result = computeReschedule(event, 14, new Date(2026, 4, 14));
    const durationHours = (result.newEnd.getTime() - result.newStart.getTime()) / (1000 * 60 * 60);
    expect(durationHours).toBe(2);
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('');
passed.forEach(p => console.log(`  ✓ ${p}`));
failed.forEach(f => console.log(`  ✗ ${f.name}\n    → ${f.error}`));

const summary = `\n📊 Results: ${passed.length} passed, ${failed.length} failed\n`;
console.log(summary);

// Write log
function logResult(content) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    const logFile = path.join(logDir, `drag-drop-test-results-${timestamp}.md`);
    fs.writeFileSync(logFile, content);
    console.log(`📄 Results logged to: ${logFile}`);
}

process.on('exit', () => {
    const report = `# Test Report: Drag & Drop Reschedule Logic
**Timestamp**: ${new Date().toLocaleString()}
**Summary**: ${passed.length} passed, ${failed.length} failed

## Passed Tests
${passed.map(p => `- ✓ ${p}`).join('\n')}
${failed.length > 0 ? `\n## Failed Tests\n${failed.map(f => `- ✗ ${f.name}\n  > ${f.error}`).join('\n')}` : ''}
`;
    logResult(report);
});

process.exit(failed.length > 0 ? 1 : 0);

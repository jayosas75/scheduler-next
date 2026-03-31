#!/usr/bin/env node

/**
 * Test suite for recurrence UI components
 * Tests that the recurrence selector dropdown and buttons work correctly
 */

const fs = require('fs');
const path = require('path');

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
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected value to be truthy, got ${actual}`);
            }
        },
        toContain(value) {
            if (!actual.includes(value)) {
                throw new Error(`Expected to contain ${value}`);
            }
        }
    };
}

console.log('\n🎨 Recurrence UI Component Tests\n');

// Test 1: Verify SegmentsModal has recurrence selector
test('SegmentsModal should have recurrence selector UI', () => {
    const modalPath = path.join(__dirname, '../src/components/segments-modal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    expect(modalContent).toContain('data-testid="recurrence-selector"');
    expect(modalContent).toContain('recurrenceRule');
});

// Test 2: Verify recurrence dropdown options
test('Recurrence dropdown should have daily/weekly/monthly options', () => {
    const modalPath = path.join(__dirname, '../src/components/segments-modal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    expect(modalContent).toContain('value="daily"');
    expect(modalContent).toContain('value="weekly"');
    expect(modalContent).toContain('value="monthly"');
    expect(modalContent).toContain('Does not repeat');
});

// Test 3: Verify recurrence end date input appears conditionally
test('Recurrence end date input should appear when recurrenceRule is set', () => {
    const modalPath = path.join(__dirname, '../src/components/segments-modal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    expect(modalContent).toContain('data-testid="recurrence-end-input"');
    expect(modalContent).toContain('type="datetime-local"');
});

// Test 4: Verify recurring icon indicator in DailyView
test('DailyView should display recurring event indicator', () => {
    const dailyViewPath = path.join(__dirname, '../src/components/daily-view.tsx');
    const dailyViewContent = fs.readFileSync(dailyViewPath, 'utf-8');

    expect(dailyViewContent).toContain('data-testid="recurring-indicator"');
    expect(dailyViewContent).toContain('event.recurrenceRule');
});

// Test 5: Verify RecurrenceRule type is defined
test('RecurrenceRule type should be defined in types', () => {
    const typesPath = path.join(__dirname, '../src/types/index.ts');
    const typesContent = fs.readFileSync(typesPath, 'utf-8');

    expect(typesContent).toContain('RecurrenceRule');
    expect(typesContent).toContain('daily');
    expect(typesContent).toContain('weekly');
    expect(typesContent).toContain('monthly');
});

// Test 6: Verify API schema accepts recurrence fields
test('API event schema should accept recurrenceRule and recurrenceEnd', () => {
    const apiPath = path.join(__dirname, '../src/app/api/events/route.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    expect(apiContent).toContain('recurrenceRule');
    expect(apiContent).toContain('recurrenceEnd');
});

// Test 7: Verify database schema has recurrence fields
test('Prisma schema should have recurrence fields on Event model', () => {
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    expect(schemaContent).toContain('recurrenceRule');
    expect(schemaContent).toContain('recurrenceEnd');
    expect(schemaContent).toContain('parentEventId');
});

// Test 8: Verify handleSaveSegments accepts recurrence parameters
test('handleSaveSegments should accept recurrence parameters in DailyView', () => {
    const dailyViewPath = path.join(__dirname, '../src/components/daily-view.tsx');
    const dailyViewContent = fs.readFileSync(dailyViewPath, 'utf-8');

    // Should have recurrenceRule parameter
    expect(dailyViewContent).toContain('recurrenceRule?: RecurrenceRule');
    // Should pass it to the event data
    expect(dailyViewContent).toContain('recurrenceRule: recurrenceRule');
});

process.on('exit', () => {
    const report = `
# Test Report: Recurrence UI Components
**Timestamp**: ${new Date().toLocaleString()}
**Summary**: ${passedTests.length} passed, ${failedTests.length} failed

## Passed Tests
${passedTests.map(p => `- ✓ ${p}`).join('\n')}

${failedTests.length > 0 ? `## Failed Tests\n${failedTests.map(f => `- ✗ ${f.name}\n  > ${f.error}`).join('\n')}` : ''}
`;

    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `recurrence-ui-test-results-${timestamp}.md`);
    fs.writeFileSync(logFile, report);
    console.log(`\n📄 Results logged to: ${logFile}`);

    process.exit(failedTests.length > 0 ? 1 : 0);
});

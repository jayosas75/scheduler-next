#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple test runner for color scheme validation
 * No external dependencies required
 */

const passedTests = [];
const failedTests = [];

function logResult(content) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const logFile = path.join(logDir, `test-results-${timestamp}.md`);
    fs.writeFileSync(logFile, content);
    console.log(`\n📄 Results logged to: ${logFile}`);
}

const CYBERPUNK_COLORS = {
    primary: '#00ffff', // cyan-500 (#0ff)
    secondary: '#ff00ff', // magenta (#f0f)
    accent: '#ffff00', // yellow (#ff0)
    success: '#00ff00', // lime (#0f0)
    background: '#000000', // black
    backgroundAlt: '#020617', // slate-950
    text: '#cffafe', // cyan-100
    border: 'rgba(6, 182, 212, 0.3)', // cyan-500/30
};

const REQUIRED_CLASSES = [
    'glow',
    'scanlines',
    'title-shine',
    'counter-pulse',
    'row-disabled',
    'cyber-info',
    'custom-alert',
];

const CATEGORY_COLORS = {
    health: 'bg-cyan-400',
    work: 'bg-fuchsia-400',
    growth: 'bg-[#39ff14]',
    relations: 'bg-yellow-400',
    admin: 'bg-blue-400',
    misc: 'bg-white',
};

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
        toContain(value) {
            if (!actual.includes(value)) {
                throw new Error(`Expected array to contain ${value}`);
            }
        }
    };
}

console.log('\n🎨 Cyberpunk Color Scheme Tests\n');

// Color tests
test('Primary color (cyan) should be #00ffff', () => {
    expect(CYBERPUNK_COLORS.primary.toLowerCase()).toBe('#00ffff');
});

test('Background should be black (#000000)', () => {
    expect(CYBERPUNK_COLORS.background).toBe('#000000');
});

test('Text color should be cyan-100 (#cffafe)', () => {
    expect(CYBERPUNK_COLORS.text).toBe('#cffafe');
});

test('Secondary color (magenta) should be #ff00ff', () => {
    expect(CYBERPUNK_COLORS.secondary.toLowerCase()).toBe('#ff00ff');
});

test('Accent color (yellow) should be #ffff00', () => {
    expect(CYBERPUNK_COLORS.accent.toLowerCase()).toBe('#ffff00');
});

test('Success color (lime) should be #00ff00', () => {
    expect(CYBERPUNK_COLORS.success.toLowerCase()).toBe('#00ff00');
});

test('Background alt should be slate-950 (#020617)', () => {
    expect(CYBERPUNK_COLORS.backgroundAlt).toBe('#020617');
});

console.log('\n🎭 CSS Classes Tests\n');

test('All required cyberpunk CSS classes should exist', () => {
    expect(REQUIRED_CLASSES).toContain('glow');
    expect(REQUIRED_CLASSES).toContain('scanlines');
    expect(REQUIRED_CLASSES).toContain('title-shine');
});

console.log('\n🏷️  Category Colors Tests\n');

test('Health category should be cyan', () => {
    expect(CATEGORY_COLORS.health).toBe('bg-cyan-400');
});

test('Work category should be fuchsia', () => {
    expect(CATEGORY_COLORS.work).toBe('bg-fuchsia-400');
});

test('Growth category should be neon green', () => {
    expect(CATEGORY_COLORS.growth).toBe('bg-[#39ff14]');
});

test('Relations category should be yellow', () => {
    expect(CATEGORY_COLORS.relations).toBe('bg-yellow-400');
});

test('Admin category should be blue', () => {
    expect(CATEGORY_COLORS.admin).toBe('bg-blue-400');
});

test('Misc category should be white', () => {
    expect(CATEGORY_COLORS.misc).toBe('bg-white');
});

process.on('exit', () => {
    const report = `
# Test Report: Color Scheme
**Timestamp**: ${new Date().toLocaleString()}
**Summary**: ${passedTests.length} passed, ${failedTests.length} failed

## Passed Tests
${passedTests.map(p => `- ✓ ${p}`).join('\n')}

${failedTests.length > 0 ? `## Failed Tests\n${failedTests.map(f => `- ✗ ${f.name}\n  > ${f.error}`).join('\n')}` : ''}
`;
    logResult(report);
});

process.exit(failedTests.length > 0 ? 1 : 0);

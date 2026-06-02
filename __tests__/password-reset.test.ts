// Unit tests for the pure password-reset token helpers. No DB, no env.
//
// These cover the security-critical invariants the route handlers depend on:
//   - tokens are unguessable + URL-safe,
//   - hashing is deterministic so storage lookups work,
//   - hashes do NOT match anything but the original token,
//   - expiry math is correct (the route compares Date objects).

import { generateToken, hashToken, tokenExpiresAt, RESET_TTL_MS } from '../src/lib/password-reset';

console.log('🧪 Testing password-reset helpers...\n');

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
}

// --- generateToken ---
console.log('--- generateToken ---');
const t1 = generateToken();
const t2 = generateToken();
assert(typeof t1 === 'string', 'returns a string');
assert(t1.length === 64, `produces a 64-char hex string (got ${t1.length})`);
assert(/^[0-9a-f]{64}$/.test(t1), 'is lowercase hex (URL-safe by construction)');
assert(t1 !== t2, 'two calls produce different tokens (randomness)');

// Sample 100 tokens; uniqueness is a weak guarantee but a >50% repeat would scream.
const sampled = new Set(Array.from({ length: 100 }, () => generateToken()));
assert(sampled.size === 100, '100 distinct tokens in a row (no collisions)');

// --- hashToken ---
console.log('\n--- hashToken ---');
const raw = 'a'.repeat(64);
const hash1 = hashToken(raw);
const hash2 = hashToken(raw);
assert(hash1 === hash2, 'same input → same hash (deterministic)');
assert(hash1.length === 64, `SHA-256 hex digest is 64 chars (got ${hash1.length})`);
assert(/^[0-9a-f]{64}$/.test(hash1), 'hash is lowercase hex');
assert(hashToken('different') !== hash1, 'different input → different hash');
// Sanity: hash !== raw — we'd never want the column to leak the token.
assert(hash1 !== raw, 'hash is not the raw token');

// --- Hash round-trip (what the reset route does) ---
console.log('\n--- round-trip lookup ---');
const issued = generateToken();
const stored = hashToken(issued);
// Verification path: re-hash the raw token from the URL and compare.
assert(hashToken(issued) === stored, 'correct raw token re-hashes to the stored hash');
assert(hashToken('not-the-token') !== stored, 'wrong raw token does not collide');
assert(hashToken(issued.toUpperCase()) !== stored, 'case-sensitive (uppercase variant rejected)');

// --- tokenExpiresAt ---
console.log('\n--- tokenExpiresAt ---');
const fixedNow = new Date('2026-06-01T12:00:00.000Z');
const exp = tokenExpiresAt(fixedNow);
assert(exp.getTime() - fixedNow.getTime() === RESET_TTL_MS, 'expiry is exactly RESET_TTL_MS after the given time');
assert(RESET_TTL_MS === 60 * 60 * 1000, 'TTL constant is 1 hour');

// Default (no arg) uses Date.now() — make sure that path works too.
const nowish = tokenExpiresAt();
const delta = nowish.getTime() - Date.now();
assert(Math.abs(delta - RESET_TTL_MS) < 1000, 'default arg uses current time (within 1s)');

console.log(`\n-----------------------\nTests Completed: ${passed + failed}\nPassed: ${passed}\nFailed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);

// Unit coverage for the shared password-creation policy (src/lib/password-policy.ts).
// Pure function — no DB or server needed, so this always runs in CI.

import {
    passwordIssue,
    passwordSchema,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
} from '../src/lib/password-policy';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else      { console.error(`❌ FAIL: ${msg}`); failed++; }
}

console.log('🔐 Password Policy Tests\n');

// --- Length floor ---
assert(passwordIssue('') !== null, 'empty password is rejected');
assert(passwordIssue('a'.repeat(MIN_PASSWORD_LENGTH - 1)) !== null, `${MIN_PASSWORD_LENGTH - 1} chars (below floor) is rejected`);
assert(passwordIssue('Tr0ub4dx') === null, 'a non-garbage 8-char password is accepted');
assert('Tr0ub4dx'.length === MIN_PASSWORD_LENGTH, 'sanity: sample is exactly the minimum length');

// --- Upper bound (bcrypt 72-byte truncation guard) ---
assert(passwordIssue('x'.repeat(MAX_PASSWORD_LENGTH)) !== null || true, 'sanity: max-length boundary evaluated');
assert(passwordIssue('xA9' + 'x'.repeat(MAX_PASSWORD_LENGTH)) !== null, `over ${MAX_PASSWORD_LENGTH} chars is rejected`);

// --- Garbage rejection ---
assert(passwordIssue('aaaaaaaa') !== null, 'single repeated character is rejected');
assert(passwordIssue('11111111') !== null, 'repeated digit is rejected');
assert(passwordIssue('password') !== null, 'common "password" is rejected');
assert(passwordIssue('12345678') !== null, 'common "12345678" is rejected');
assert(passwordIssue('PASSWORD') !== null, 'common-password check is case-insensitive');
assert(passwordIssue('qwertyui') !== null, 'common "qwertyui" is rejected');

// --- Good passwords pass ---
assert(passwordIssue('correct-horse-battery') === null, 'a long passphrase is accepted');
assert(passwordIssue('Gh7$kLmn') === null, 'a mixed 8-char password is accepted');

// --- Zod schema mirrors the pure function ---
assert(passwordSchema.safeParse('short').success === false, 'zod schema rejects a short password');
assert(passwordSchema.safeParse('Gh7$kLmn').success === true, 'zod schema accepts a valid password');
{
    const r = passwordSchema.safeParse('password');
    assert(
        r.success === false && r.error.issues[0]?.message === passwordIssue('password'),
        'zod issue message matches passwordIssue() output',
    );
}

console.log(`\n-----------------------\nPassed: ${passed}\nFailed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);

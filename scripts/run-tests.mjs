import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const testDir = join(root, '__tests__');

const files = readdirSync(testDir)
  .filter((f) => /\.test\.(js|ts)$/.test(f))
  .sort();

let failed = 0;
for (const file of files) {
  const path = join(testDir, file);
  // .ts runs through tsx (handles extensionless TS imports); .js runs on plain node.
  // --env-file-if-exists loads .env when present (DB tests), silent in CI without one.
  const envFlag = '--env-file-if-exists=.env';
  const args = file.endsWith('.ts') ? [envFlag, '--import', 'tsx', path] : [envFlag, path];
  console.log(`\n▶ ${file}`);
  const { status } = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: root });
  if (status !== 0) failed++;
}

console.log(`\n${failed === 0 ? '✓ all suites passed' : `✗ ${failed} suite(s) failed`} (${files.length} total)`);
process.exit(failed === 0 ? 0 : 1);

import { spawnSync } from 'node:child_process';

const scripts = ['sync-bills.ts', 'sync-rfis.ts', 'sync-hearings.ts'];

for (const s of scripts) {
  console.log(`\n=== ${s} ===`);
  const result = spawnSync('npx', ['tsx', `scripts/${s}`], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`\n${s} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}
console.log('\nAll syncs completed.');

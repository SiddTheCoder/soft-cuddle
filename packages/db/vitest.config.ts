import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// The workspace keeps one .env.local at the root; Vite would only look inside
// this package. Load it here so `pnpm test` needs no wrapper.
const envPath = resolve(__dirname, '../../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match as unknown as [string, string, string];
    process.env[key] ??= rawValue.replace(/^["']|["']$/g, '');
  }
}

export default defineConfig({
  test: {
    // The constraints are the logic — these run against a real Postgres,
    // never a mock (docs/TESTING.md §1).
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    // Ledger tests share fixture rows; running them in parallel would make
    // sequence allocation and period status flip under each other.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

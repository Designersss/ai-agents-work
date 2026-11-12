import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

test('social logins are not configured on API', () => {
  const auth = readFileSync(new URL('../src/auth.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(auth, /socialProviders\s*:/);
  assert.match(auth, /requireEmailVerification:\s*true/);
  assert.match(auth, /revokeSessionsOnPasswordReset:\s*true/);
});

test('no test credit or provider simulation exists in runtime', () => {
  const src = readFileSync(new URL('../src/auth.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /seed.credit|mock.provide|fake.balance/i);
});

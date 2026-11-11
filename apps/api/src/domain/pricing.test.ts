import assert from 'node:assert/strict';
import { test } from 'node:test';
import { costKopecks, reserveKopecks, parseRate } from './pricing.js';

test('rounds a single usage cost up only once', () => {
  assert.equal(costKopecks(100, 100, { input: 10_000, output: 40_000 }), 5);
  assert.equal(costKopecks(1, 1, { input: 1, output: 1 }), 1);
  assert.equal(costKopecks(0, 0, { input: 100, output: 100 }), 0);
});
test('validates rates and rejects overflows', () => {
  assert.equal(parseRate('123', 'test'), 123);
  for (const x of ['', '0', '-1', '1.5', 'a', '9007199254740999']) assert.throws(() => parseRate(x, 'test'));
  assert.throws(() => costKopecks(-1, 1, { input: 10, output: 10 }));
  assert.throws(() => costKopecks(Number.MAX_SAFE_INTEGER, 0, { input: 2_000_000, output: 10 }));
});
test('reserve is non-zero and scales with prompt size', () => {
  const rates = { input: 100_000, output: 200_000 };
  assert.ok(reserveKopecks('a', rates) >= 1);
  assert.ok(reserveKopecks('a'.repeat(2000), rates) > reserveKopecks('a', rates));
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
test('UI requires session and Workspace before sending a live request', () => {
  assert.match(source, /authClient\.useSession\(\)/);
  assert.match(source, /!session\?\.user/);
  assert.match(source, /credentials: 'include'/);
  assert.match(source, /workspaceId: selected/);
  assert.match(source, /key: crypto\.randomUUID\(\)/);
  assert.match(source, /idempotencyKey: inFlight\.current!\.key/);
  assert.match(source, /same = inFlight\.current\?/);
  assert.match(source, /!selected/);
  assert.doesNotMatch(source, /mockAnswer|fakeResponse|Math\.random\(\).*answer/);
});

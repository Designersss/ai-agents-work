import 'dotenv/config';
import { pool } from '../src/db/client.js';

const [workspaceId, amountText] = process.argv.slice(2);
const connection = process.env.DATABASE_URL;
if (process.env.NODE_ENV === 'production' || !connection ||
  !['localhost', '127.0.0.1'].includes(new URL(connection).hostname))
  throw new Error('Test credits allowed only for a local development DB');
if (!workspaceId || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(workspaceId))
  throw new Error('Provide a Workspace UUID');
if (!amountText || !/^[1-9][0-9]*$/.test(amountText))
  throw new Error('Provide positive integer kopecks');
const amount = Number(amountText);
if (!Number.isSafeInteger(amount) || amount > 10_000)
  throw new Error('Max local test credit: 100 RUB');
const result = await pool.query(
  'UPDATE aimock_wallets SET available_kopecks=available_kopecks+$1 WHERE workspace_id=$2 RETURNING workspace_id',
  [amount, workspaceId],
);
if (result.rowCount !== 1) throw new Error('Workspace wallet not found');
console.log('Local test credit granted (NOT actual funds).');
await pool.end();

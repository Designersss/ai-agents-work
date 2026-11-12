import { connect } from 'node:net';

function validUrl(value) {
  try { return new URL(value); } catch { return null; }
}

function formatOutcome(ok, detail) {
  console.log((ok ? 'OK   ' : 'FAIL ') + detail);
}

async function checkApi(name, address) {
  try {
    const response = await fetch(address, { signal: AbortSignal.timeout(5000) });
    formatOutcome(response.ok, name + ': HTTP ' + response.status);
    return response.ok;
  } catch {
    formatOutcome(false, name + ': unreachable');
    return false;
  }
}

function tcpConnect(host, port) {
  return new Promise(resolve => {
    const socket = connect({ host, port });
    const done = success => { socket.destroy(); resolve(success); };
    socket.setTimeout(4000);
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
}

async function main() {
  // This command runs only with the developer's local .env. Do not output its
  // values, user passwords, SMTP credentials or token-bearing URLs.
  const keys = [
    'DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL',
    'WEB_ORIGIN', 'NEXT_PUBLIC_API_URL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM'
  ];
  const missing = keys.filter(key => !process.env[key]);
  const secret = process.env.BETTER_AUTH_SECRET ?? '';
  const validSecret = secret.length >= 32 && !secret.startsWith('CHANGE_ME');
  formatOutcome(missing.length === 0, missing.length ? 'Missing settings: ' + missing.join(', ') : 'Required environment keys present');
  formatOutcome(validSecret, 'BETTER_AUTH_SECRET is configured and is not the example value');

  const web = validUrl(process.env.WEB_ORIGIN);
  const api = validUrl(process.env.BETTER_AUTH_URL);
  const clientApi = validUrl(process.env.NEXT_PUBLIC_API_URL);
  const matchingApi = !!api && !!clientApi && api.origin === clientApi.origin;
  formatOutcome(matchingApi, 'Backend and browser API origins match');
  const matchingWeb = !!web && web.protocol === 'http:' && web.hostname === 'localhost' && web.port === '3000';
  formatOutcome(matchingWeb, 'Local web origin is http://localhost:3000 (do not mix localhost and 127.0.0.1)');
  const smtpPort = Number(process.env.SMTP_PORT);
  const smtpValid = Boolean(process.env.SMTP_HOST && Number.isInteger(smtpPort) && smtpPort > 0 && smtpPort <= 65535);
  formatOutcome(smtpValid, 'SMTP host/port are valid');
  let smtpReachable = false;
  if (smtpValid) {
    smtpReachable = await tcpConnect(process.env.SMTP_HOST, smtpPort);
    formatOutcome(smtpReachable, 'SMTP TCP connection');
  }

  let liveness = false;
  let readiness = false;
  if (api) {
    liveness = await checkApi('NestJS process', new URL('/v1/health', api).toString());
    readiness = await checkApi('Database + SMTP readiness', new URL('/v1/ready', api).toString());
  }

  const ok = missing.length === 0 && validSecret && matchingApi && matchingWeb &&
    smtpValid && smtpReachable && liveness && readiness;
  console.log(ok
    ? '\nEnvironment is ready for email registration.'
    : '\nRegistration is not ready. See README.md (Local email testing / Troubleshooting).');
  process.exitCode = ok ? 0 : 1;
}

await main();

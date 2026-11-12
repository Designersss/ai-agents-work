import { connect } from 'node:net';

function asUrl(value) {
  try { return new URL(value); } catch { return null; }
}
function result(ok, name) {
  console.log((ok ? 'OK   ' : 'FAIL ') + name);
}
async function checkHttp(name, base, path) {
  try {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(12000) });
    result(response.ok, name + ': HTTP ' + response.status);
    return response.ok;
  } catch {
    result(false, name + ': unavailable');
    return false;
  }
}
function tcpConnect(host, port) {
  return new Promise(resolve => {
    const socket = connect({ host, port });
    const done = ok => { socket.destroy(); resolve(ok); };
    socket.setTimeout(7000);
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
}

async function main() {
  // Never print passwords, tokens, SMTP credentials or sender/recipient addresses.
  const keys = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL',
    'WEB_ORIGIN', 'NEXT_PUBLIC_API_URL', 'SMTP_HOST', 'SMTP_PORT',
    'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
  const missing = keys.filter(key => !process.env[key]?.trim());
  result(missing.length === 0,
    missing.length ? 'Missing variables: ' + missing.join(', ') : 'Required variables provided');

  const secret = process.env.BETTER_AUTH_SECRET ?? '';
  const secretOk = secret.length >= 32 && !secret.startsWith('CHANGE_ME');
  result(secretOk, 'Better Auth secret is configured');

  const web = asUrl(process.env.WEB_ORIGIN);
  const api = asUrl(process.env.BETTER_AUTH_URL);
  const clientApi = asUrl(process.env.NEXT_PUBLIC_API_URL);
  const matchingApi = Boolean(api && clientApi && api.origin === clientApi.origin);
  result(matchingApi, 'API origin is consistent across server and browser');
  const webOk = Boolean(web && ['http:', 'https:'].includes(web.protocol) &&
    (web.protocol === 'https:' || web.hostname === 'localhost'));
  result(webOk, 'Web origin is valid; HTTPS is required for publicly deployed sites');

  const port = Number(process.env.SMTP_PORT);
  const portOk = Boolean(process.env.SMTP_HOST &&
    Number.isInteger(port) && port >= 1 && port <= 65535);
  const secureOk = port !== 465 || process.env.SMTP_SECURE === 'true';
  const senderOk = /[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/.test(process.env.SMTP_FROM ?? '');
  result(portOk && secureOk, 'SMTP host/port/TLS configuration');
  result(senderOk, 'SMTP sender address format (domain verification requires real delivery)');

  let smtpOk = false;
  if (portOk) {
    smtpOk = await tcpConnect(process.env.SMTP_HOST, port);
    result(smtpOk, 'Real SMTP endpoint is reachable');
  }
  let live = false;
  let ready = false;
  if (api) {
    live = await checkHttp('NestJS liveness', api, '/v1/health');
    ready = await checkHttp('PostgreSQL + SMTP authentication readiness', api, '/v1/ready');
  }
  const ok = missing.length === 0 && secretOk && matchingApi && webOk &&
    portOk && secureOk && senderOk && smtpOk && live && ready;
  console.log(ok
    ? '\nServices are reachable. Finish a real email registration to confirm sender domain and mailbox delivery.'
    : '\nRegistration is not ready. Fix the failed checks; see README.md for real SMTP setup.');
  process.exitCode = ok ? 0 : 1;
}
await main();

const required = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'WEB_ORIGIN', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM'] as const;

export function ensureEnvironment(): void {
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing required configuration: ${key}`);
  }
  const secret = process.env.BETTER_AUTH_SECRET!;
  if (secret.length < 32 || secret.startsWith('CHANGE_ME')) throw new Error('BETTER_AUTH_SECRET must be a generated random secret (>=32 chars)');
  const api = new URL(process.env.BETTER_AUTH_URL!);
  const web = new URL(process.env.WEB_ORIGIN!);
  if (process.env.NODE_ENV === 'production') {
    if (api.protocol !== 'https:' || web.protocol !== 'https:') throw new Error('HTTPS is required in production');
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) throw new Error('Authenticated SMTP is required in production');
  }
  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP_PORT');
  const apiPort = Number(process.env.PORT ?? '4000');
  if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535) throw new Error('Invalid PORT');
}

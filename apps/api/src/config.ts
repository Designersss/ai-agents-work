const authRequired = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'WEB_ORIGIN'] as const;
const mailRequired = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM', 'SMTP_USER', 'SMTP_PASSWORD'] as const;

function requireValue(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error('Missing required configuration: ' + key);
  return value;
}

/**
 * Better Auth CLI imports auth.ts to generate/apply its PostgreSQL schema.
 * Migrations need a configured identity database, never a live mail provider.
 */
export function ensureAuthEnvironment(): void {
  for (const key of authRequired) requireValue(key);
  const secret = process.env.BETTER_AUTH_SECRET!;
  if (secret.length < 32 || secret.startsWith('CHANGE_ME')) {
    throw new Error('BETTER_AUTH_SECRET must be a securely generated random secret (at least 32 characters)');
  }
  const authUrl = new URL(process.env.BETTER_AUTH_URL!);
  const webUrl = new URL(process.env.WEB_ORIGIN!);
  if (!['http:', 'https:'].includes(authUrl.protocol) ||
      !['http:', 'https:'].includes(webUrl.protocol)) {
    throw new Error('Invalid BETTER_AUTH_URL or WEB_ORIGIN protocol');
  }
}

export function ensureEnvironment(): void {
  ensureAuthEnvironment();
  // The service cannot accept registrations unless transactional email is configured.
  for (const key of mailRequired) {
    // CI is an isolated infrastructure scenario. No anonymous SMTP in the user runtime.
    if ((key === 'SMTP_USER' || key === 'SMTP_PASSWORD') &&
        process.env.CI === 'true' && process.env.SMTP_HOST === 'localhost') continue;
    requireValue(key);
  }
  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid SMTP_PORT');
  }
  const apiPort = Number(process.env.PORT ?? '4000');
  if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535) {
    throw new Error('Invalid PORT');
  }
  const secure = process.env.SMTP_SECURE === 'true';
  if (!secure && process.env.SMTP_PORT === '465') {
    throw new Error('SMTP_SECURE must be true for port 465');
  }
  if (!/^(?:[^<>]*<)?[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>?$/.test(process.env.SMTP_FROM ?? '')) {
    throw new Error('SMTP_FROM must use an email address at your verified sending domain');
  }
  if (process.env.NODE_ENV === 'production') {
    const api = new URL(process.env.BETTER_AUTH_URL!);
    const web = new URL(process.env.WEB_ORIGIN!);
    if (api.protocol !== 'https:' || web.protocol !== 'https:') {
      throw new Error('HTTPS is required for production auth and web origins');
    }
    if (!secure && process.env.SMTP_PORT !== '587' && process.env.SMTP_PORT !== '2587') {
      throw new Error('Production SMTP requires TLS or STARTTLS');
    }
  }
}

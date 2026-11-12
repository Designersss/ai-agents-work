import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { ensureAuthEnvironment } from './config.js';
import { getMailLocale, sendTransactionalMail } from './mail.js';

ensureAuthEnvironment();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 15,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

export const auth = betterAuth({
  appName: 'Vimla',
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [process.env.WEB_ORIGIN!],
  database: pool,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => {
      await sendTransactionalMail({ to: user.email, url, kind: 'reset', locale: getMailLocale(request) });
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }, request) => {
      await sendTransactionalMail({ to: user.email, url, kind: 'verify', locale: getMailLocale(request) });
    }
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60,
    max: 15,
    customRules: {
      '/sign-in/email': { window: 60, max: 7 },
      '/sign-up/email': { window: 60, max: 5 },
      '/request-password-reset': { window: 60, max: 5 },
      '/send-verification-email': { window: 60, max: 5 }
    }
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production'
  }
});

import { describe, expect, it } from 'vitest';
import { errorKey, validEmail, validName, validPassword } from '../lib/validation';

describe('real email/password auth input validation', () => {
  it('checks email addresses without accepting whitespace', () => {
    expect(validEmail('user@example.com')).toBe(true);
    expect(validEmail('invalid@')).toBe(false);
    expect(validEmail('hello world@example.com')).toBe(false);
  });
  it('enforces Better Auth password size limits', () => {
    expect(validPassword('1234567')).toBe(false);
    expect(validPassword('12345678')).toBe(true);
    expect(validPassword('x'.repeat(129))).toBe(false);
  });
  it('validates human names', () => {
    expect(validName('  A B  ')).toBe(true);
    expect(validName('A')).toBe(false);
    expect(validName('x'.repeat(81))).toBe(false);
  });
  it('never propagates arbitrary backend error messages to UI', () => {
    expect(errorKey('INVALID_EMAIL_OR_PASSWORD')).toBe('invalidCredentials');
    expect(errorKey('EMAIL_NOT_VERIFIED')).toBe('unverifiedEmail');
    expect(errorKey('UNKNOWN_SECRET_BACKEND_ERROR')).toBe('requestFailed');
    expect(errorKey(undefined, 429)).toBe('rateLimited');
    expect(errorKey(undefined, 500)).toBe('serviceUnavailable');
    expect(errorKey(undefined, 503)).toBe('serviceUnavailable');
  });
});

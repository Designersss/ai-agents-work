export function validEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 128;
}

export function validName(value: string): boolean {
  const name = value.trim();
  return name.length >= 2 && name.length <= 80;
}

export type AuthErrorKey = 'invalidCredentials' | 'unverifiedEmail' | 'rateLimited' | 'duplicateEmail' | 'requestFailed';

export function errorKey(code?: string, status?: number): AuthErrorKey {
  if (status === 429 || code === 'TOO_MANY_REQUESTS') return 'rateLimited';
  if (code === 'EMAIL_NOT_VERIFIED' || code === 'EMAIL_NOT_VERIFIED_ERROR') return 'unverifiedEmail';
  if (code === 'INVALID_EMAIL_OR_PASSWORD' || code === 'INVALID_PASSWORD' || code === 'INVALID_CREDENTIALS') return 'invalidCredentials';
  if (code === 'USER_ALREADY_EXISTS' || code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') return 'duplicateEmail';
  return 'requestFailed';
}

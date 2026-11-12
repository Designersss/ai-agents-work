import { validEmail, validName, validPassword } from './validation';

export type AuthField = 'name' | 'email' | 'password';
export type AuthFieldErrorKey = 'requiredField' | 'invalidEmail' | 'invalidName' | 'passwordTooShort';
export type AuthFormMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password' | 'verify-email';

export type AuthFormValues = Record<AuthField, string>;

export function validateAuthForm(
  mode: AuthFormMode,
  values: AuthFormValues
): Partial<Record<AuthField, AuthFieldErrorKey>> {
  const errors: Partial<Record<AuthField, AuthFieldErrorKey>> = {};

  if (mode === 'sign-up') {
    errors.name = !values.name.trim() ? 'requiredField'
      : !validName(values.name) ? 'invalidName' : undefined;
  }

  if (mode !== 'reset-password') {
    errors.email = !values.email.trim() ? 'requiredField'
      : !validEmail(values.email) ? 'invalidEmail' : undefined;
  }

  if (mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') {
    errors.password = !values.password ? 'requiredField'
      : !validPassword(values.password) ? 'passwordTooShort' : undefined;
  }

  return errors;
}

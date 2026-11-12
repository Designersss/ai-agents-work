'use client';

import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { validEmail, validName, validPassword, errorKey } from '../lib/validation';
import { AuthSurface } from './auth-surface';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const subscribeToHydration = () => () => {};
const clientHydrated = () => true;
const serverNotHydrated = () => false;

export type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password' | 'verify-email';

function FormField({
  id, label, type = 'text', autoComplete, value, setValue, showToggle = false
}: {
  id: string; label: string; type?: 'text' | 'email' | 'password';
  autoComplete?: string; value: string; setValue: (value: string) => void;
  showToggle?: boolean;
}) {
  const t = useTranslations('Auth');
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="auth-field">
      <Label htmlFor={id}>{label}</Label>
      <div className="auth-input-wrap">
        <Input
          id={id}
          className="auth-input"
          type={isPassword && visible ? 'text' : type}
          autoComplete={autoComplete}
          inputMode={type === 'email' ? 'email' : undefined}
          spellCheck={false}
          required
          value={value}
          onChange={event => setValue(event.target.value)}
          minLength={isPassword ? 8 : undefined}
          maxLength={isPassword ? 128 : id === 'full-name' ? 80 : 254}
        />
        {showToggle && (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="auth-visibility"
            aria-label={visible ? t('hidePassword') : t('showPassword')}
            aria-pressed={visible}
            onClick={() => setVisible(current => !current)}
          >
            {visible ? <EyeOff size={16} aria-hidden="true"/> : <Eye size={16} aria-hidden="true"/>}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AuthPanel({
  mode, token, invalidResetLink = false, verified = false
}: {
  mode: AuthMode;
  token?: string;
  invalidResetLink?: boolean;
  verified?: boolean;
}) {
  const t = useTranslations('Auth');
  const hydrated = useSyncExternalStore(subscribeToHydration, clientHydrated, serverNotHydrated);
  const router = useRouter();
  const { data: session, isPending: checkingSession } = authClient.useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [issue, setIssue] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if ((mode === 'sign-in' || mode === 'sign-up') && !checkingSession && session?.user) {
      router.replace('/account');
    }
  }, [mode, checkingSession, session?.user, router]);

  const titleKeys: Record<AuthMode, 'signInTitle' | 'registerTitle' | 'forgotTitle' | 'resetTitle' | 'verifyTitle'> = {
    'sign-in': 'signInTitle',
    'sign-up': 'registerTitle',
    'forgot-password': 'forgotTitle',
    'reset-password': 'resetTitle',
    'verify-email': 'verifyTitle'
  };

  const subtitleKeys: Record<'forgot-password' | 'reset-password', 'forgotSubtitle' | 'resetSubtitle'> = {
    'forgot-password': 'forgotSubtitle',
    'reset-password': 'resetSubtitle'
  };

  const description = mode === 'verify-email'
    ? t('verifyBody')
    : mode === 'forgot-password' || mode === 'reset-password'
      ? t(subtitleKeys[mode])
      : undefined;

  const invalidLink = mode === 'reset-password' && (invalidResetLink || !token);
  const isForm = !invalidLink && !(success && (mode === 'forgot-password' || mode === 'reset-password'));

  const busyLabel = mode === 'sign-in' ? 'signingIn'
    : mode === 'sign-up' ? 'creatingAccount'
    : mode === 'reset-password' ? 'saving'
    : 'sending';
  const submitLabel = mode === 'sign-in' ? 'signIn'
    : mode === 'sign-up' ? 'signUp'
    : mode === 'forgot-password' ? 'sendReset'
    : mode === 'reset-password' ? 'resetSubmit'
    : 'sendAgain';

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;
    setIssue('');
    setSuccess('');

    if (mode !== 'reset-password' && !validEmail(email)) {
      setIssue(t('invalidEmail'));
      return;
    }
    if (mode === 'sign-up' && !validName(name)) {
      setIssue(t('invalidName'));
      return;
    }
    if ((mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') && !validPassword(password)) {
      setIssue(t('passwordTooShort'));
      return;
    }

    setPending(true);
    try {
      if (mode === 'sign-in') {
        const result = await authClient.signIn.email({ email: email.trim(), password });
        if (result.error) { setIssue(t(errorKey(result.error.code, result.error.status))); return; }
        router.replace('/account');
      } else if (mode === 'sign-up') {
        const result = await authClient.signUp.email({
          name: name.trim(), email: email.trim(), password,
          callbackURL: window.location.origin + '/sign-in?verified=1'
        });
        if (result.error) { setIssue(t(errorKey(result.error.code, result.error.status))); return; }
        router.replace('/verify-email');
      } else if (mode === 'forgot-password') {
        const result = await authClient.requestPasswordReset({
          email: email.trim(), redirectTo: window.location.origin + '/reset-password'
        });
        if (result.error && result.error.status === 429) {
          setIssue(t('rateLimited')); return;
        }
        if (result.error && result.error.status && result.error.status >= 500) {
          setIssue(t('requestFailed')); return;
        }
        // Never reveal whether an account exists.
        setSuccess(t('forgotSent'));
      } else if (mode === 'verify-email') {
        const result = await authClient.sendVerificationEmail({
          email: email.trim(), callbackURL: window.location.origin + '/sign-in?verified=1'
        });
        if (result.error && result.error.status === 429) {
          setIssue(t('rateLimited')); return;
        }
        if (result.error && result.error.status && result.error.status >= 500) {
          setIssue(t('requestFailed')); return;
        }
        setSuccess(t('resendDone'));
      } else if (mode === 'reset-password' && token) {
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error) {
          setIssue(result.error.status === 400 ? t('invalidLink') : t(errorKey(result.error.code, result.error.status)));
          return;
        }
        setPassword('');
        setSuccess(t('resetDone'));
        window.history.replaceState(null, '', '/reset-password');
      }
    } catch {
      setIssue(t('requestFailed'));
    } finally {
      setPending(false);
    }
  }

  const footer = mode === 'sign-in'
    ? <p>{t('noAccount')} <Link href="/sign-up">{t('createAccount')}</Link></p>
    : mode === 'sign-up'
      ? <p>{t('haveAccount')} <Link href="/sign-in">{t('signIn')}</Link></p>
      : <Link href="/sign-in">{t('backSignIn')}</Link>;

  return (
    <AuthSurface title={t(titleKeys[mode])} description={description} footer={footer}>
      {verified && mode === 'sign-in' && (
        <Alert variant="success" role="status" className="auth-feedback">
          <CheckCircle2 aria-hidden="true"/><AlertDescription>{t('verified')}</AlertDescription>
        </Alert>
      )}
      {invalidLink && (
        <Alert variant="destructive" className="auth-feedback">
          <AlertCircle aria-hidden="true"/><AlertDescription>{t('invalidLink')}</AlertDescription>
        </Alert>
      )}
      {issue && (
        <Alert variant="destructive" className="auth-feedback">
          <AlertCircle aria-hidden="true"/><AlertDescription>{issue}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success" role="status" className="auth-feedback">
          <CheckCircle2 aria-hidden="true"/><AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {isForm && (
        <form className="auth-form" data-ready={hydrated ? 'true' : 'false'}
          onSubmit={event => { void submit(event); }}>
          {mode === 'sign-up' && (
            <FormField id="full-name" label={t('name')} value={name}
              setValue={setName} autoComplete="name"/>
          )}
          {mode !== 'reset-password' && (
            <FormField id="email"
              label={mode === 'verify-email' ? t('resendEmail') : t('email')}
              type="email" value={email} setValue={setEmail} autoComplete="email"/>
          )}
          {(mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') && (
            <FormField id="password"
              label={mode === 'reset-password' ? t('newPassword') : t('password')}
              type="password" value={password} setValue={setPassword}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} showToggle/>
          )}
          {(mode === 'sign-up' || mode === 'reset-password') && (
            <p className="auth-help">{t('passwordRule')}</p>
          )}
          {mode === 'sign-in' && (
            <div className="auth-support-links">
              {/* A full navigation avoids reusing stale form state after sign-out. */}
              <a href="/forgot-password">{t('forgotPassword')}</a>
            </div>
          )}
          <Button className="auth-submit w-full" type="submit"
            disabled={!hydrated || pending ||
              ((mode === 'sign-in' || mode === 'sign-up') && checkingSession)}>
            {pending && <LoaderCircle className="spin" size={16} aria-hidden="true"/>}
            {t(pending ? busyLabel : submitLabel)}
          </Button>
        </form>
      )}
    </AuthSurface>
  );
}

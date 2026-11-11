'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { validEmail, validName, validPassword, errorKey } from '../lib/validation';
import { Brand } from './brand-chrome';

export type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password' | 'verify-email';

function FormField({
  id, label, icon, type = 'text', autoComplete, value, setValue, showToggle = false, required = true
}: {
  id: string; label: string; icon: 'mail' | 'lock' | 'user'; type?: string;
  autoComplete?: string; value: string; setValue: (next: string) => void;
  showToggle?: boolean; required?: boolean;
}) {
  const t = useTranslations('Auth');
  const [visible, setVisible] = useState(false);
  const resolvedType = showToggle ? (visible ? 'text' : 'password') : type;
  const Icon = icon === 'mail' ? Mail : icon === 'lock' ? LockKeyhole : UserRound;

  return <div className="form-field">
    <label htmlFor={id}>{label}</label>
    <div className="field-control">
      <Icon aria-hidden="true" size={17} />
      <input id={id} type={resolvedType} autoComplete={autoComplete} required={required}
        spellCheck={false} value={value} onChange={event => setValue(event.target.value)}
        minLength={icon === 'lock' ? 8 : undefined} maxLength={icon === 'lock' ? 128 : icon === 'user' ? 80 : 254}
        inputMode={icon === 'mail' ? 'email' : undefined}/>
      {showToggle && <button className="password-visibility" type="button"
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        aria-pressed={visible} onClick={() => setVisible(current => !current)}>
        {visible ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}
      </button>}
    </div>
  </div>;
}

export function AuthPanel({ mode, token, invalidResetLink = false, verified = false }:
  { mode: AuthMode; token?: string; invalidResetLink?: boolean; verified?: boolean }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { data: session, isPending: checkingSession } = authClient.useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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
  const subtitleKeys: Record<Exclude<AuthMode, 'verify-email'>, 'signInSubtitle' | 'registerSubtitle' | 'forgotSubtitle' | 'resetSubtitle'> = {
    'sign-in': 'signInSubtitle',
    'sign-up': 'registerSubtitle',
    'forgot-password': 'forgotSubtitle',
    'reset-password': 'resetSubtitle'
  };

  const invalidLink = mode === 'reset-password' && (invalidResetLink || !token);
  const isForm = !invalidLink && !(success && (mode === 'forgot-password' || mode === 'reset-password'));
  const busyLabel = mode === 'sign-in' ? 'signingIn' :
    mode === 'sign-up' ? 'creatingAccount' :
    mode === 'reset-password' ? 'saving' : 'sending';
  const submitLabel = mode === 'sign-in' ? 'signIn' :
    mode === 'sign-up' ? 'signUp' :
    mode === 'forgot-password' ? 'sendReset' :
    mode === 'reset-password' ? 'resetSubmit' : 'sendAgain';

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;
    setIssue(''); setSuccess('');

    if (!validEmail(email) && mode !== 'reset-password') {
      setIssue(t('invalidEmail')); return;
    }
    if (mode === 'sign-up' && !validName(name)) {
      setIssue(t('invalidName')); return;
    }
    if ((mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') && !validPassword(password)) {
      setIssue(t('passwordTooShort')); return;
    }

    setPending(true);
    try {
      if (mode === 'sign-in') {
        const result = await authClient.signIn.email({ email: email.trim(), password, rememberMe });
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
        // Generic response avoids revealing whether an account exists.
        const result = await authClient.requestPasswordReset({
          email: email.trim(), redirectTo: window.location.origin + '/reset-password'
        });
        if (result.error && result.error.status === 429) {
          setIssue(t('rateLimited')); return;
        }
        if (result.error && result.error.status && result.error.status >= 500) {
          setIssue(t('requestFailed')); return;
        }
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
          setIssue(result.error.status === 400 ? t('invalidLink') : t(errorKey(result.error.code, result.error.status))); return;
        }
        setPassword('');
        setSuccess(t('resetDone'));
        // Strip the reset token from the address bar after consuming it.
        window.history.replaceState(null, '', '/reset-password');
      }
    } catch {
      setIssue(t('requestFailed'));
    } finally {
      setPending(false);
    }
  }

  return <article className="auth-card" aria-labelledby="auth-title">
    <div className="card-brand"><Brand /></div>
    <div className="auth-heading">
      {mode === 'verify-email' && <div className="illustration-icon"><Mail size={27} aria-hidden="true" /></div>}
      <h1 id="auth-title">{t(titleKeys[mode])}</h1>
      <p>{mode === 'verify-email' ? t('verifyBody') : t(subtitleKeys[mode])}</p>
    </div>
    {verified && mode === 'sign-in' && <div className="feedback success" role="status">
      <CheckCircle2 size={18} aria-hidden="true"/><span>{t('verified')}</span>
    </div>}
    {invalidLink && <div className="feedback error" role="alert">
      <AlertCircle size={18} aria-hidden="true"/><span>{t('invalidLink')}</span>
    </div>}
    {issue && <div className="feedback error" role="alert">
      <AlertCircle size={18} aria-hidden="true"/><span>{issue}</span>
    </div>}
    {success && <div className="feedback success" role="status">
      <CheckCircle2 size={18} aria-hidden="true"/><span>{success}</span>
    </div>}

    {isForm && <form className="auth-form" onSubmit={event => { void submit(event); }}>
      {mode === 'sign-up' && <FormField id="full-name" label={t('name')} icon="user"
        value={name} setValue={setName} autoComplete="name"/>}
      {mode !== 'reset-password' && <FormField id="email" label={mode === 'verify-email' ? t('resendEmail') : t('email')}
        icon="mail" type="email" value={email} setValue={setEmail} autoComplete="email"/>}
      {(mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') &&
        <FormField id="password" label={mode === 'reset-password' ? t('newPassword') : t('password')}
          icon="lock" type="password" value={password} setValue={setPassword}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} showToggle />}
      {(mode === 'sign-up' || mode === 'reset-password') && <p className="field-helper">{t('passwordRule')}</p>}
      {mode === 'sign-in' && <div className="form-extras">
        <label className="checkbox-label">
          <input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)}/>
          <span>{t('rememberMe')}</span>
        </label>
        <Link href="/forgot-password">{t('forgotPassword')}</Link>
      </div>}
      <button className="primary-button" type="submit" disabled={pending || ((mode === 'sign-in' || mode === 'sign-up') && checkingSession)}>
        {pending ? <><LoaderCircle className="spin" size={18} aria-hidden="true"/>{t(busyLabel)}</> :
          <>{t(submitLabel)} <ArrowRight size={18} aria-hidden="true"/></>}
      </button>
    </form>}

    <footer className="auth-footer">
      {mode === 'sign-in' && <p>{t('noAccount')} <Link href="/sign-up">{t('createAccount')}</Link></p>}
      {mode === 'sign-up' && <p>{t('haveAccount')} <Link href="/sign-in">{t('signIn')}</Link></p>}
      {(mode === 'forgot-password' || mode === 'reset-password' || mode === 'verify-email') &&
        <Link className="back-link" href="/sign-in">{t('backSignIn')}</Link>}
    </footer>
  </article>;
}

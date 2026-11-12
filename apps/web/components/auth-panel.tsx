'use client';

import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound
} from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { validEmail, validName, validPassword, errorKey } from '../lib/validation';
import { Brand } from './brand-chrome';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';

const subscribeToHydration = () => () => {};
const clientHydrated = () => true;
const serverNotHydrated = () => false;

export type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password' | 'verify-email';

function FormField({
  id, label, icon, type = 'text', autoComplete, value, setValue, showToggle = false
}: {
  id: string; label: string; icon: 'mail' | 'lock' | 'user'; type?: string;
  autoComplete?: string; value: string; setValue: (next: string) => void;
  showToggle?: boolean;
}) {
  const t = useTranslations('Auth');
  const [visible, setVisible] = useState(false);
  const resolvedType = showToggle ? (visible ? 'text' : 'password') : type;
  const Icon = icon === 'mail' ? Mail : icon === 'lock' ? LockKeyhole : UserRound;

  return <div className="form-field">
    <Label htmlFor={id}>{label}</Label>
    <div className="control-shell">
      <Icon aria-hidden="true" size={15}/>
      <Input id={id} type={resolvedType} autoComplete={autoComplete} required
        spellCheck={false} value={value} onChange={event => setValue(event.target.value)}
        minLength={icon === 'lock' ? 8 : undefined}
        maxLength={icon === 'lock' ? 128 : icon === 'user' ? 80 : 254}
        inputMode={icon === 'mail' ? 'email' : undefined}
        className="control-input"/>
      {showToggle && <Button type="button" variant="ghost" size="icon"
        className="visibility-button"
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        aria-pressed={visible} onClick={() => setVisible(current => !current)}>
        {visible ? <EyeOff size={15} aria-hidden="true"/> : <Eye size={15} aria-hidden="true"/>}
      </Button>}
    </div>
  </div>;
}

export function AuthPanel({
  mode, token, invalidResetLink = false, verified = false
}: {
  mode: AuthMode; token?: string; invalidResetLink?: boolean; verified?: boolean
}) {
  const t = useTranslations('Auth');
  const hydrated = useSyncExternalStore(subscribeToHydration, clientHydrated, serverNotHydrated);
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
        const result = await authClient.requestPasswordReset({
          email: email.trim(), redirectTo: window.location.origin + '/reset-password'
        });
        if (result.error && result.error.status === 429) {
          setIssue(t('rateLimited')); return;
        }
        if (result.error && result.error.status && result.error.status >= 500) {
          setIssue(t('requestFailed')); return;
        }
        // The same response is shown whether or not the address exists.
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

  return <Card className="auth-card gap-0 py-0" aria-labelledby="auth-title">
    <CardHeader className="auth-card-header gap-0">
      <div className="card-brand"><Brand/></div>
      <CardTitle id="auth-title" className="auth-title">{t(titleKeys[mode])}</CardTitle>
      <CardDescription className="auth-description">
        {mode === 'verify-email' ? t('verifyBody') : t(subtitleKeys[mode])}
      </CardDescription>
    </CardHeader>

    <CardContent className="auth-card-content">
      {verified && mode === 'sign-in' &&
        <Alert variant="success" role="status" className="auth-feedback">
          <CheckCircle2 aria-hidden="true"/><AlertDescription>{t('verified')}</AlertDescription>
        </Alert>}
      {invalidLink &&
        <Alert variant="destructive" className="auth-feedback">
          <AlertCircle aria-hidden="true"/><AlertDescription>{t('invalidLink')}</AlertDescription>
        </Alert>}
      {issue &&
        <Alert variant="destructive" className="auth-feedback">
          <AlertCircle aria-hidden="true"/><AlertDescription>{issue}</AlertDescription>
        </Alert>}
      {success &&
        <Alert variant="success" role="status" className="auth-feedback">
          <CheckCircle2 aria-hidden="true"/><AlertDescription>{success}</AlertDescription>
        </Alert>}

      {isForm && <form className="auth-form" data-ready={hydrated ? 'true' : 'false'}
        onSubmit={event => { void submit(event); }}>
        {mode === 'sign-up' &&
          <FormField id="full-name" label={t('name')} icon="user" value={name}
            setValue={setName} autoComplete="name"/>}
        {mode !== 'reset-password' &&
          <FormField id="email" label={mode === 'verify-email' ? t('resendEmail') : t('email')}
            icon="mail" type="email" value={email} setValue={setEmail} autoComplete="email"/>}
        {(mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') &&
          <FormField id="password" label={mode === 'reset-password' ? t('newPassword') : t('password')}
            icon="lock" type="password" value={password} setValue={setPassword}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} showToggle/>}
        {(mode === 'sign-up' || mode === 'reset-password') &&
          <p className="field-helper">{t('passwordRule')}</p>}
        {mode === 'sign-in' && <div className="form-extras">
          <div className="remember-control">
            <Checkbox id="remember-me" checked={rememberMe}
              onCheckedChange={checked => setRememberMe(checked === true)}/>
            <Label htmlFor="remember-me" className="remember-label">{t('rememberMe')}</Label>
          </div>
          <a href="/forgot-password">{t('forgotPassword')}</a>
        </div>}
        <Button className="auth-submit w-full" type="submit"
          disabled={!hydrated || pending || ((mode === 'sign-in' || mode === 'sign-up') && checkingSession)}>
          {pending ? <><LoaderCircle className="spin" size={15} aria-hidden="true"/>{t(busyLabel)}</> :
            <>{t(submitLabel)} <ArrowRight size={15} aria-hidden="true"/></>}
        </Button>
      </form>}
    </CardContent>

    <CardFooter className="auth-card-footer">
      {mode === 'sign-in' &&
        <p>{t('noAccount')} <Link href="/sign-up">{t('createAccount')}</Link></p>}
      {mode === 'sign-up' &&
        <p>{t('haveAccount')} <Link href="/sign-in">{t('signIn')}</Link></p>}
      {(mode === 'forgot-password' || mode === 'reset-password' || mode === 'verify-email') &&
        <Link href="/sign-in">{t('backSignIn')}</Link>}
    </CardFooter>
  </Card>;
}

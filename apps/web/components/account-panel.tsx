'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, LogOut, LoaderCircle, Mail, ShieldAlert } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { AuthSurface } from './auth-surface';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function AccountPanel() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();
  const [exiting, setExiting] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    if (!isPending && !error && !session?.user) router.replace('/sign-in');
  }, [isPending, error, session, router]);

  if (isPending) return (
    <Card className="auth-surface auth-state" role="status">
      <LoaderCircle className="spin" size={20} aria-hidden="true"/>
      <p>{t('sessionChecking')}</p>
    </Card>
  );

  if (error) return (
    <Card className="auth-surface auth-state" role="alert"><p>{t('requestFailed')}</p></Card>
  );

  if (!session?.user) return (
    <Card className="auth-surface auth-state" role="status"><p>{t('sessionChecking')}</p></Card>
  );

  async function signOut() {
    setLogoutError(false);
    setExiting(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setLogoutError(true);
        return;
      }
      router.replace('/sign-in');
    } catch {
      setLogoutError(true);
    } finally {
      setExiting(false);
    }
  }

  return (
    <AuthSurface title={t('accountTitle')} description={t('accountSubtitle')} headingId="account-title">
      {logoutError && (
        <Alert variant="destructive" className="auth-feedback">
          <ShieldAlert aria-hidden="true"/><AlertDescription>{t('requestFailed')}</AlertDescription>
        </Alert>
      )}
      <div className="account-row">
        <Mail size={17} aria-hidden="true"/>
        <div><small>{t('loggedInAs')}</small><strong>{session.user.email}</strong></div>
      </div>
      <div className="account-row">
        {session.user.emailVerified ?
          <CheckCircle2 size={17} aria-hidden="true"/> :
          <ShieldAlert size={17} aria-hidden="true"/>}
        <span>{session.user.emailVerified ? t('emailVerified') : t('emailNotVerified')}</span>
      </div>
      <Button className="auth-submit w-full auth-logout" type="button" disabled={exiting}
        onClick={() => { void signOut(); }}>
        {exiting ? <LoaderCircle className="spin" size={16} aria-hidden="true"/> :
          <LogOut size={16} aria-hidden="true"/>}
        {t(exiting ? 'logoutBusy' : 'signOut')}
      </Button>
    </AuthSurface>
  );
}

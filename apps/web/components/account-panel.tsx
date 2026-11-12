'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, LogOut, LoaderCircle, Mail, ShieldAlert } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { Brand } from './brand-chrome';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function AccountPanel() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();
  const [exiting, setExiting] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    if (!isPending && !error && !session?.user) router.replace('/sign-in');
  }, [isPending, error, session, router]);

  if (isPending) return <Card className="auth-card state-card" role="status">
    <LoaderCircle className="spin" size={20} aria-hidden="true"/>
    <p>{t('sessionChecking')}</p>
  </Card>;

  if (error) return <Card className="auth-card state-card" role="alert">
    <p>{t('requestFailed')}</p>
  </Card>;

  if (!session?.user) return <Card className="auth-card state-card" role="status">
    <p>{t('sessionChecking')}</p>
  </Card>;

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

  return <Card className="auth-card account-card gap-0 py-0" aria-labelledby="account-title">
    <CardHeader className="auth-card-header gap-0">
      <div className="card-brand"><Brand/></div>
      <CardTitle id="account-title" className="auth-title">{t('accountTitle')}</CardTitle>
      <CardDescription className="auth-description">{t('accountSubtitle')}</CardDescription>
    </CardHeader>
    <CardContent className="auth-card-content account-content">
      {logoutError && <Alert variant="destructive" className="auth-feedback">
        <ShieldAlert aria-hidden="true"/>
        <AlertDescription>{t('requestFailed')}</AlertDescription>
      </Alert>}
      <div className="account-row">
        <Mail size={16} aria-hidden="true"/>
        <div><small>{t('loggedInAs')}</small><strong>{session.user.email}</strong></div>
      </div>
      <div className="account-row">
        {session.user.emailVerified ?
          <CheckCircle2 size={16} aria-hidden="true"/> :
          <ShieldAlert size={16} aria-hidden="true"/>}
        <span>{session.user.emailVerified ? t('emailVerified') : t('emailNotVerified')}</span>
      </div>
      <Button className="auth-submit w-full account-logout" type="button"
        disabled={exiting} onClick={() => { void signOut(); }}>
        {exiting ? <LoaderCircle className="spin" size={15} aria-hidden="true"/> :
          <LogOut size={15} aria-hidden="true"/>}
        {exiting ? t('logoutBusy') : t('signOut')}
      </Button>
    </CardContent>
  </Card>;
}

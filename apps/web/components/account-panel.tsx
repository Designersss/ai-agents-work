'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, LogOut, LoaderCircle, Mail, ShieldAlert } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { Brand } from './brand-chrome';

export function AccountPanel() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!isPending && !error && !session?.user) router.replace('/sign-in');
  }, [isPending, error, session, router]);

  if (isPending) return <section className="auth-card state-card" role="status">
    <LoaderCircle className="spin" size={22} aria-hidden="true"/><p>{t('sessionChecking')}</p>
  </section>;
  if (error) return <section className="auth-card state-card" role="alert"><p>{t('requestFailed')}</p></section>;
  if (!session?.user) return <section className="auth-card state-card" role="status">
    <p>{t('sessionChecking')}</p>
  </section>;

  async function signOut() {
    setExiting(true);
    const { error: signOutError } = await authClient.signOut();
    if (signOutError) { setExiting(false); return; }
    router.replace('/sign-in');
  }

  return <article className="auth-card account-card">
    <div className="card-brand"><Brand /></div>
    <h1>{t('accountTitle')}</h1>
    <p className="account-subtitle">{t('accountSubtitle')}</p>
    <div className="account-row"><Mail size={18} aria-hidden="true"/>
      <div><small>{t('loggedInAs')}</small><strong>{session.user.email}</strong></div>
    </div>
    <div className="account-row">
      {session.user.emailVerified ? <CheckCircle2 size={18} aria-hidden="true"/> : <ShieldAlert size={18} aria-hidden="true"/>}
      <span>{session.user.emailVerified ? t('emailVerified') : t('emailNotVerified')}</span>
    </div>
    <button className="primary-button" type="button" disabled={exiting} onClick={() => { void signOut(); }}>
      {exiting ? <LoaderCircle className="spin" size={18} aria-hidden="true"/> : <LogOut size={18} aria-hidden="true"/>}
      {exiting ? t('logoutBusy') : t('signOut')}
    </button>
  </article>;
}

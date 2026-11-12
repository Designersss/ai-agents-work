'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { Globe2, Moon, Sun, Monitor } from 'lucide-react';
import { VimlaMark } from './vimla-mark';
import { locales, type Locale } from '../lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const subscribeToHydration = () => () => {};
const clientHydrated = () => true;
const serverNotHydrated = () => false;

const names: Record<Locale, string> = {
  ru: 'Русский', en: 'English', 'zh-CN': '简体中文', ja: '日本語', 'sv-SE': 'Svenska'
};
const shortNames: Record<Locale, string> = {
  ru: 'RU', en: 'EN', 'zh-CN': '中文', ja: 'JP', 'sv-SE': 'SV'
};

export function Brand() {
  return <div className="brand" aria-label="Vimla">
    <span className="brand-icon"><VimlaMark size={27} title=""/></span>
    <span>Vimla</span>
  </div>;
}

export function Preferences() {
  const t = useTranslations('Common');
  const authT = useTranslations('Auth');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(subscribeToHydration, clientHydrated, serverNotHydrated);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function changeLocale(next: string): Promise<void> {
    if (!locales.some(item => item === next)) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch('/api/locale', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next })
      });
      if (!response.ok) throw new Error('Locale update failed');
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="preferences">
      <Select value={locale} disabled={busy} onValueChange={value => { void changeLocale(value); }}>
        <SelectTrigger size="sm" aria-label={t('language')} title={t('language')} className="locale-trigger">
          <Globe2 aria-hidden="true" size={15}/>
          <SelectValue>{shortNames[locale]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locales.map(item => <SelectItem key={item} value={item}>{names[item]}</SelectItem>)}
        </SelectContent>
      </Select>

      {hydrated && <Select value={theme ?? 'system'} onValueChange={setTheme}>
        <SelectTrigger size="sm" aria-label={t('theme')} title={t('theme')} className="theme-trigger">
          {theme === 'dark' ? <Moon aria-hidden="true" size={16}/> :
            theme === 'light' ? <Sun aria-hidden="true" size={16}/> :
            <Monitor aria-hidden="true" size={16}/>}
          <span className="sr-only"><SelectValue/></span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">{t('system')}</SelectItem>
          <SelectItem value="light">{t('light')}</SelectItem>
          <SelectItem value="dark">{t('dark')}</SelectItem>
        </SelectContent>
      </Select>}
      {failed && <span role="alert" className="preferences-error">{authT('requestFailed')}</span>}
    </div>
  );
}

export function AuthHeader() {
  return (
    <header className="auth-toolbar">
      <Preferences/>
    </header>
  );
}

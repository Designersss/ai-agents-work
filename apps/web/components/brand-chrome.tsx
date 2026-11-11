'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { Globe2, Moon, Sun, Monitor, ChevronDown } from 'lucide-react';
import { VimlaMark } from './vimla-mark';
import { locales, type Locale } from '../lib/i18n';

const names: Record<Locale, string> = {
  ru: 'Русский', en: 'English', 'zh-CN': '简体中文', ja: '日本語', 'sv-SE': 'Svenska'
};

export function Brand({ size = 'normal' }: { size?: 'normal' | 'small' }) {
  return <div className={'brand brand-' + size}>
    <span className="brand-icon"><VimlaMark size={size === 'small' ? 23 : 31} title="" /></span>
    <span>Vimla</span>
  </div>;
}

export function Preferences() {
  const t = useTranslations('Common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setMounted(true), []);

  async function changeLocale(event: ChangeEvent<HTMLSelectElement>): Promise<void> {
    const next = event.currentTarget.value;
    if (!locales.some(item => item === next)) return;
    setBusy(true);
    try {
      const r = await fetch('/api/locale', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next })
      });
      if (!r.ok) throw new Error('Locale update failed');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return <div className="preferences">
    <label className="select-wrap" title={t('language')} aria-label={t('language')}>
      <Globe2 aria-hidden="true" size={15} />
      <select value={locale} disabled={busy} onChange={event => { void changeLocale(event); }}>
        {locales.map(item => <option key={item} value={item}>{names[item]}</option>)}
      </select>
      <ChevronDown aria-hidden="true" size={14}/>
    </label>
    {mounted && <label className="select-wrap theme-select" title={t('theme')} aria-label={t('theme')}>
      {theme === 'dark' ? <Moon aria-hidden="true" size={15}/> : theme === 'light' ? <Sun aria-hidden="true" size={15}/> : <Monitor aria-hidden="true" size={15}/>}
      <select value={theme ?? 'system'} onChange={e => setTheme(e.target.value)}>
        <option value="system">{t('system')}</option>
        <option value="light">{t('light')}</option>
        <option value="dark">{t('dark')}</option>
      </select>
      <ChevronDown aria-hidden="true" size={14}/>
    </label>}
  </div>;
}

export function AuthHeader() {
  return <header className="site-header">
    <Brand size="small" />
    <Preferences />
  </header>;
}

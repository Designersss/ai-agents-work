import ru from '../messages/ru.json';
import en from '../messages/en.json';
import zhCN from '../messages/zh-CN.json';
import ja from '../messages/ja.json';
import svSE from '../messages/sv-SE.json';

export const locales = ['ru', 'en', 'zh-CN', 'ja', 'sv-SE'] as const;
export type Locale = (typeof locales)[number];
export const supportedLocales: ReadonlySet<string> = new Set(locales);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && supportedLocales.has(value);
}

export function localeFromHeader(value: string | null): Locale {
  if (!value) return 'ru';
  const preferred = value.split(',').map(item => item.split(';')[0]?.trim().toLowerCase()).filter(Boolean);
  for (const code of preferred) {
    if (code?.startsWith('zh')) return 'zh-CN';
    if (code?.startsWith('sv')) return 'sv-SE';
    if (code?.startsWith('ja')) return 'ja';
    if (code?.startsWith('en')) return 'en';
    if (code?.startsWith('ru')) return 'ru';
  }
  return 'ru';
}

export const dictionaries = { ru, en, 'zh-CN': zhCN, ja, 'sv-SE': svSE } as const;

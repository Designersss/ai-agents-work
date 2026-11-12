import { describe, expect, it } from 'vitest';
import { dictionaries, isLocale, localeFromHeader, locales } from '../lib/i18n';

describe('Vimla localization', () => {
  it('supports exactly the five approved locales', () => {
    expect(locales).toEqual(['ru', 'en', 'zh-CN', 'ja', 'sv-SE']);
    expect(isLocale('sv-SE')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });
  it('selects browser language safely', () => {
    expect(localeFromHeader('en-US,en;q=0.9,ru;q=0.5')).toBe('en');
    expect(localeFromHeader('ja-JP,ru;q=0.8')).toBe('ja');
    expect(localeFromHeader('ko-KR,fr;q=0.8')).toBe('ru');
    expect(localeFromHeader(null)).toBe('ru');
  });
  it('all translated auth and common keys exist, and the old brand is absent', () => {
    for (const namespace of ['Common', 'Auth'] as const) {
      const keys = Object.keys(dictionaries.ru[namespace]).sort();
      for (const locale of locales) {
        expect(Object.keys(dictionaries[locale][namespace]).sort()).toEqual(keys);
        for (const val of Object.values(dictionaries[locale][namespace])) {
          expect(val.trim()).not.toBe('');
        }
        expect(JSON.stringify(dictionaries[locale][namespace])).not.toContain('AIMock');
      }
    }
  });
});

import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { dictionaries, isLocale, localeFromHeader } from '../lib/i18n';

export default getRequestConfig(async () => {
  const saved = (await cookies()).get('vimla-locale')?.value;
  const locale = isLocale(saved)
    ? saved
    : localeFromHeader((await headers()).get('accept-language'));

  return {
    locale,
    messages: dictionaries[locale]
  };
});

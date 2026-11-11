import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { Providers } from '../components/providers';
import { dictionaries, isLocale, localeFromHeader } from '../lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Vimla', template: '%s · Vimla' },
  description: 'Vimla — платформа AI-агентов',
  robots: { index: false, follow: false }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const saved = cookieStore.get('vimla-locale')?.value;
  const requestHeaders = await headers();
  const locale = isLocale(saved) ? saved : localeFromHeader(requestHeaders.get('accept-language'));
  return <html lang={locale} suppressHydrationWarning>
    <body>
      <NextIntlClientProvider locale={locale} messages={dictionaries[locale]}>
        <Providers>{children}</Providers>
      </NextIntlClientProvider>
    </body>
  </html>;
}

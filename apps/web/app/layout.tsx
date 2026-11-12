import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Providers } from '../components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Vimla', template: '%s · Vimla' },
  description: 'Vimla — платформа AI-агентов',
  robots: { index: false, follow: false }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return <html lang={locale} suppressHydrationWarning>
    <body>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Providers>{children}</Providers>
      </NextIntlClientProvider>
    </body>
  </html>;
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIMock — Technical Spike',
  description: 'Local testing of authentication, Workspace isolation and AI metering',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}

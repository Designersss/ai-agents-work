import type { ReactNode } from 'react';
import { AuthHeader } from './brand-chrome';

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="page-frame">
    <AuthHeader />
    <main className="page-content">{children}</main>
  </div>;
}

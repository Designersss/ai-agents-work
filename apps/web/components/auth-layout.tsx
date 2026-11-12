import type { ReactNode } from 'react';
import { AuthHeader } from './brand-chrome';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <AuthHeader/>
      <main className="auth-main">{children}</main>
    </div>
  );
}

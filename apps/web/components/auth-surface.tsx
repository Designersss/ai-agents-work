import type { ReactNode } from 'react';
import { Brand } from './brand-chrome';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';

type AuthSurfaceProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  headingId?: string;
  className?: string;
};

// Every account-access screen shares one frameless, centered composition.
// The shadcn Card primitives preserve a consistent layout without drawing a card.
export function AuthSurface({
  title, description, children, footer, headingId = 'auth-title', className
}: AuthSurfaceProps) {
  return (
    <Card className={cn('auth-surface', className)} aria-labelledby={headingId}>
      <CardHeader className="auth-surface-header">
        <div className="auth-brand"><Brand/></div>
        <CardTitle asChild className="auth-heading" >
          <h1 id={headingId}>{title}</h1>
        </CardTitle>
        {description && <CardDescription className="auth-description">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="auth-surface-content">{children}</CardContent>
      {footer && <CardFooter className="auth-surface-footer">{footer}</CardFooter>}
    </Card>
  );
}

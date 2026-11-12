import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva(
  'relative grid grid-cols-[auto_1fr] items-start gap-x-2.5 rounded-md border px-3 py-2.5 text-xs [&>svg]:mt-px [&>svg]:size-4',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
        success: 'border-success/25 bg-success/10 text-success'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);
function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant, className }))} {...props}/>;
}
function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('min-w-0 text-[12px] leading-[1.5]', className)} {...props}/>;
}
export { Alert, AlertDescription };

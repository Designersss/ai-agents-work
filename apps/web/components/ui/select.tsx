'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: 'sm' | 'default' }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'flex h-9 min-w-0 items-center justify-between gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground outline-none transition-colors focus-visible:border-border focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 [&>svg:last-child]:size-3.5 [&>svg:last-child]:shrink-0 [&>svg:last-child]:opacity-65',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild><ChevronDown aria-hidden="true"/></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  align = 'end',
  onPointerDownOutside,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  // Pointer clicks outside should not restore a visible focus halo on the trigger.
  // Keyboard dismissal keeps Radix's focus restoration.
  const dismissedByPointer = React.useRef(false);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        align={align}
        onPointerDownOutside={event => {
          dismissedByPointer.current = true;
          onPointerDownOutside?.(event);
        }}
        onCloseAutoFocus={event => {
          if (dismissedByPointer.current) event.preventDefault();
          dismissedByPointer.current = false;
          onCloseAutoFocus?.(event);
        }}
        className={cn(
          'relative z-50 max-h-[min(300px,var(--radix-select-content-available-height))] min-w-[8rem] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in',
          className
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-5 items-center justify-center text-muted-foreground">
          <ChevronUp className="size-3.5"/>
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-0.5">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-5 items-center justify-center text-muted-foreground">
          <ChevronDown className="size-3.5"/>
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-7 pl-2.5 text-xs outline-none ring-0 hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus-visible:outline-none focus-visible:ring-0 data-[highlighted]:bg-accent data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-1.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator><Check className="size-3.5"/></SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };

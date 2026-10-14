'use client';
import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;
export const SheetTitle = React.forwardRef<React.ElementRef<typeof D.Title>, React.ComponentPropsWithoutRef<typeof D.Title>>(
  ({ className, ...props }, ref) => <D.Title ref={ref} className={cn('text-lg font-bold', className)} {...props} />,
);
SheetTitle.displayName = 'SheetTitle';
export const SheetDescription = D.Description;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof D.Content>,
  React.ComponentPropsWithoutRef<typeof D.Content> & { side?: 'left' | 'right' }
>(({ className, children, side = 'right', ...props }, ref) => (
  <D.Portal>
    <D.Overlay className="fixed inset-0 z-[100] bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <D.Content
      ref={ref}
      className={cn(
        'fixed inset-y-0 z-[101] flex w-[88%] max-w-md flex-col gap-4 bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out',
        side === 'right'
          ? 'right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right'
          : 'left-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
        className,
      )}
      {...props}
    >
      {children}
      <D.Close className="absolute right-4 top-4 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100" aria-label="बंद करें">
        <X className="h-4 w-4" />
      </D.Close>
    </D.Content>
  </D.Portal>
));
SheetContent.displayName = 'SheetContent';

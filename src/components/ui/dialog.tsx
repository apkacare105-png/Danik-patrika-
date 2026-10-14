'use client';
import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof D.Content>,
  React.ComponentPropsWithoutRef<typeof D.Content> & { hideClose?: boolean }
>(({ className, children, hideClose, ...props }, ref) => (
  <D.Portal>
    <D.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <D.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <D.Close className="absolute right-3 top-3 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100" aria-label="बंद करें">
          <X className="h-4 w-4" />
        </D.Close>
      )}
    </D.Content>
  </D.Portal>
));
DialogContent.displayName = 'DialogContent';

export const DialogTitle = React.forwardRef<React.ElementRef<typeof D.Title>, React.ComponentPropsWithoutRef<typeof D.Title>>(
  ({ className, ...props }, ref) => <D.Title ref={ref} className={cn('pr-8 text-lg font-bold', className)} {...props} />,
);
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<React.ElementRef<typeof D.Description>, React.ComponentPropsWithoutRef<typeof D.Description>>(
  ({ className, ...props }, ref) => <D.Description ref={ref} className={cn('mt-1 text-sm text-neutral-500', className)} {...props} />,
);
DialogDescription.displayName = 'DialogDescription';

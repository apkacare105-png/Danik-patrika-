'use client';
import * as React from 'react';
import * as T from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = T.Root;
export const TabsList = React.forwardRef<React.ElementRef<typeof T.List>, React.ComponentPropsWithoutRef<typeof T.List>>(
  ({ className, ...props }, ref) => (
    <T.List ref={ref} className={cn('inline-flex flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-1', className)} {...props} />
  ),
);
TabsList.displayName = 'TabsList';
export const TabsTrigger = React.forwardRef<React.ElementRef<typeof T.Trigger>, React.ComponentPropsWithoutRef<typeof T.Trigger>>(
  ({ className, ...props }, ref) => (
    <T.Trigger
      ref={ref}
      className={cn('rounded-md px-3 py-1.5 text-sm font-semibold text-neutral-600 transition-all data-[state=active]:bg-white data-[state=active]:text-brand data-[state=active]:shadow', className)}
      {...props}
    />
  ),
);
TabsTrigger.displayName = 'TabsTrigger';
export const TabsContent = React.forwardRef<React.ElementRef<typeof T.Content>, React.ComponentPropsWithoutRef<typeof T.Content>>(
  ({ className, ...props }, ref) => <T.Content ref={ref} className={cn('mt-4 focus-visible:outline-none', className)} {...props} />,
);
TabsContent.displayName = 'TabsContent';

'use client';
import * as React from 'react';

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => (
  <div className="flex">{children}</div>
);

export const Sidebar = ({ children, collapsible }: { children: React.ReactNode; collapsible?: 'icon' | 'full' }) => (
  <aside className={`bg-white dark:bg-gray-900 text-black dark:text-white w-64 min-h-screen ${collapsible === 'icon' ? 'collapsed' : ''}`}>
    {children}
  </aside>
);

export const SidebarHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border-b border-gray-200 dark:border-gray-800">{children}</div>
);

export const SidebarContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4">{children}</div>
);

export const SidebarFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border-t border-gray-200 dark:border-gray-800">{children}</div>
);

export const SidebarInset = ({ children }: { children: React.ReactNode }) => (
  <main className="flex-1">{children}</main>
);

export const SidebarTrigger = ({ className }: { className?: string }) => (
  <button className={`text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 ${className}`}>☰</button>
);

export const SidebarRail = () => null;

// Grouping and Menus
export const SidebarGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export const SidebarGroupLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs font-semibold uppercase text-gray-500 px-2 py-1">{children}</div>
);

export const SidebarMenu = ({ children }: { children: React.ReactNode }) => <ul className="space-y-1">{children}</ul>;

export const SidebarMenuItem = ({ children }: { children: React.ReactNode }) => <li>{children}</li>;

import { Slot } from '@radix-ui/react-slot';

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean; tooltip?: string; size?: string }
>(({ children, className = '', asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={`flex items-center w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';


export const SidebarMenuSub = ({ children }: { children: React.ReactNode }) => <ul className="ml-4 space-y-1">{children}</ul>;

export const SidebarMenuSubItem = ({ children }: { children: React.ReactNode }) => <li>{children}</li>;

export const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, className = '', asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={`w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
});
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';


export const SidebarMenuAction = ({ children, showOnHover }: { children: React.ReactNode; showOnHover?: boolean }) => (
  <div className={`ml-auto ${showOnHover ? 'opacity-0 group-hover:opacity-100' : ''}`}>{children}</div>
);

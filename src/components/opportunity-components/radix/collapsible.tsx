'use client';

import * as React from 'react';

type CollapsibleProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
  asChild?: boolean;
  className?: string;
};

export const Collapsible = ({
  children,
  defaultOpen = false,
  className = '',
}: CollapsibleProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div data-state={isOpen ? 'open' : 'closed'} className={`group ${className}`}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        // Automatically pass isOpen and toggle to children if they need it
        return React.cloneElement(child as React.ReactElement<any>, {
          isOpen,
          setIsOpen,
        });
      })}
    </div>
  );
};

type CollapsibleTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
};

export const CollapsibleTrigger = ({
  children,
  isOpen,
  setIsOpen,
}: CollapsibleTriggerProps) => {
  return (
    <div onClick={() => setIsOpen?.(!isOpen)} className="cursor-pointer">
      {children}
    </div>
  );
};

type CollapsibleContentProps = {
  children: React.ReactNode;
  isOpen?: boolean;
};

export const CollapsibleContent = ({
  children,
  isOpen,
}: CollapsibleContentProps) => {
  return (
    <div className={`${isOpen ? 'block' : 'hidden'} pl-4`}>
      {children}
    </div>
  );
};

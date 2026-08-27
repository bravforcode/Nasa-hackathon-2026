/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useRef,
  ReactNode,
  forwardRef,
  KeyboardEvent,
} from 'react';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs compound components must be used within <Tabs>');
  }
  return ctx;
}

export interface TabsProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function TabsRoot<T extends string = string>({
  value,
  onValueChange,
  children,
  className = '',
  id,
}: TabsProps<T>) {
  const baseIdRef = useRef(id || `tabs-${Math.random().toString(36).slice(2, 8)}`);

  return (
    <TabsContext.Provider
      value={{
        value,
        onValueChange: onValueChange as (val: string) => void,
        baseId: baseIdRef.current,
      }}
    >
      <div className={`flex flex-col ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, 'aria-label': ariaLabel, className = '', ...props }, ref) => {
    const listRef = useRef<HTMLDivElement | null>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const container = listRef.current;
      if (!container) return;

      const tabs = Array.from(
        container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      );
      const currentIndex = tabs.findIndex((t) => t === document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      const nextTab = tabs[nextIndex];
      nextTab?.focus();
      nextTab?.click();
    };

    return (
      <div
        ref={(node) => {
          listRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className={`flex border-b border-white/10 px-3 bg-white/5 overflow-x-auto ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = 'Tabs.List';

export interface TabsTriggerProps<T extends string = string>
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: T;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger<T extends string = string>({
  value,
  children,
  className = '',
  ...props
}: TabsTriggerProps<T>) {
  const { value: selectedValue, onValueChange, baseId } = useTabsContext();
  const isSelected = selectedValue === value;
  const triggerId = `${baseId}-trigger-${value}`;
  const contentId = `${baseId}-content-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={triggerId}
      aria-selected={isSelected}
      aria-controls={contentId}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onValueChange(value)}
      className={`px-3.5 py-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
        isSelected
          ? 'border-b-2 border-blue-400 text-blue-300 font-bold'
          : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
TabsTrigger.displayName = 'Tabs.Trigger';

export interface TabsContentProps<T extends string = string>
  extends React.HTMLAttributes<HTMLDivElement> {
  value: T;
  children: ReactNode;
  className?: string;
}

export function TabsContent<T extends string = string>({
  value,
  children,
  className = '',
  ...props
}: TabsContentProps<T>) {
  const { value: selectedValue, baseId } = useTabsContext();
  const isSelected = selectedValue === value;
  const triggerId = `${baseId}-trigger-${value}`;
  const contentId = `${baseId}-content-${value}`;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      id={contentId}
      aria-labelledby={triggerId}
      tabIndex={0}
      className={`outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
TabsContent.displayName = 'Tabs.Content';

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

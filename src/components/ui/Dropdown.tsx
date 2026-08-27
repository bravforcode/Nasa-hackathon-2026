/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useId,
  type ReactNode,
  type ReactElement,
  type FC,
  type KeyboardEvent,
  type MouseEvent,
  cloneElement,
  forwardRef,
} from 'react';

interface DropdownItemData {
  element: HTMLElement | null;
  disabled?: boolean;
  onSelect?: () => void;
}

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuId: string;
  triggerId: string;
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  registerItem: (index: number, data: DropdownItemData) => void;
  unregisterItem: (index: number) => void;
  getItemCount: () => number;
  focusItem: (index: number) => void;
  closeMenu: () => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

export function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown subcomponents must be used within a Dropdown provider');
  }
  return context;
}

export interface DropdownProps {
  children: ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const Dropdown: FC<DropdownProps> & {
  Trigger: typeof DropdownTrigger;
  Menu: typeof DropdownMenu;
  Item: typeof DropdownItem;
  Separator: typeof DropdownSeparator;
  Label: typeof DropdownLabel;
} = ({ children, isOpen: controlledOpen, defaultOpen = false, onOpenChange, className = '' }) => {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemsMap = useRef<Map<number, DropdownItemData>>(new Map());

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const menuId = `${generatedId}-menu`;

  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
    if (!open) {
      setFocusedIndex(-1);
    }
  };

  const closeMenu = () => {
    handleOpenChange(false);
    triggerRef.current?.focus();
  };

  const registerItem = (index: number, data: DropdownItemData) => {
    itemsMap.current.set(index, data);
  };

  const unregisterItem = (index: number) => {
    itemsMap.current.delete(index);
  };

  const getItemCount = () => itemsMap.current.size;

  const focusItem = (index: number) => {
    const item = itemsMap.current.get(index);
    if (item && !item.disabled && item.element) {
      setFocusedIndex(index);
      item.element.focus();
    }
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        handleOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        setIsOpen: handleOpenChange,
        triggerRef,
        menuRef,
        menuId,
        triggerId,
        focusedIndex,
        setFocusedIndex,
        registerItem,
        unregisterItem,
        getItemCount,
        focusItem,
        closeMenu,
      }}
    >
      <div className={`relative inline-block ${className}`}>{children}</div>
    </DropdownContext.Provider>
  );
};

/* =========================================================================
   Dropdown Trigger
   ========================================================================= */

export interface DropdownTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export const DropdownTrigger: FC<DropdownTriggerProps> = ({
  children,
  asChild = false,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}) => {
  const { isOpen, setIsOpen, triggerRef, menuId, triggerId, focusItem } = useDropdownContext();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => focusItem(0), 10);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => focusItem(999), 10); // clamped in focus logic
    }
  };

  if (asChild && React.isValidElement(children)) {
    return cloneElement(children as ReactElement<any>, {
      ref: triggerRef,
      id: triggerId,
      'aria-haspopup': 'menu',
      'aria-expanded': isOpen,
      'aria-controls': isOpen ? menuId : undefined,
      'aria-label': ariaLabel || (children.props as any)?.['aria-label'],
      disabled: disabled || (children.props as any)?.disabled,
      onClick: (e: MouseEvent) => {
        (children.props as any)?.onClick?.(e);
        if (!disabled) setIsOpen(!isOpen);
      },
      onKeyDown: (e: KeyboardEvent) => {
        (children.props as any)?.onKeyDown?.(e);
        handleKeyDown(e);
      },
    });
  }

  return (
    <button
      ref={triggerRef}
      id={triggerId}
      type="button"
      disabled={disabled}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-controls={isOpen ? menuId : undefined}
      aria-label={ariaLabel}
      onClick={() => {
        if (!disabled) setIsOpen(!isOpen);
      }}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-mono text-slate-100 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] cursor-pointer min-h-11 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

/* =========================================================================
   Dropdown Menu
   ========================================================================= */

export type DropdownAlign = 'start' | 'end' | 'center';
export type DropdownSide = 'bottom' | 'top';

export interface DropdownMenuProps {
  children: ReactNode;
  align?: DropdownAlign;
  side?: DropdownSide;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const alignStyles: Record<DropdownAlign, string> = {
  start: 'left-0',
  end: 'right-0',
  center: 'left-1/2 -translate-x-1/2',
};

const sideStyles: Record<DropdownSide, string> = {
  bottom: 'top-full mt-1.5',
  top: 'bottom-full mb-1.5',
};

export const DropdownMenu: FC<DropdownMenuProps> = ({
  children,
  align = 'start',
  side = 'bottom',
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => {
  const { isOpen, menuRef, menuId, triggerId, closeMenu } = useDropdownContext();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    const focusableItems = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') || []
    );

    if (focusableItems.length === 0) return;

    const activeIndex = focusableItems.indexOf(document.activeElement as HTMLElement);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIdx = activeIndex < focusableItems.length - 1 ? activeIndex + 1 : 0;
        focusableItems[nextIdx]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevIdx = activeIndex > 0 ? activeIndex - 1 : focusableItems.length - 1;
        focusableItems[prevIdx]?.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        focusableItems[0]?.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        focusableItems[focusableItems.length - 1]?.focus();
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeMenu();
        break;
      }
      case 'Tab': {
        closeMenu();
        break;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      tabIndex={-1}
      aria-labelledby={ariaLabel ? undefined : (ariaLabelledby || triggerId)}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      style={{ zIndex: 'var(--z-dropdown, 50)' }}
      className={`absolute ${alignStyles[align]} ${sideStyles[side]} min-w-[200px] glass-modal bg-[#0b0d14]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md p-1.5 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs focus:outline-none ${className}`}
    >
      {children}
    </div>
  );
};

/* =========================================================================
   Dropdown Item
   ========================================================================= */

export type DropdownItemTone = 'default' | 'destructive';

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  tone?: DropdownItemTone;
  icon?: ReactNode;
  shortcut?: string;
  className?: string;
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  (
    {
      children,
      onClick,
      disabled = false,
      tone = 'default',
      icon,
      shortcut,
      className = '',
    },
    forwardedRef
  ) => {
    const { closeMenu } = useDropdownContext();
    const itemRef = useRef<HTMLButtonElement | null>(null);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
      closeMenu();
    };

    const toneStyles =
      tone === 'destructive'
        ? 'text-[var(--color-destructive-subtle)] hover:text-red-200 hover:bg-red-500/20 focus:bg-red-500/20 focus:text-red-200 focus-visible:ring-red-400'
        : 'text-slate-200 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white focus-visible:ring-[var(--color-focus-ring)]';

    return (
      <button
        ref={(node) => {
          itemRef.current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        type="button"
        role="menuitem"
        tabIndex={-1}
        disabled={disabled}
        aria-disabled={disabled ? 'true' : undefined}
        onClick={handleClick}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#05060a] disabled:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent select-none ${toneStyles} ${className}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden truncate">
          {icon && <span className="shrink-0 flex items-center">{icon}</span>}
          <span className="truncate">{children}</span>
        </div>
        {shortcut && (
          <span className="text-3xs text-[var(--color-text-faint)] font-mono tracking-widest uppercase ml-auto pl-2">
            {shortcut}
          </span>
        )}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

/* =========================================================================
   Dropdown Separator & Label
   ========================================================================= */

export const DropdownSeparator: FC<{ className?: string }> = ({ className = '' }) => (
  <div role="separator" aria-orientation="horizontal" className={`my-1 border-t border-white/10 ${className}`} />
);

export const DropdownLabel: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`px-3 py-1.5 text-3xs font-bold text-[var(--color-text-faint)] uppercase tracking-wider ${className}`}>
    {children}
  </div>
);

Dropdown.Trigger = DropdownTrigger;
Dropdown.Menu = DropdownMenu;
Dropdown.Item = DropdownItem;
Dropdown.Separator = DropdownSeparator;
Dropdown.Label = DropdownLabel;

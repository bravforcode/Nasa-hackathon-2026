/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useId,
  type ReactNode,
  useImperativeHandle,
} from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  selectSize?: SelectSize;
  disabled?: boolean;
  leftIcon?: ReactNode;
  id?: string;
  name?: string;
  className?: string;
  containerClassName?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const sizeStyles: Record<SelectSize, { trigger: string; option: string; text: string }> = {
  sm: {
    trigger: 'py-1.5 px-2.5 text-xs rounded-lg min-h-[36px]',
    option: 'py-1.5 px-2.5 text-xs rounded-md min-h-[36px]',
    text: 'text-xs',
  },
  md: {
    trigger: 'py-2 px-3 text-sm rounded-xl min-h-11', // 44px minimum touch target floor
    option: 'py-2 px-3 text-sm rounded-lg min-h-11',
    text: 'text-sm',
  },
  lg: {
    trigger: 'py-2.5 px-4 text-base rounded-xl min-h-[48px]',
    option: 'py-2.5 px-4 text-base rounded-lg min-h-[48px]',
    text: 'text-base',
  },
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value: controlledValue,
      defaultValue,
      onChange,
      placeholder = 'Select an option...',
      label,
      error,
      hint,
      selectSize = 'md',
      disabled = false,
      leftIcon,
      id,
      name,
      className = '',
      containerClassName = '',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const triggerId = `${selectId}-trigger`;
    const labelId = `${selectId}-label`;
    const listboxId = `${selectId}-listbox`;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string>(
      defaultValue ?? (options.length > 0 && defaultValue !== undefined ? defaultValue : '')
    );
    const selectedValue = isControlled ? controlledValue : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

    const selectedOption = options.find((opt) => opt.value === selectedValue);
    const selectedIndex = options.findIndex((opt) => opt.value === selectedValue);

    const getFirstEnabledIndex = () => options.findIndex((opt) => !opt.disabled);
    const getLastEnabledIndex = () => {
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) return i;
      }
      return -1;
    };

    const getNextEnabledIndex = (currentIndex: number, step: 1 | -1) => {
      const count = options.length;
      if (count === 0) return -1;
      let idx = currentIndex;
      for (let i = 0; i < count; i++) {
        idx = (idx + step + count) % count;
        if (!options[idx]?.disabled) {
          return idx;
        }
      }
      return currentIndex;
    };

    const handleSelect = (val: string) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      onChange?.(val);
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
        const item = listboxRef.current.children[highlightedIndex] as HTMLElement | undefined;
        item?.scrollIntoView?.({ block: 'nearest' });
      }
    }, [isOpen, highlightedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            const initialIdx = selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex();
            setHighlightedIndex(initialIdx);
          } else {
            setHighlightedIndex((prev) => getNextEnabledIndex(prev, 1));
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            const initialIdx = selectedIndex >= 0 ? selectedIndex : getLastEnabledIndex();
            setHighlightedIndex(initialIdx);
          } else {
            setHighlightedIndex((prev) => getNextEnabledIndex(prev, -1));
          }
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex());
          } else {
            if (
              highlightedIndex >= 0 &&
              highlightedIndex < options.length &&
              !options[highlightedIndex].disabled
            ) {
              handleSelect(options[highlightedIndex].value);
            }
          }
          break;
        }
        case 'Escape': {
          if (isOpen) {
            e.preventDefault();
            setIsOpen(false);
            triggerRef.current?.focus();
          }
          break;
        }
        case 'Home': {
          if (isOpen) {
            e.preventDefault();
            setHighlightedIndex(getFirstEnabledIndex());
          }
          break;
        }
        case 'End': {
          if (isOpen) {
            e.preventDefault();
            setHighlightedIndex(getLastEnabledIndex());
          }
          break;
        }
        case 'Tab': {
          if (isOpen) {
            setIsOpen(false);
          }
          break;
        }
      }
    };

    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
      ariaDescribedby,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const styles = sizeStyles[selectSize];

    return (
      <div ref={containerRef} className={`relative flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label id={labelId} htmlFor={triggerId} className="text-xs font-medium text-slate-300 select-none">
            {label}
          </label>
        )}

        <div className="relative w-full">
          <button
            ref={triggerRef}
            type="button"
            id={triggerId}
            name={name}
            disabled={disabled}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={
              isOpen && highlightedIndex >= 0 ? `${selectId}-option-${highlightedIndex}` : undefined
            }
            aria-labelledby={label ? labelId : ariaLabelledby}
            aria-label={ariaLabel}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            onClick={() => {
              if (disabled) return;
              const nextState = !isOpen;
              setIsOpen(nextState);
              if (nextState) {
                setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex());
              }
            }}
            onKeyDown={handleKeyDown}
            className={`w-full font-mono flex items-center justify-between gap-2 bg-black/40 text-left text-slate-100 border border-white/10 hover:border-white/20 focus:border-[var(--color-accent-subtle)] focus:ring-1 focus:ring-[var(--color-focus-ring)] outline-none transition-all duration-150 backdrop-blur-md cursor-pointer disabled:bg-white/[0.02] disabled:text-[var(--color-text-faint)] disabled:border-white/5 disabled:cursor-not-allowed ${
              error ? '!border-[var(--color-destructive-subtle)]/80 focus:!ring-[var(--color-destructive-subtle)]' : ''
            } ${styles.trigger} ${className}`}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              {leftIcon && (
                <span className="text-slate-400 shrink-0 flex items-center">{leftIcon}</span>
              )}
              {selectedOption?.icon && (
                <span className="shrink-0 flex items-center">{selectedOption.icon}</span>
              )}
              <span className={`truncate ${!selectedOption ? 'text-[var(--color-text-faint)]' : ''}`}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-[var(--color-accent-subtle)]' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {isOpen && (
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={label ? labelId : (ariaLabelledby || triggerId)}
              aria-activedescendant={
                highlightedIndex >= 0 ? `${selectId}-option-${highlightedIndex}` : undefined
              }
              className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-[#0b0d14]/95 border border-white/10 shadow-2xl backdrop-blur-md p-1 z-[var(--z-dropdown,50)] animate-in fade-in zoom-in-95 duration-100 font-mono list-none m-0 focus:outline-none"
            >
              {options.length === 0 ? (
                <li className="px-3 py-2 text-xs text-[var(--color-text-faint)] text-center select-none">
                  No options available
                </li>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  const isHighlighted = index === highlightedIndex;
                  const optionId = `${selectId}-option-${index}`;

                  return (
                    <li
                      key={option.value}
                      id={optionId}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled ? 'true' : undefined}
                      data-highlighted={isHighlighted ? 'true' : undefined}
                      onClick={() => {
                        if (option.disabled) return;
                        handleSelect(option.value);
                      }}
                      onMouseEnter={() => {
                        if (!option.disabled) {
                          setHighlightedIndex(index);
                        }
                      }}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none ${
                        styles.option
                      } ${
                        option.disabled
                          ? 'text-slate-600 opacity-40 cursor-not-allowed bg-transparent'
                          : isHighlighted
                          ? 'bg-white/10 text-white'
                          : isSelected
                          ? 'bg-blue-600/15 text-[var(--color-accent-subtle)]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        {option.icon && (
                          <span className="shrink-0 flex items-center">{option.icon}</span>
                        )}
                        <div className="flex flex-col truncate">
                          <span className="truncate">{option.label}</span>
                          {option.description && (
                            <span className="text-3xs text-slate-400 truncate">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--color-accent-subtle)] shrink-0 ml-2" aria-hidden="true" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        {error && (
          <span id={errorId} role="alert" className="text-3xs text-[var(--color-destructive-subtle)] font-mono">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={hintId} className="text-3xs text-[var(--color-text-muted)] font-mono">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

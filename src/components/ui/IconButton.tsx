import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type IconButtonVariant = 'ghost' | 'solid';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  'aria-label': string; // strictly required for accessibility
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  active?: boolean;
  className?: string;
  title?: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost:
    'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20',
  solid:
    'text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 border border-blue-400/30 shadow-md shadow-blue-500/20',
};

const activeStyles: Record<IconButtonVariant, string> = {
  ghost: 'text-blue-400 bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/25',
  solid: 'bg-blue-700 border-blue-300 ring-2 ring-blue-400/40',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'w-11 h-11 rounded-xl text-xs min-h-11 min-w-11 p-2', // 44px min touch target floor
  md: 'w-11 h-11 rounded-xl text-sm min-h-11 min-w-11 p-2.5', // 44px min touch target floor
  lg: 'w-12 h-12 rounded-xl text-base min-h-12 min-w-12 p-3',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      active,
      disabled = false,
      className = '',
      title,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    // Preserve hover tooltip via title if provided or fallback to aria-label
    const resolvedTitle = title || ariaLabel;

    return (
      <button
        ref={ref}
        type={type}
        title={resolvedTitle}
        aria-label={ariaLabel}
        aria-pressed={active !== undefined ? (active ? 'true' : 'false') : undefined}
        disabled={disabled}
        className={`inline-flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-40 disabled:cursor-not-allowed ${
          variantStyles[variant]
        } ${active ? activeStyles[variant] : ''} ${sizeStyles[size]} ${className}`}
        {...rest}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

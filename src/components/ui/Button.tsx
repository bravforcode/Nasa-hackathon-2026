import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

// Discriminated union: If children is not provided, aria-label is required
export type ButtonProps = BaseButtonProps &
  (
    | { children: ReactNode; 'aria-label'?: string }
    | { children?: undefined; 'aria-label': string }
  );

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 border border-blue-400/20 disabled:bg-blue-600/30 disabled:text-white/40 disabled:border-transparent',
  secondary:
    'bg-white/5 hover:bg-white/10 active:bg-white/15 text-white border border-white/10 hover:border-white/20 disabled:bg-white/[0.02] disabled:text-white/30 disabled:border-white/5',
  tertiary:
    'bg-transparent hover:bg-white/5 active:bg-white/10 text-slate-300 hover:text-white border border-transparent disabled:text-slate-600 disabled:hover:bg-transparent',
  destructive:
    'bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-300 hover:text-red-200 border border-red-500/30 disabled:bg-red-500/10 disabled:text-red-300/30 disabled:border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 min-h-[36px]',
  md: 'px-4 py-2 text-xs md:text-sm rounded-xl gap-2 min-h-11', // 44px minimum touch target floor
  lg: 'px-5 py-2.5 text-sm md:text-base rounded-xl gap-2.5 min-h-[48px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading ? 'true' : undefined}
        className={`inline-flex items-center justify-center font-sans transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060A] disabled:cursor-not-allowed disabled:shadow-none ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

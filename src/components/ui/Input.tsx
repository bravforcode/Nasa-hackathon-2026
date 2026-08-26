import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  inputSize?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'py-1.5 px-2.5 text-xs rounded-lg min-h-[36px]',
  md: 'py-2 px-3 text-sm rounded-xl min-h-11', // 44px
  lg: 'py-2.5 px-4 text-base rounded-xl min-h-[48px]',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      inputSize = 'md',
      leftIcon,
      rightIcon,
      className = '',
      containerClassName = '',
      id,
      disabled,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-300 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full font-mono bg-black/40 text-slate-100 placeholder:text-slate-500 border border-white/10 hover:border-white/20 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all duration-150 backdrop-blur-md disabled:bg-white/[0.02] disabled:text-slate-500 disabled:border-white/5 disabled:cursor-not-allowed ${
              error ? '!border-red-400/80 focus:!ring-red-400' : ''
            } ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} ${
              sizeStyles[inputSize]
            } ${className}`}
            {...rest}
          />
          {rightIcon && (
            <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span id={errorId} role="alert" className="text-xs text-red-400 font-mono">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={hintId} className="text-xs text-slate-400 font-mono">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

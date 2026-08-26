import { forwardRef, type HTMLAttributes, type ElementType } from 'react';

export type CardVariant = 'default' | 'subtle' | 'modal';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: ElementType;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'glass-panel rounded-2xl shadow-xl',
  subtle: 'glass-panel-subtle rounded-xl',
  modal: 'glass-modal rounded-2xl shadow-2xl',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 md:p-5',
  lg: 'p-6 md:p-8',
};

export const Card = forwardRef<HTMLElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      as: Component = 'div',
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

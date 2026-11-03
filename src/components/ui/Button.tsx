'use client';

import React from 'react';
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dice' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-candlelight-400 focus:ring-offset-2 focus:ring-offset-parchment-100 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-ink-900 text-parchment-50 hover:bg-ink-700 active:scale-[0.98]',
      secondary: 'bg-parchment-200 text-ink-800 border border-ink-300 hover:bg-parchment-300 active:scale-[0.98]',
      dice: 'w-16 h-16 rounded-xl bg-dice-ivory border-2 border-ink-300 text-ink-900 font-mono text-2xl hover:border-candlelight-400 hover:bg-candlelight-50 active:scale-95 shadow-[0_2px_8px_-2px_rgba(61,53,45,0.3)]',
      ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
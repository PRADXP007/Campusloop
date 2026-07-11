'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-muted)]">
            {label}
          </label>
        )}
        <div className="relative rounded-2xl p-[1px] transition-all duration-300 bg-transparent focus-within:bg-gradient-to-r focus-within:from-[var(--color-primary)] focus-within:to-[var(--color-accent)]">
          <div className="relative flex items-center rounded-[15px] bg-[var(--color-surface)]">
            {leftIcon && (
              <span className="absolute left-3.5 text-[var(--color-text-muted)]/70 pointer-events-none z-10 select-none">
                {leftIcon}
              </span>
            )}
            <input
              ref={ref}
              id={id}
              className={`
                w-full rounded-[15px] px-4.5 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50
                bg-transparent border border-transparent focus:outline-none focus:ring-0
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm font-body
                ${leftIcon ? 'pl-11' : ''}
                ${rightIcon ? 'pr-11' : ''}
                ${error ? 'border-[var(--color-error)]/70 focus:border-[var(--color-error)]' : ''}
                ${className}
              `}
              {...props}
            />
            {rightIcon && (
              <span className="absolute right-3.5 text-[var(--color-text-muted)]/70 z-10">{rightIcon}</span>
            )}
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-450 flex items-center gap-1 font-medium mt-0.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

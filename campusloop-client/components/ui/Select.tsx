'use client';

import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  /** Set to true when used inside a dark card (auth pages).
   *  Uses opaque dark background so options are always readable. */
  dark?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, options, className = '', id, dark = true, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={id}
            className={`text-xs font-semibold uppercase tracking-wide font-body ${
              dark ? 'text-white/60' : 'text-[var(--color-text-muted)]'
            }`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            style={{ colorScheme: dark ? 'dark' : 'light' }}
            className={`
              w-full rounded-2xl border px-4 py-4 text-sm appearance-none cursor-pointer
              focus:outline-none transition-all duration-200
              ${dark
                ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/30 focus:bg-[#1E293B]'
                : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
              }
              disabled:opacity-40 disabled:cursor-not-allowed
              ${error ? 'border-red-400/60 focus:border-red-400' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className={dark ? 'bg-[#1E293B] text-slate-400' : 'bg-white text-slate-900 border border-slate-200'}>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className={dark ? 'bg-[#1E293B] text-slate-100' : 'bg-white text-slate-900 border border-slate-200'}
              >
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron */}
          <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            dark ? 'text-white/55' : 'text-[var(--color-text-muted)]'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

        {error && (
          <p className="text-[10px] text-red-400 flex items-center gap-1">
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

Select.displayName = 'Select';
export default Select;

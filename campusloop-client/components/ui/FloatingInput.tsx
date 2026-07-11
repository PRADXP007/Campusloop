'use client';

import React, { useState, forwardRef } from 'react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  light?: boolean;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', type = 'text', id, value, onChange, light = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
    };

    return (
      <div className="relative w-full flex flex-col gap-1">
        <div className={`relative rounded-2xl p-[1px] transition-all duration-300 shadow-sm ${
          light 
            ? 'bg-black/5 focus-within:bg-[var(--color-primary)]' 
            : 'bg-white/10 focus-within:bg-gradient-to-r focus-within:from-[var(--color-primary)] focus-within:to-[var(--color-accent)]'
        }`}>
          <div className={`relative flex items-center rounded-[15px] ${
            light ? 'bg-white' : 'bg-black/40 backdrop-blur-md'
          }`}>
            {leftIcon && (
              <span className={`absolute left-4 pointer-events-none z-10 select-none flex items-center ${
                light ? 'text-[#666666]' : 'text-white/60'
              }`}>
                {leftIcon}
              </span>
            )}
            
            <input
              ref={ref}
              type={inputType}
              id={id}
              value={value}
              onChange={handleChange}
              className={`
                w-full rounded-[15px] px-4 pt-6 pb-2 text-sm bg-transparent border border-transparent
                focus:outline-none focus:ring-0 placeholder-transparent transition-all duration-300 peer font-body
                ${light ? 'text-[#111111] placeholder:text-[#888888] caret-[var(--color-primary)] selection:bg-[var(--color-primary)]/15' : 'text-white'}
                ${leftIcon ? 'pl-11' : 'pl-4'}
                ${rightIcon || isPassword ? 'pr-11' : 'pr-4'}
                ${error ? 'border-red-400/60 focus:border-red-400' : ''}
                ${className}
              `}
              placeholder=" "
              {...props}
            />

            <label
              htmlFor={id}
              className={`
                absolute top-4 text-sm pointer-events-none transition-all duration-200 origin-[0] font-body select-none
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm
                peer-focus:top-1.5 peer-focus:text-[10px]
                peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]
                ${light 
                  ? 'text-[#666666] peer-focus:text-[var(--color-primary)] peer-[:not(:placeholder-shown)]:text-[#666666]' 
                  : 'text-white/60 peer-focus:text-blue-400 peer-[:not(:placeholder-shown)]:text-white/50'
                }
                ${leftIcon ? 'left-11' : 'left-4'}
              `}
            >
              {label}
            </label>

            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 transition-colors cursor-pointer z-10 flex items-center ${
                  light ? 'text-[#666666] hover:text-[#111111]' : 'text-white/50 hover:text-white'
                }`}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z" />
                  </svg>
                )}
              </button>
            ) : rightIcon ? (
              <span className={`absolute right-4 z-10 flex items-center ${
                light ? 'text-[#666666]' : 'text-white/50'
              }`}>{rightIcon}</span>
            ) : null}
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5 font-medium pl-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';
export default FloatingInput;

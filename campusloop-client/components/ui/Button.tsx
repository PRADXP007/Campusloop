'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const variantClasses = {
  primary:
    'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] hover:brightness-[1.05] text-[var(--color-surface)] shadow-[0_4px_20px_rgba(37,99,235,0.16)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.26)] disabled:from-[var(--color-primary)]/40 disabled:to-[var(--color-primary-hover)]/40 disabled:shadow-none',
  secondary:
    'bg-transparent hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-accent)]/50 hover:border-[var(--color-primary)] shadow-md backdrop-blur-md',
  ghost:
    'bg-transparent hover:bg-[var(--color-surface-2)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
  danger:
    'bg-[var(--color-error)] hover:bg-red-650 text-white shadow-[0_4px_20px_rgba(185,28,28,0.12)] disabled:bg-[var(--color-error)]/40 disabled:shadow-none',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-xs rounded-2xl font-medium tracking-wide',
  md: 'px-5 py-3 text-sm rounded-[20px] font-semibold tracking-wide',
  lg: 'px-7 py-4 text-base rounded-[24px] font-bold tracking-wider',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Motion values for magnetic pull
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Optimized spring setup for responsive magnetic reaction
  const springX = useSpring(x, { damping: 15, stiffness: 150, mass: 0.1 });
  const springY = useSpring(y, { damping: 15, stiffness: 150, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Distance from center, scaled to max 10px translate
    const pullX = (e.clientX - centerX) * 0.28;
    const pullY = (e.clientY - centerY) * 0.28;
    
    x.set(pullX);
    y.set(pullY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      style={{
        x: springX,
        y: springY,
      }}
      whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 12 } }}
      whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-colors duration-200 cursor-pointer btn-liquid glow-btn
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading…</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button;

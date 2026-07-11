'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VerifiedBadgeProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function VerifiedBadge({
  showLabel = false,
  size = 'md',
  className = '',
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-[11px]',
    lg: 'w-7 h-7 text-[15px]',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4.5 h-4.5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(201,166,107,0.75)] ${className}`}>
      <motion.span
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 2px 10px rgba(201,166,107,0.15)',
            '0 2px 18px rgba(201,166,107,0.45)',
            '0 2px 10px rgba(201,166,107,0.15)'
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 6,
          ease: "easeInOut"
        }}
        className={`
          relative flex items-center justify-center rounded-full
          bg-gradient-to-tr from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-surface)]
          border border-[var(--color-accent)]/50 shadow-[0_2px_10px_rgba(201,166,107,0.15)]
          backdrop-blur-md cursor-help overflow-hidden
          ${sizeClasses[size]}
        `}
        title="Verified CampusLoop Student"
      >
        {/* Subtle glass overlay */}
        <span className="absolute inset-[0.5px] rounded-full bg-[#FCFAF7]/90 flex items-center justify-center">
          <svg
            className={`${iconSizes[size]} text-[var(--color-primary)]`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      </motion.span>
      
      {showLabel && (
        <span className="text-[10px] md:text-xs font-black tracking-wider uppercase text-[var(--color-primary)] bg-[var(--color-surface)] px-2.5 py-0.5 rounded-full border border-[var(--color-accent)]/30 shadow-sm font-heading">
          Verified Student
        </span>
      )}
    </span>
  );
}

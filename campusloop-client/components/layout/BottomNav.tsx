'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';

// ── Inline SVG icons ─────────────────────────────────────────────────────
const Icons = {
  feed: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h3" />
    </svg>
  ),
  market: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  me: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

const ITEMS = [
  { href: '/feed',            icon: Icons.feed,   label: 'Feed'   },
  { href: '/marketplace',     icon: Icons.market, label: 'Market' },
  { href: '/marketplace/new', icon: Icons.plus,   label: 'Sell',  isCTA: true },
  { href: '/chat',            icon: Icons.chat,   label: 'Chat'   },
  { href: '/profile',         icon: Icons.me,     label: 'Me'     },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fixed bottom-4 left-3 right-3 z-40 md:hidden flex justify-center">
      <nav className="w-full max-w-sm bg-white/82 backdrop-blur-2xl border border-[var(--color-border)] rounded-[28px] shadow-[0_12px_40px_rgba(26,12,12,0.08)] py-2 px-4 relative overflow-hidden">
        {/* Top glass sheen */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

        <div className="flex items-center justify-between relative z-10">
          {ITEMS.map(({ href, icon, label, isCTA }) => {
            const active = pathname.startsWith(href) && href !== '/marketplace/new';
            return (
              <Link
                key={href}
                href={href}
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}
                className={`relative flex flex-col items-center justify-center transition-all duration-200 active-press py-1.5 px-2.5 rounded-2xl cursor-pointer ${
                  isCTA
                    ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white w-10 h-10 rounded-2xl shadow-[0_4px_14px_rgba(37,99,235,0.22)] border border-[var(--color-primary)]/20 hover:scale-105 hover:shadow-[0_6px_18px_rgba(37,99,235,0.30)]'
                    : active
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {/* Active spring pill */}
                {active && !isCTA && (
                  <motion.div
                    layoutId="mobileNavActivePill"
                    className="absolute inset-0 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/10 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}

                <span className={`flex items-center justify-center ${isCTA ? '' : 'relative z-10'}`}>
                  {icon}
                </span>
                {!isCTA && (
                  <span className="text-[9px] mt-0.5 tracking-tight font-bold relative z-10 leading-none">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

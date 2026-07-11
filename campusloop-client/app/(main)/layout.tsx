'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import FrozenRoute from '@/components/layout/FrozenRoute';
import BackgroundManager from '@/components/layout/BackgroundManager';

function getPageKey(pathname: string): string {
  if (pathname === '/feed')                  return 'feed';
  if (pathname?.startsWith('/marketplace')) return 'marketplace';
  if (pathname?.startsWith('/chat'))        return 'chat';
  if (pathname === '/search')               return 'search';
  if (pathname === '/profile')              return 'profile';
  return '';
}

// ── Optimized Page transition variants (GPU-friendly only) ───────────────────
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.97,
    y: 12,
  },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1], // Luxury cubic bezier curve
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -8,
    transition: {
      duration: 0.25,
      ease: 'easeInOut',
    },
  },
} as any;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, refreshUser } = useAuthStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      refreshUser();
    }
  }, [isAuthenticated, router, refreshUser]);

  useEffect(() => {
    setIsTransitioning(true);
    setProgress(15);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 80) return prev + 15;
        return prev;
      });
    }, 70);

    const timeout = setTimeout(() => {
      setProgress(100);
      const hideTimeout = setTimeout(() => {
        setIsTransitioning(false);
        setProgress(0);
      }, 150);
      return () => clearTimeout(hideTimeout);
    }, 450);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeKey = getPageKey(pathname ?? '');

  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden">
      {/* ── Persistent Root Background Manager ── */}
      <BackgroundManager activeKey={activeKey} />

      {/* ── Page Loader Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-transparent">
        <div
          style={{
            width: `${progress}%`,
            opacity: progress > 0 ? 1 : 0,
            transition: progress === 100 ? 'width 0.15s ease-out, opacity 0.15s ease-out' : 'width 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] shadow-[0_1px_10px_rgba(37,99,235,0.3)] w-0"
        />
      </div>


      {/* ── Navbar (Fixed) ── */}
      <Navbar />

      {/* ── Page Content with GPU Accelerated Transitions ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="relative z-10 flex-1 pt-20 pb-28 md:pb-8 max-w-6xl w-full mx-auto px-4"
        >
          <FrozenRoute>
            {children}
          </FrozenRoute>
        </motion.main>
      </AnimatePresence>

      {/* ── BottomNav (Fixed) ── */}
      <BottomNav />
    </div>
  );
}

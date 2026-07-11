'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

function RotatingWords() {
  const words = ['Connect.', 'Trade.', 'Collaborate.', 'Grow.'];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[48px] overflow-hidden relative mt-1 flex items-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -22, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="text-[#2563EB] font-black text-3xl md:text-4xl lg:text-5xl font-heading tracking-tight absolute"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname === '/register';
  const isVerify = pathname === '/verify';

  // Mouse tracking for parallax card tilt
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const handleMouseMove = (e: React.MouseEvent) => {
    x.set(e.clientX / window.innerWidth);
    y.set(e.clientY / window.innerHeight);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  const springConfig = { damping: 28, stiffness: 180, mass: 0.6 };

  const rotateX = useTransform(y, [0, 1], [3, -3]);
  const rotateY = useTransform(x, [0, 1], [-3, 3]);
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const translateX = useTransform(x, [0, 1], [-5, 5]);
  const translateY = useTransform(y, [0, 1], [-5, 5]);
  const springTranslateX = useSpring(translateX, springConfig);
  const springTranslateY = useSpring(translateY, springConfig);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen relative flex flex-col font-body bg-transparent text-white"
    >
      {/* ── Fixed Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#070e27]">
        <div
          className="absolute inset-0 opacity-[0.5] mix-blend-overlay"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)`,
            backgroundSize: '44px 44px',
          }}
        />
        <div className="absolute -top-48 -left-48 w-[580px] h-[580px] rounded-full bg-[#1E3A8A]/24 blur-[110px]" />
        <div className="absolute top-1/3 right-[-80px] w-[500px] h-[500px] rounded-full bg-[#2563EB]/14 blur-[90px]" />
        <div className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] rounded-full bg-[#3B82F6]/08 blur-[80px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/70 via-[#020617]/40 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/20 via-transparent to-[#020617]/40 z-[1]" />
        <div className="noise-overlay opacity-[0.025] z-[2]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 flex-none flex items-center px-6 sm:px-10 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-2xl overflow-hidden border border-white/18 flex items-center justify-center shadow-lg bg-white/08 backdrop-blur-md"
          >
            <Image src="/logo.png" alt="CampusLoop Logo" width={40} height={40} className="w-full h-full object-cover" />
          </motion.div>
          <span className="font-extrabold text-white tracking-tight text-lg drop-shadow font-heading">
            Campus<span className="text-[#2563EB]">Loop</span>
          </span>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 py-4 lg:py-8 overflow-visible">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Left: Marketing copy — desktop only */}
          <div className="hidden lg:flex flex-col items-start gap-5 text-left">
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold tracking-widest text-[#2563EB] uppercase bg-white/08 border border-white/18 rounded-full px-3 py-1.5 shadow-sm">
                ✦ Verified Academic Network
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.07] text-white tracking-tight font-heading">
                India&apos;s Trusted<br />Student Network
              </h1>
              <RotatingWords />
            </div>

            <div className="grid grid-cols-1 gap-2.5 w-full max-w-xs">
              {[
                { icon: '🛒', label: 'Campus Marketplace', desc: 'Buy and sell within your college' },
                { icon: '📢', label: 'College Feed', desc: 'Share updates, events and moments' },
                { icon: '💬', label: 'Secure Chat', desc: 'Message verified students safely' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/06 border border-white/10">
                  <span className="text-lg">{f.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-white/90">{f.label}</p>
                    <p className="text-[10px] text-white/50 font-medium">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Auth card */}
          <div className="relative flex items-center justify-center w-full" style={{ perspective: 1200 }}>
            {/* Glow */}
            <div className="absolute -right-16 -top-16 w-[420px] h-[420px] rounded-full bg-[#2563EB]/14 blur-[60px] z-0 pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                x: springTranslateX,
                y: springTranslateY,
                transformStyle: 'preserve-3d',
              }}
              className="w-full max-w-md relative z-10"
            >
              {/* Card — overflow-visible on register for dropdowns, normal on others */}
              <div
                className={`rounded-[28px] p-6 sm:p-8 relative shadow-2xl ${
                  isRegister
                    ? 'bg-white border border-slate-200/80 text-slate-900 overflow-visible'
                    : 'dark-card overflow-hidden'
                } ${isVerify ? 'max-h-[calc(100dvh-100px)] overflow-y-auto' : ''}`}
              >
                {/* Light sweep shimmer */}
                <motion.div
                  initial={{ x: '-160%', skewX: -22 }}
                  animate={{ x: '160%' }}
                  transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 8 }}
                  className={`absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent ${
                    isRegister ? 'via-blue-500/06' : 'via-white/16'
                  } to-transparent pointer-events-none z-20`}
                />

                {/* Noise grain */}
                <div className="noise-overlay pointer-events-none z-10" />

                {/* Mobile logo (hidden on desktop since header shows it) */}
                <div className="lg:hidden flex items-center gap-2.5 mb-5 justify-center">
                  <div className={`w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center border ${
                    isRegister ? 'border-slate-200 bg-slate-50' : 'border-white/22 bg-white/08'
                  }`}>
                    <Image src="/logo.png" alt="CampusLoop" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-base font-black tracking-tight font-heading ${isRegister ? 'text-slate-900' : 'text-white'}`}>
                    Campus<span className="text-[#2563EB]">Loop</span>
                  </span>
                </div>

                {/* Page content */}
                <div className="relative z-10">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex-none text-center py-2.5">
        <p className="text-[10px] text-white/40 font-body tracking-wide">
          🇮🇳 Exclusive to verified Indian campus domains • Use responsibly
        </p>
      </footer>
    </div>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';

const StaticPulsingParticles = React.memo(() => {
  // Disabled in EMERGENCY PERFORMANCE RECOVERY MODE to save CPU cycles
  return null;
});

StaticPulsingParticles.displayName = 'StaticPulsingParticles';

interface BackgroundManagerProps {
  activeKey: string;
}

interface BgTheme {
  bgColor: string;
  aurora1: string;
  aurora2: string;
  spotlightOpacity: number;
  glassOpacity: number;
  glowScale: number;
  x1: number;
  y1: number;
  radius1: string;
  x2: number;
  y2: number;
  radius2: string;
  x3: number;
  y3: number;
  radius3: string;
}

const BG_IMAGES: Record<string, string> = {};

const THEMES: Record<string, BgTheme> = {
  feed: {
    bgColor: 'var(--color-background)',
    aurora1: 'rgba(37, 99, 235, 0.03)',
    aurora2: 'rgba(30, 58, 138, 0.02)',
    spotlightOpacity: 0,
    glassOpacity: 0,
    glowScale: 1.0,
    x1: 0,
    y1: 0,
    radius1: '50%',
    x2: 0,
    y2: 0,
    radius2: '50%',
    x3: 0,
    y3: 0,
    radius3: '50%',
  },
  marketplace: {
    bgColor: 'var(--color-background)',
    aurora1: 'rgba(37, 99, 235, 0.03)',
    aurora2: 'rgba(30, 58, 138, 0.02)',
    spotlightOpacity: 0,
    glassOpacity: 0,
    glowScale: 1.0,
    x1: 0,
    y1: 0,
    radius1: '50%',
    x2: 0,
    y2: 0,
    radius2: '50%',
    x3: 0,
    y3: 0,
    radius3: '50%',
  },
  search: {
    bgColor: 'var(--color-background)',
    aurora1: 'rgba(37, 99, 235, 0.03)',
    aurora2: 'rgba(30, 58, 138, 0.02)',
    spotlightOpacity: 0,
    glassOpacity: 0,
    glowScale: 1.0,
    x1: 0,
    y1: 0,
    radius1: '50%',
    x2: 0,
    y2: 0,
    radius2: '50%',
    x3: 0,
    y3: 0,
    radius3: '50%',
  },
  chat: {
    bgColor: 'var(--color-background)',
    aurora1: 'rgba(37, 99, 235, 0.03)',
    aurora2: 'rgba(30, 58, 138, 0.02)',
    spotlightOpacity: 0,
    glassOpacity: 0,
    glowScale: 1.0,
    x1: 0,
    y1: 0,
    radius1: '50%',
    x2: 0,
    y2: 0,
    radius2: '50%',
    x3: 0,
    y3: 0,
    radius3: '50%',
  },
  profile: {
    bgColor: 'var(--color-background)',
    aurora1: 'rgba(255, 255, 255, 0.8)',
    aurora2: 'rgba(37, 99, 235, 0.03)',
    spotlightOpacity: 1,
    glassOpacity: 0,
    glowScale: 1.0,
    x1: 0,
    y1: 0,
    radius1: '50%',
    x2: 0,
    y2: 0,
    radius2: '50%',
    x3: 0,
    y3: 0,
    radius3: '50%',
  },
  default: {
    bgColor: 'var(--color-background)',
    aurora1: 'rgba(37, 99, 235, 0.02)',
    aurora2: 'rgba(30, 58, 138, 0.01)',
    spotlightOpacity: 0,
    glassOpacity: 0,
    glowScale: 1.0,
    x1: 0,
    y1: 0,
    radius1: '50%',
    x2: 0,
    y2: 0,
    radius2: '50%',
    x3: 0,
    y3: 0,
    radius3: '50%',
  },
};

export default function BackgroundManager({ activeKey }: BackgroundManagerProps) {
  const theme = THEMES[activeKey] || THEMES.default;
  const hasBgImage = activeKey !== '' && !!BG_IMAGES[activeKey];

  return (
    <motion.div
      animate={{
        backgroundColor: theme.bgColor,
      }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="fixed inset-0 -z-50 overflow-hidden pointer-events-none w-full h-full"
      style={{ transform: 'translate3d(0, 0, 0)' }}
    >
      {/* ── Background Image Layers ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Object.entries(BG_IMAGES).map(([key, src]) => (
          <motion.div
            key={key}
            style={{
              backgroundImage:    `url("${src}")`,
              backgroundSize:     'cover',
              backgroundPosition: 'center',
              backgroundRepeat:   'no-repeat',
            }}
            animate={{
              opacity: activeKey === key ? 1 : 0,
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
          />
        ))}
      </div>

      {/* ── Aurora Blobs (rendered on top of images for beautiful dynamic glow blends) ── */}
      {/* NOTE: Static blurs are used to prevent expensive runtime CPU kernel recalculations during page changes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        {/* Blob 1 */}
        <motion.div
          animate={{
            backgroundColor: theme.aurora1,
            scale: theme.glowScale,
            x: theme.x1,
            y: theme.y1,
            borderRadius: theme.radius1,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ filter: 'blur(80px)' }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] opacity-70"
        />

        {/* Blob 2 */}
        <motion.div
          animate={{
            backgroundColor: theme.aurora2,
            scale: theme.glowScale * 0.9,
            x: theme.x2,
            y: theme.y2,
            borderRadius: theme.radius2,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ filter: 'blur(75px)' }}
          className="absolute top-1/3 -right-20 w-[550px] h-[550px] opacity-65"
        />

        {/* Blob 3 */}
        <motion.div
          animate={{
            backgroundColor: theme.aurora1,
            scale: theme.glowScale * 0.8,
            x: theme.x3,
            y: theme.y3,
            borderRadius: theme.radius3,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ filter: 'blur(70px)' }}
          className="absolute bottom-[-10%] left-10 w-[500px] h-[500px] opacity-60"
        />
      </div>

      {/* ── Scrim overlay to maintain readability of text/cards over bright background images ── */}
      <motion.div
        animate={{
          opacity: hasBgImage ? 0.12 : 0,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="absolute inset-0 bg-black z-[2] pointer-events-none"
      />

      {/* ── Premium Beige Spotlight (Profile Page Special) ───────────────── */}
      <motion.div
        animate={{
          opacity: theme.spotlightOpacity,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0)_70%)] pointer-events-none z-[3]"
      />

      {/* ── Glass Gradient Overlay (Chat Page Special) ──────────────────── */}
      <motion.div
        animate={{
          opacity: theme.glassOpacity,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.1)_100%)] backdrop-blur-[2px] pointer-events-none z-[4]"
      />

      {/* ── Floating Glass Blobs (Disabled in EMERGENCY PERFORMANCE RECOVERY MODE) ── */}

      {/* ── Soft Pulsing Particles ── */}
      <StaticPulsingParticles />

      {/* ── Luxury Noise Texture ── */}
      <div className="noise-overlay pointer-events-none z-20" />
    </motion.div>
  );
}

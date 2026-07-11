'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number; // Maximum rotation in degrees (default: 5)
  style?: React.CSSProperties;
}

export default function TiltCard({
  children,
  className = '',
  maxRotation = 5,
  style = {},
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Position relative to card dimensions (normalized 0 to 1)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Transform coordinates to degree rotations (max X/Y rotation = 5deg)
  // Note: Y-mouse position controls X-axis rotation; X-mouse position controls Y-axis rotation.
  const rotateX = useTransform(y, [0, 1], [maxRotation, -maxRotation]);
  const rotateY = useTransform(x, [0, 1], [-maxRotation, maxRotation]);

  // Translate X/Y for glare/sheen background position
  const glareX = useTransform(x, [0, 1], ['0%', '100%']);
  const glareY = useTransform(y, [0, 1], ['0%', '100%']);

  // Spring configuration for super smooth transitions
  const springConfig = { damping: 25, stiffness: 200, mass: 0.6 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Mouse coords relative to card
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Normalize coordinates (0 to 1)
    const xPct = mouseX / width;
    const yPct = mouseY / height;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    // Reset back to center smoothly
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div 
      style={{ perspective: 1200 }} 
      className="inline-block w-full h-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d',
          ...style,
        }}
        className={`relative transition-shadow duration-300 ${className}`}
      >
        {/* Render card content */}
        {children}

        {/* Dynamic moving glare sheen overlay for a premium glassmorphic effect */}
        <motion.div
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(circle at ${gx} ${gy}, rgba(255, 255, 255, 0.12) 0%, transparent 80%)`
            ),
            pointerEvents: 'none',
          }}
          className="absolute inset-0 z-30 rounded-[inherit]"
        />
      </motion.div>
    </div>
  );
}

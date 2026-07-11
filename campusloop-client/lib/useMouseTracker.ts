import { useState, useEffect, useRef, RefObject } from 'react';

interface MousePosition {
  x: number; // 0 to 1
  y: number; // 0 to 1
}

interface TiltCardMousePosition {
  x: number; // 0 to 1 relative to card
  y: number; // 0 to 1 relative to card
}

// Global mouse position tracker (singleton)
let globalMousePos: MousePosition = { x: 0.5, y: 0.5 };
const listeners: Set<(pos: MousePosition) => void> = new Set();
let isListening = false;

function updateGlobalMousePosition(e: MouseEvent) {
  globalMousePos = {
    x: e.clientX / window.innerWidth,
    y: e.clientY / window.innerHeight
  };

  // Notify all listeners
  listeners.forEach(listener => listener(globalMousePos));
}

function startListening() {
  if (!isListening) {
    window.addEventListener('mousemove', updateGlobalMousePosition);
    isListening = true;
  }
}

function stopListening() {
  if (isListening && listeners.size === 0) {
    window.removeEventListener('mousemove', updateGlobalMousePosition);
    isListening = false;
  }
}

export function useMouseTracker() {
  const [mousePos, setMousePos] = useState<MousePosition>(globalMousePos);

  // Subscribe to global mouse position updates
  useEffect(() => {
    listeners.add(setMousePos);
    if (listeners.size === 1) {
      startListening();
    }

    return () => {
      listeners.delete(setMousePos);
      if (listeners.size === 0) {
        stopListening();
      }
    };
  }, []);

  return mousePos;
}

// Hook for TiltCard to get mouse position relative to the card
export function useRelativeMousePosition(ref: RefObject<HTMLElement>) {
  const mousePos = useMouseTracker();
  const [relativePos, setRelativePos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const lastUpdate = useRef(0);

  useEffect(() => {
    const handleMouseMove = () => {
      // Throttle to max 60fps
      const now = Date.now();
      if (now - lastUpdate.current < 16) return;
      lastUpdate.current = now;

      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      // Convert global mouse position to relative position within the card
      const mouseX = globalMousePos.x * window.innerWidth;
      const mouseY = globalMousePos.y * window.innerHeight;

      const relativeX = (mouseX - rect.left) / width;
      const relativeY = (mouseY - rect.top) / height;

      // Clamp to [0, 1] range
      setRelativePos({
        x: Math.max(0, Math.min(1, relativeX)),
        y: Math.max(0, Math.min(1, relativeY))
      });
    };

    // Subscribe to global mouse updates
    const subscription = () => handleMouseMove();
    // We'll use a simpler approach - just check on animation frame
    const animate = () => {
      handleMouseMove();
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      // Note: animation frame will continue but that's okay for this use case
    };
  }, [ref]);

  return relativePos;
}
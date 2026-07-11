'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const SnowBackground3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2)); // Cap pixel ratio to 1.2 for layout backgrounds
    
    // Absolute styling to guarantee canvas fits container bounds perfectly in all viewports
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';

    containerRef.current.appendChild(renderer.domElement);

    // Particles (Snowflakes)
    const particleCount = 150; // Increased slightly for better density
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    // Premium warm palette colors matching the theme
    const themeColors = [
      new THREE.Color(0xfcfaf7), // Soft White/Cream
      new THREE.Color(0xc9a66b), // Gold Accent
      new THREE.Color(0xb76e79), // Soft Rose
      new THREE.Color(0x7b1e2b), // Crimson Maroon
    ];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Scatter in a box around scene
      positions[idx] = (Math.random() - 0.5) * 12;
      positions[idx + 1] = (Math.random() - 0.5) * 10;
      positions[idx + 2] = (Math.random() - 0.5) * 8;

      // Assign a random theme color
      const color = themeColors[Math.floor(Math.random() * themeColors.length)];
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;

      // Slow drift downwards + slight wind sway
      velocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: -0.003 - Math.random() * 0.005,
        z: (Math.random() - 0.5) * 0.002,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circular snowflake texture with soft edge blur
    const createSnowflakeTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const texture = createSnowflakeTexture();
    const material = new THREE.PointsMaterial({
      size: 0.14, // Slightly larger for premium feel
      map: texture,
      transparent: true,
      opacity: 0.7, // Higher opacity so it is visible on both dark/light bgs
      vertexColors: true, // Use vertex colors
      depthWrite: false,
    });

    const snowflakePoints = new THREE.Points(geometry, material);
    scene.add(snowflakePoints);

    let animId = 0;
    let lastRenderTime = 0;
    const fpsLimit = 30; // Limit falling background snow to 30 FPS to cut GPU workload in half
    const frameInterval = 1000 / fpsLimit;

    const animate = (timestamp: number) => {
      animId = requestAnimationFrame(animate);

      const elapsed = timestamp - lastRenderTime;
      if (elapsed < frameInterval) return;

      lastRenderTime = timestamp - (elapsed % frameInterval);

      const positionsArr = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const vel = velocities[i];

        positionsArr[idx] += vel.x; // Wind sway
        positionsArr[idx + 1] += vel.y; // Falling gravity
        positionsArr[idx + 2] += vel.z; // Depth drift

        // Reset if it goes below screen bounds
        if (positionsArr[idx + 1] < -5) {
          positionsArr[idx + 1] = 5;
          positionsArr[idx] = (Math.random() - 0.5) * 12;
          positionsArr[idx + 2] = (Math.random() - 0.5) * 8;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // ResizeObserver for perfect layout adjustments (hydration-proof)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w === 0 || h === 0) continue;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup WebGL contexts and observers
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[5] w-full h-full pointer-events-none overflow-hidden"
    />
  );
};

export default React.memo(SnowBackground3D);

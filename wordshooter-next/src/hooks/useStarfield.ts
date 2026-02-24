'use client';

import { useEffect, RefObject, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  hue: number;
  opacity: number;
}

function createStarData(W: number, H: number) {
  const stars: Star[] = [];
  const nebulae: Nebula[] = [];

  // Layer 1: slow background stars
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      layer: 1,
    });
  }

  // Layer 2: medium stars
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.6 + 0.3,
      opacity: Math.random() * 0.6 + 0.3,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
      layer: 2,
    });
  }

  // Layer 3: fast foreground stars
  for (let i = 0; i < 28; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2.5 + 1.5,
      speed: Math.random() * 1.0 + 0.6,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.04 + 0.015,
      twinkleOffset: Math.random() * Math.PI * 2,
      layer: 3,
    });
  }

  // 5 nebulae
  for (let i = 0; i < 5; i++) {
    nebulae.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 150 + 80,
      hue: Math.random() * 360,
      opacity: Math.random() * 0.06 + 0.02,
    });
  }

  return { stars, nebulae };
}

export function useStarfield(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  getSpeedScale: () => number
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let time = 0;

    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };

    const { stars, nebulae } = createStarData(W, H);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const speedScale = getSpeedScale();
      time += 1;

      // Draw nebulae
      for (const neb of nebulae) {
        const gradient = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
        gradient.addColorStop(0, `hsla(${neb.hue}, 60%, 50%, ${neb.opacity})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(neb.x - neb.radius, neb.y - neb.radius, neb.radius * 2, neb.radius * 2);
      }

      // Draw and update stars
      for (const star of stars) {
        // Update position
        star.y += star.speed * speedScale * 60;
        if (star.y > H) {
          star.y = 0;
          star.x = Math.random() * W;
        }

        // Twinkling
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const alpha = star.opacity * (0.7 + 0.3 * twinkle);

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Motion trail for fast stars
        if (star.layer === 3 && speedScale > 0.02) {
          const trailLength = star.speed * speedScale * 30;
          const gradient = ctx.createLinearGradient(star.x, star.y, star.x, star.y - trailLength);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`);
          gradient.addColorStop(1, 'transparent');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = star.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x, star.y - trailLength);
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef, getSpeedScale]);
}

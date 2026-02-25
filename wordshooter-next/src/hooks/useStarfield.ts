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

  // Match index.html starfield layers exactly
  const LAYERS = [
    { count: 120, speed: 0.18, minR: 0.3, maxR: 0.8, alpha: 0.45 },
    { count: 60,  speed: 0.55, minR: 0.6, maxR: 1.3, alpha: 0.65 },
    { count: 28,  speed: 1.2,  minR: 1.0, maxR: 2.0, alpha: 0.85 },
  ];

  for (let li = 0; li < LAYERS.length; li++) {
    const layer = LAYERS[li];
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: layer.minR + Math.random() * (layer.maxR - layer.minR),
        speed: layer.speed * (0.7 + Math.random() * 0.6),
        opacity: layer.alpha * (0.6 + Math.random() * 0.4),
        twinkleSpeed: 0.01 + Math.random() * 0.025,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: li + 1,
      });
    }
  }

  // 4 nebulae
  for (let i = 0; i < 4; i++) {
    nebulae.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 150 + 80,
      hue: Math.random() * 360,
      opacity: 0.018 + Math.random() * 0.022,
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

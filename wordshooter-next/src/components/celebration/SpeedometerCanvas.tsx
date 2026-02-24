'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import styles from '@/styles/celebration.module.css';

const RANKS = ['NOOB', 'MEH', 'BLUR', 'POWER', 'WIRA', 'GEMPAK', 'ELITE', 'JAGUH', 'LEGEND', 'OTAI'];
const SCORE_MAX = 1000;

export default function SpeedometerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const score = useGameStore((s) => s.score);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.offsetWidth;
    const cssHeight = cssWidth * 0.55;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.height = cssHeight + 'px';
    ctx.scale(dpr, dpr);

    const GLOW_PAD = 12;
    ctx.translate(GLOW_PAD, GLOW_PAD);

    const W = cssWidth - GLOW_PAD * 2;
    const H = cssHeight - GLOW_PAD;

    const clampedScore = Math.min(score, SCORE_MAX);
    const rankIndex = clampedScore >= 900 ? 9 : clampedScore >= 800 ? 8 : clampedScore >= 700 ? 7
      : clampedScore >= 600 ? 6 : clampedScore >= 500 ? 5 : clampedScore >= 400 ? 4
      : clampedScore >= 300 ? 3 : clampedScore >= 200 ? 2 : clampedScore >= 100 ? 1 : 0;
    const rankLabel = RANKS[rankIndex];
    const needleRatio = clampedScore / SCORE_MAX;

    const trackW = 30;
    const half = trackW / 2;
    const cx = W / 2;
    const R = (W / 2) - half - 4;
    const cy = R + half + 4;
    const START = Math.PI;
    const END = 0;

    // Animate
    const duration = 1500;
    const startT = performance.now();

    const drawFrame = (ratio: number, glowAlpha: number) => {
      ctx.clearRect(-GLOW_PAD, -GLOW_PAD, cssWidth, cssHeight);

      // Background arc
      ctx.beginPath();
      ctx.arc(cx, cy, R, START, END);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = trackW;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Filled arc
      const angle = START + (END - START + 2 * Math.PI) % (2 * Math.PI) * ratio;
      if (ratio > 0.001) {
        ctx.beginPath();
        ctx.arc(cx, cy, R, START, START + (Math.PI * ratio));
        const grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
        grad.addColorStop(0, '#FFD400');
        grad.addColorStop(1, '#FF6B00');
        ctx.strokeStyle = grad;
        ctx.lineWidth = trackW;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glow
        ctx.shadowColor = '#FFD400';
        ctx.shadowBlur = 15 * glowAlpha;
        ctx.beginPath();
        ctx.arc(cx, cy, R, START, START + (Math.PI * ratio));
        ctx.strokeStyle = `rgba(255,212,0,${0.3 * glowAlpha})`;
        ctx.lineWidth = trackW + 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Rank ticks
      for (let i = 0; i <= 10; i++) {
        const tickAngle = START + (Math.PI * i) / 10;
        const inner = R - half - 6;
        const outer = R - half - 2;
        ctx.beginPath();
        ctx.moveTo(cx + inner * Math.cos(tickAngle), cy + inner * Math.sin(tickAngle));
        ctx.lineTo(cx + outer * Math.cos(tickAngle), cy + outer * Math.sin(tickAngle));
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Text
      ctx.fillStyle = '#fff';
      ctx.font = "bold 24px 'Press Start 2P'";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(ratio * SCORE_MAX)), cx, cy - 10);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = "10px 'Press Start 2P'";
      ctx.fillText(rankLabel, cx, cy + 16);
    };

    let rafId: number;
    const animate = (now: number) => {
      const elapsed = now - startT;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      drawFrame(eased * needleRatio, eased);
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [score]);

  return <canvas ref={canvasRef} className={styles.speedometerCanvas} width={520} height={300} />;
}

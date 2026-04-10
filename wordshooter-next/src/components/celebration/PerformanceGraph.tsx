'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatTime } from '@/utils/formatTime';
import styles from '@/styles/celebration.module.css';

export default function PerformanceGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wpmHistory = useGameStore((s) => s.wpmHistory);
  const accuracyHistory = useGameStore((s) => s.accuracyHistory);
  const spmHistory = useGameStore((s) => s.spmHistory);
  const solveTimeHistory = useGameStore((s) => s.solveTimeHistory);
  const isMathMode = useGameStore((s) => s.isMathMode);
  const mode = useGameStore((s) => s.mode);
  const startTime = useGameStore((s) => s.startTime);

  const isMath = isMathMode || mode === 'math';
  const primaryData = isMath ? spmHistory : wpmHistory;
  const secondaryData = isMath ? solveTimeHistory : accuracyHistory;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    const PAD = 4;
    const W = cssW - PAD * 2;
    const H = cssH - PAD * 2;
    ctx.translate(PAD, PAD);

    // Clear
    ctx.clearRect(-PAD, -PAD, cssW, cssH);

    if (primaryData.length < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = "10px 'Press Start 2P'";
      ctx.textAlign = 'center';
      ctx.fillText('Not enough data', W / 2, H / 2);
      return;
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (H / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const drawLine = (data: number[], color: string, maxVal: number) => {
      if (data.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';

      data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - (val / maxVal) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill area under line
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, color.replace('1)', '0.15)'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    const maxPrimary = Math.max(...primaryData, 1);
    const maxSecondary = isMath ? Math.max(...secondaryData, 1) : 100;

    drawLine(primaryData, 'rgba(255, 212, 0, 1)', maxPrimary);
    drawLine(secondaryData, 'rgba(16, 185, 129, 1)', maxSecondary);
  }, [primaryData, secondaryData, isMath]);

  const totalTime = startTime ? (Date.now() - startTime) / 1000 : 0;
  const halfTime = totalTime / 2;

  return (
    <div className={styles.graphContainer}>
      <canvas ref={canvasRef} className={styles.performanceGraph} width={520} height={300} />
      <div className={styles.graphLabels}>
        <div className={styles.graphTimeLabel}>0:00</div>
        <div className={`${styles.graphTimeLabel} ${styles.center}`}>
          ({formatTime(halfTime)})
        </div>
        <div className={styles.graphTimeLabel}>{formatTime(totalTime)}</div>
      </div>
      <div className={styles.graphLegend}>
        <span style={{ color: '#FFD400' }}>&#9632; {isMath ? 'SPS' : 'WPM'}</span>
        &nbsp;&nbsp;
        <span style={{ color: '#10b981' }}>&#9632; {isMath ? 'Solve Time' : 'Accuracy'}</span>
      </div>
    </div>
  );
}

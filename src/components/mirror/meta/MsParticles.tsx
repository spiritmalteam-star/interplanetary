"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the laboratory's particle field. Entity-colored     */
/*  motes drift upward and join hands with lines when they come near.  */
/* ------------------------------------------------------------------ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
}

export function MsParticles({
  accentRgb = "120, 200, 255",
  density = 70,
  className = "",
}: {
  accentRgb?: string;
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const accentRgbLocal = accentRgb;

    const spawn = (): Particle => ({
      x: Math.random() * w,
      y: h + Math.random() * 40,
      vx: Math.random() * 0.25 - 0.125,
      vy: -(0.25 + Math.random() * 0.55),
      r: 0.6 + Math.random() * 1.6,
      life: 0,
      maxLife: 420 + Math.random() * 260,
    });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(24, Math.min(density, Math.floor((w * h) / 18000)));
      particles = Array.from({ length: count }, () => ({
        ...spawn(),
        y: Math.random() * h,
      }));
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const rgb = accentRgbLocal;

      for (const p of particles) {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -30 || p.life > p.maxLife) {
          Object.assign(p, spawn());
          continue;
        }
        const fadeIn = Math.min(1, p.life / (p.maxLife * 0.15));
        const fadeOut = Math.min(1, (p.maxLife - p.life) / (p.maxLife * 0.3));
        const alpha = 0.5 * Math.min(fadeIn, fadeOut);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fill();
      }

      /* connective tissue — lines between close particles */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 110 * 110) {
            const alpha = (1 - Math.sqrt(d2) / 110) * 0.14;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    if (reduced) {
      /* one static frame: presence without movement */
      draw();
      window.cancelAnimationFrame(raf);
    } else {
      raf = window.requestAnimationFrame(draw);
    }

    const onResize = () => {
      resize();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [density, accentRgb]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}

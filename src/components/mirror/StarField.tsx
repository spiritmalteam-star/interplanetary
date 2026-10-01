"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  drift: number;
  hue: "cyan" | "warm";
}

/**
 * StarField — tiny, sparse, low-opacity stars drifting very slowly.
 * Only visible in dark mode. Honors prefers-reduced-motion.
 */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(110, Math.floor((w * h) / 16000));
      stars = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 0.9,
        baseAlpha: 0.12 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.00008 + Math.random() * 0.00022, // rad per ms — very slow twinkle
        drift: 0.4 + Math.random() * 1.1, // px per minute
        hue: Math.random() < 0.82 ? "cyan" : "warm",
      }));
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = s.baseAlpha * 0.8;
        ctx.fillStyle = s.hue === "cyan" ? "#e6e6e5" : "#f7f7f6";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const frame = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(s.phase + t * s.speed);
        const a = Math.max(0.03, s.baseAlpha * tw);
        const y = s.y - ((t / 60000) * s.drift * 10) % (h + 20);
        ctx.globalAlpha = a;
        ctx.fillStyle = s.hue === "cyan" ? "#e6e6e5" : "#f7f7f6";
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    build();

    if (resolvedTheme === "dark") {
      if (reduced) {
        drawStatic();
      } else {
        raf = requestAnimationFrame(frame);
      }
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    const onResize = () => {
      build();
      if (resolvedTheme === "dark" && reduced) drawStatic();
    };
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700"
      style={{ opacity: "var(--star-opacity)" }}
    />
  );
}

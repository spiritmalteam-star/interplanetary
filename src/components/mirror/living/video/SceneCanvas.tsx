"use client";

/* ------------------------------------------------------------------ */
/*  THE FILM'S OWN CANVAS — Mode A's programmatic scenes.              */
/*                                                                     */
/*  The nine registered scene templates, drawn by hand on one canvas:  */
/*  time-based motion, one accent, the scene's own labels, the film's  */
/*  heading and spoken words. The SAME draw paints the live preview    */
/*  and the recorded frames — what the visitor watches is exactly      */
/*  what the film becomes. No heavy libraries, no generated code:      */
/*  only the house's own drawing law.                                  */
/* ------------------------------------------------------------------ */

export interface SceneFrame {
  template: string;
  heading: string;
  onScreenText: string;
  narration?: string;
  labels: string[];
  accent: string;
  /** seconds into the scene */
  t: number;
  /** 0..1 progress through the scene (for fades) */
  p: number;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------- the templates -------------------------- */

function drawSpiral(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  const cx = w / 2;
  const cy = h / 2;
  const rot = f.t * 0.35;
  for (let arm = 0; arm < 2; arm++) {
    ctx.beginPath();
    for (let i = 0; i <= 220; i++) {
      const th = (i / 220) * Math.PI * 6.8 + rot + arm * Math.PI;
      const r = 4 * Math.exp(0.16 * th);
      if (r > Math.min(w, h) * 0.46) break;
      const x = cx + Math.cos(th) * r;
      const y = cy + Math.sin(th) * r * 0.74;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = f.accent;
    ctx.globalAlpha = arm === 0 ? 0.85 : 0.4;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const pulse = 3 + Math.sin(f.t * 2.4) * 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
  ctx.fillStyle = f.accent;
  ctx.fill();
}

function drawWavefield(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const amp = (h * 0.07) * (1 + i * 0.28);
    const yBase = h / 2 + (i - 1.5) * 8;
    for (let x = 0; x <= w; x += 6) {
      const y =
        yBase +
        Math.sin((x / w) * Math.PI * 2 * (1.6 + i * 0.35) + f.t * (1.1 + i * 0.22)) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = f.accent;
    ctx.globalAlpha = 0.85 - i * 0.17;
    ctx.lineWidth = i === 0 ? 2 : 1.2;
    if (i % 2) ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
}

function drawHelix(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  const amp = h * 0.26;
  const freq = 2.1;
  const drift = f.t * 0.9;
  for (const phase of [0, Math.PI]) {
    ctx.beginPath();
    for (let x = w * 0.08; x <= w * 0.92; x += 5) {
      const y = h / 2 + Math.sin((x / w) * Math.PI * 2 * freq + phase + drift) * amp;
      if (x === w * 0.08) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = f.accent;
    ctx.globalAlpha = phase === 0 ? 0.95 : 0.5;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 0.4;
  for (let x = w * 0.1; x <= w * 0.9; x += 26) {
    const y1 = h / 2 + Math.sin((x / w) * Math.PI * 2 * freq + drift) * amp;
    const y2 = h / 2 + Math.sin((x / w) * Math.PI * 2 * freq + Math.PI + drift) * amp;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawOrbits(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  const cx = w / 2;
  const cy = h / 2;
  const rings = [0.16, 0.27, 0.38];
  for (const r of rings) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * r, w * r * 0.42, 0, 0, Math.PI * 2);
    ctx.strokeStyle = f.accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
  const speeds = [0.5, 0.3, 0.2];
  rings.forEach((r, i) => {
    const a = f.t * speeds[i] + i * 2.1;
    const x = cx + Math.cos(a) * w * r;
    const y = cy + Math.sin(a) * w * r * 0.42;
    ctx.beginPath();
    ctx.arc(x, y, 4.5 - i, 0, Math.PI * 2);
    ctx.fillStyle = f.accent;
    ctx.fill();
  });
  const pulse = 9 + Math.sin(f.t * 1.8) * 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
  ctx.fillStyle = f.accent;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPyramids(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  const groundY = h * 0.72;
  const pyrs = [
    { x: w * 0.3, bw: w * 0.34, bh: h * 0.42, o: 0.9 },
    { x: w * 0.58, bw: w * 0.24, bh: h * 0.3, o: 0.55 },
    { x: w * 0.12, bw: w * 0.18, bh: h * 0.22, o: 0.38 },
  ];
  for (const p of pyrs) {
    ctx.beginPath();
    ctx.moveTo(p.x - p.bw / 2, groundY);
    ctx.lineTo(p.x, groundY - p.bh);
    ctx.lineTo(p.x + p.bw / 2, groundY);
    ctx.closePath();
    ctx.strokeStyle = f.accent;
    ctx.globalAlpha = p.o;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, groundY - p.bh);
    ctx.lineTo(p.x + p.bw / 2, groundY);
    ctx.lineTo(p.x + p.bw * 0.2, groundY);
    ctx.closePath();
    ctx.fillStyle = f.accent;
    ctx.globalAlpha = p.o * 0.16;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  /* the wanderer above */
  const sx = w * 0.82;
  const sy = h * 0.2 + Math.sin(f.t * 0.7) * 5;
  ctx.beginPath();
  ctx.arc(sx, sy, 13, 0, Math.PI * 2);
  ctx.strokeStyle = f.accent;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.globalAlpha = 1;
  /* the dune line */
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  ctx.quadraticCurveTo(w / 2, groundY - h * 0.05, w, groundY + 2);
  ctx.strokeStyle = f.accent;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawNeural(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  const rng = mulberry(hash(f.heading + f.accent));
  const N = 22;
  const pts = Array.from({ length: N }, () => ({
    x: w * 0.06 + rng() * w * 0.88,
    y: h * 0.16 + rng() * h * 0.66,
    r: 1.8 + rng() * 2.6,
    ph: rng() * Math.PI * 2,
  }));
  for (let i = 0; i < N; i++) {
    const near = pts
      .map((p, j) => ({ j, d: (p.x - pts[i].x) ** 2 + (p.y - pts[i].y) ** 2 }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const n of near) {
      if (n.j < i) continue;
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[n.j].x, pts[n.j].y);
      ctx.strokeStyle = f.accent;
      ctx.globalAlpha = 0.28 + Math.sin(f.t * 1.2 + i) * 0.08;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + Math.sin(f.t * 2 + p.ph) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = f.accent;
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLattice(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  const cx = w / 2;
  const cy = h / 2;
  const rings = [0.1, 0.2, 0.3, 0.4];
  const petals = 9;
  rings.forEach((rr, ri) => {
    const r = Math.min(w, h) * rr;
    ctx.globalAlpha = 0.5 - ri * 0.09;
    ctx.strokeStyle = f.accent;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    for (let p = 0; p < petals; p++) {
      const a = (p / petals) * Math.PI * 2 + ri * 0.22 + f.t * 0.12;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.min(w, h) * 0.05, 0, Math.PI * 2);
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1;
}

function drawBlueprint(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  const dash = [7, 5];
  ctx.strokeStyle = f.accent;
  ctx.setLineDash(dash);
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.9;
  ctx.strokeRect(w * 0.16, h * 0.24, w * 0.42, h * 0.42);
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1;
  ctx.strokeRect(w * 0.22, h * 0.33, w * 0.18, h * 0.16);
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.45, Math.min(w, h) * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.45, Math.min(w, h) * 0.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.58, h * 0.45);
  ctx.lineTo(w * 0.64, h * 0.45);
  ctx.moveTo(w * 0.8, h * 0.45);
  ctx.lineTo(w * 0.88, h * 0.45);
  ctx.stroke();
  /* the measure lines */
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.86);
  ctx.lineTo(w * 0.92, h * 0.86);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawCurves(ctx: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame): void {
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = f.accent;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, cy);
  ctx.lineTo(w * 0.92, cy);
  ctx.moveTo(cx, h * 0.1);
  ctx.lineTo(cx, h * 0.9);
  ctx.stroke();
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI * 2 + f.t * 0.25;
    const x = cx + Math.sin(3 * t) * w * 0.34;
    const y = cy + Math.sin(2 * t) * h * 0.3;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 160; i++) {
    const t = (i / 160) * Math.PI * 2;
    const x = cx + Math.sin(5 * t) * w * 0.26;
    const y = cy + Math.sin(4 * t) * h * 0.22;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

const DRAWERS: Record<string, (c: CanvasRenderingContext2D, w: number, h: number, f: SceneFrame) => void> = {
  spiral: drawSpiral,
  wavefield: drawWavefield,
  helix: drawHelix,
  orbits: drawOrbits,
  pyramids: drawPyramids,
  neural: drawNeural,
  lattice: drawLattice,
  blueprint: drawBlueprint,
  curves: drawCurves,
};

/* ---------------------------- the frame ----------------------------- */

/** One frame of the film: the scene's drawing, its words, its fades. */
export function drawFilmFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  f: SceneFrame
): void {
  /* the ground — the house's own quiet paper */
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#fbf7ee");
  bg.addColorStop(1, "#f3ecdd");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  /* the scene's own breathing ground */
  ctx.save();
  const drawer = DRAWERS[f.template] ?? drawSpiral;
  drawer(ctx, w, h, f);
  ctx.restore();

  /* the labels — the scene's named elements */
  if (f.labels.length) {
    ctx.font = "600 11px ui-monospace, monospace";
    ctx.fillStyle = f.accent;
    ctx.globalAlpha = 0.85;
    f.labels.slice(0, 3).forEach((l, i) => {
      const y = h * 0.14 + i * 16;
      ctx.beginPath();
      ctx.arc(w * 0.07, y - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(l.toUpperCase(), w * 0.07 + 8, y);
    });
    ctx.globalAlpha = 1;
  }

  /* the heading — the scene's own title */
  ctx.font = `italic 500 ${Math.round(h * 0.052)}px Georgia, serif`;
  ctx.fillStyle = "rgba(40,32,18,0.88)";
  ctx.textAlign = "center";
  ctx.fillText(f.heading, w / 2, h * 0.9, w * 0.86);

  /* the spoken words — the narration's own subtitles */
  if (f.narration) {
    ctx.font = `400 ${Math.round(h * 0.032)}px Georgia, serif`;
    ctx.fillStyle = "rgba(40,32,18,0.72)";
    const words = f.narration.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      if ((line + " " + word).trim().length > 62) {
        lines.push(line.trim());
        line = word;
      } else {
        line += " " + word;
      }
    }
    if (line.trim()) lines.push(line.trim());
    const show = lines.slice(0, 3);
    show.forEach((l, i) => {
      ctx.fillText(l, w / 2, h * (0.945 + i * 0.038), w * 0.9);
    });
  }
  ctx.textAlign = "left";

  /* the scene's own fades — in and out, gentle */
  const fade = Math.min(1, Math.min(f.p * 6, (1 - f.p) * 6));
  if (fade < 1) {
    ctx.fillStyle = `rgba(251,247,238,${1 - fade})`;
    ctx.fillRect(0, 0, w, h);
  }
}

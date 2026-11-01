"use client";

/* ================================================================== */
/*  THE SKETCH ATELIER — draw the book into existence.                 */
/*                                                                     */
/*  A small, playful drawing room that opens above the dream loom's    */
/*  one input: brushes (ink, glow, rainbow, starlight), an eraser,     */
/*  a palette of colors, three weights, and a shelf of stampable       */
/*  elements — stars, moons, hearts, coins, flowers, clouds, suns,     */
/*  trees, mountains, birds and fish — so a visitor of any age can     */
/*  draw the world the book will be born from. The finished drawing    */
/*  rides into the loom as the book's own visual seed.                 */
/*                                                                     */
/*  Pure canvas 2D — no dependencies, no network, nothing saved.       */
/* ================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bird,
  Check,
  Cloud,
  Coins,
  Eraser,
  Fish,
  Flower,
  Heart,
  Moon,
  Mountain,
  PenLine,
  Rainbow,
  Sparkles,
  Star,
  Sun,
  Trash2,
  TreePine,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export interface SketchMeta {
  strokes: number;
  colors: string[];
  stamps: string[];
}

/* ------------------------- the drawing laws ------------------------ */

const CANVAS_W = 1280;
const CANVAS_H = 800;
/* the export travels wide enough for the vision to truly SEE what the
   child drew — a bird stays a bird, coins stay coins — while still
   riding light as a JPEG data URL */
const EXPORT_W = 900;
const PARCHMENT = "#fbf6ea";
const UNDO_DEPTH = 14;

type BrushId = "ink" | "glow" | "rainbow" | "starlight";
type ToolId = BrushId | StampId;

const BRUSHES: { id: BrushId; label: string }[] = [
  { id: "ink", label: "Ink" },
  { id: "glow", label: "Glow" },
  { id: "rainbow", label: "Rainbow" },
  { id: "starlight", label: "Starlight" },
];

const COLORS = [
  "#2b2620", /* ink night */
  "#7c5cff", /* violet dream */
  "#e0567f", /* rose heart */
  "#e8862f", /* amber sun */
  "#e2b93b", /* honey gold */
  "#3f9d6b", /* moss green */
  "#2fa3b8", /* lagoon */
  "#4f7dde", /* sky deep */
  "#b0632f", /* earth clay */
  "#9a6fd0", /* twilight */
];

const SIZES = [
  { id: "fine", px: 5, dot: 7 },
  { id: "round", px: 11, dot: 12 },
  { id: "bold", px: 20, dot: 18 },
];

type StampId =
  | "star"
  | "moon"
  | "heart"
  | "coin"
  | "flower"
  | "cloud"
  | "sun"
  | "tree"
  | "mountain"
  | "bird"
  | "fish";

/* Each stamp element is drawn with plain canvas paths, at (x, y),
   scaled to `s` (roughly its radius), tinted with `color`, with a
   touch of rotation jitter so a row of them never looks mechanical. */
const STAMP_DRAWERS: Record<
  StampId,
  (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) => void
> = {
  star: (ctx, x, y, s, color) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s : s * 0.44;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },
  moon: (ctx, x, y, s, color) => {
    ctx.beginPath();
    ctx.arc(x, y, s, Math.PI * 0.32, Math.PI * 1.68, false);
    ctx.arc(x - s * 0.42, y, s * 0.78, Math.PI * 1.55, Math.PI * 0.45, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },
  heart: (ctx, x, y, s, color) => {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.72);
    ctx.bezierCurveTo(x + s * 1.24, y - s * 0.12, x + s * 0.62, y - s * 0.94, x, y - s * 0.3);
    ctx.bezierCurveTo(x - s * 0.62, y - s * 0.94, x - s * 1.24, y - s * 0.12, x, y + s * 0.72);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },
  flower: (ctx, x, y, s, color) => {
    ctx.fillStyle = color;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.ellipse(
        x + Math.cos(a) * s * 0.62,
        y + Math.sin(a) * s * 0.62,
        s * 0.42,
        s * 0.26,
        a,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, s * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = PARCHMENT;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, s * 0.09);
    ctx.stroke();
  },
  cloud: (ctx, x, y, s, color) => {
    ctx.beginPath();
    ctx.arc(x - s * 0.62, y + s * 0.18, s * 0.42, 0, Math.PI * 2);
    ctx.arc(x, y - s * 0.14, s * 0.55, 0, Math.PI * 2);
    ctx.arc(x + s * 0.64, y + s * 0.18, s * 0.4, 0, Math.PI * 2);
    ctx.rect(x - s * 0.62, y + s * 0.05, s * 1.28, s * 0.55);
    ctx.fillStyle = color;
    ctx.fill();
  },
  sun: (ctx, x, y, s, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2.4, s * 0.16);
    ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * s * 1.18, y + Math.sin(a) * s * 1.18);
      ctx.lineTo(x + Math.cos(a) * s * 1.6, y + Math.sin(a) * s * 1.6);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, s * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  },
  tree: (ctx, x, y, s, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x - s * 0.12, y + s * 0.3, s * 0.24, s * 0.9);
    ctx.beginPath();
    ctx.arc(x, y - s * 0.34, s * 0.72, 0, Math.PI * 2);
    ctx.arc(x - s * 0.44, y + s * 0.06, s * 0.48, 0, Math.PI * 2);
    ctx.arc(x + s * 0.44, y + s * 0.06, s * 0.48, 0, Math.PI * 2);
    ctx.fill();
  },
  mountain: (ctx, x, y, s, color) => {
    ctx.beginPath();
    ctx.moveTo(x - s * 1.3, y + s * 0.8);
    ctx.lineTo(x - s * 0.3, y - s * 0.9);
    ctx.lineTo(x + s * 0.24, y - s * 0.1);
    ctx.lineTo(x + s * 0.66, y - s * 0.62);
    ctx.lineTo(x + s * 1.3, y + s * 0.8);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y - s * 0.9);
    ctx.lineTo(x - s * 0.06, y - s * 0.5);
    ctx.lineTo(x - s * 0.3, y - s * 0.34);
    ctx.lineTo(x - s * 0.52, y - s * 0.52);
    ctx.closePath();
    ctx.fillStyle = PARCHMENT;
    ctx.fill();
  },
  bird: (ctx, x, y, s, color) => {
    /* a proper child's bird — filled body, head, beak, tail and a
       wing, so the vision always sees a BIRD and never a bare squiggle */
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.62, s * 0.44, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + s * 0.5, y - s * 0.34, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.74, y - s * 0.44);
    ctx.lineTo(x + s * 1.08, y - s * 0.3);
    ctx.lineTo(x + s * 0.74, y - s * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.46, y - s * 0.1);
    ctx.lineTo(x - s * 1.04, y - s * 0.34);
    ctx.lineTo(x - s * 0.94, y + s * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PARCHMENT;
    ctx.lineWidth = Math.max(4, s * 0.12);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x - s * 0.05, y + s * 0.06, s * 0.34, Math.PI * 1.12, Math.PI * 1.92);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + s * 0.56, y - s * 0.4, s * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = PARCHMENT;
    ctx.fill();
  },
  fish: (ctx, x, y, s, color) => {
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.86, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.74, y);
    ctx.lineTo(x - s * 1.24, y - s * 0.42);
    ctx.lineTo(x - s * 1.24, y + s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + s * 0.4, y - s * 0.1, s * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = PARCHMENT;
    ctx.fill();
  },
  coin: (ctx, x, y, s, color) => {
    /* a treasure coin — a bold disc with a pressed rim and star, so
       "coins" is what the vision names when a child draws treasure */
    ctx.beginPath();
    ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = PARCHMENT;
    ctx.lineWidth = Math.max(3, s * 0.1);
    ctx.beginPath();
    ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s * 0.2 : s * 0.09;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.stroke();
  },
};

const STAMPS: { id: StampId; Icon: typeof Star }[] = [
  { id: "star", Icon: Star },
  { id: "moon", Icon: Moon },
  { id: "heart", Icon: Heart },
  { id: "coin", Icon: Coins },
  { id: "flower", Icon: Flower },
  { id: "cloud", Icon: Cloud },
  { id: "sun", Icon: Sun },
  { id: "tree", Icon: TreePine },
  { id: "mountain", Icon: Mountain },
  { id: "bird", Icon: Bird },
  { id: "fish", Icon: Fish },
];

const stampIcon = (id: StampId) => STAMPS.find((s) => s.id === id)?.Icon ?? Star;

/* --------------------------- the component ------------------------- */

export function SketchPad({
  onDone,
  onCancel,
}: {
  onDone: (dataUrl: string, meta: SketchMeta) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const hueRef = useRef(268);
  const undoStackRef = useRef<string[]>([]);
  const marksRef = useRef(0);
  const colorsUsedRef = useRef<Set<string>>(new Set());
  const stampsUsedRef = useRef<Set<string>>(new Set());
  const strokesRef = useRef(0);

  const [tool, setTool] = useState<ToolId>("ink");
  const [erasing, setErasing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [sizeId, setSizeId] = useState<string>("round");
  const [touched, setTouched] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const sizePx = SIZES.find((s) => s.id === sizeId)?.px ?? 11;

  /* the fresh canvas — one parchment sheet, ready for the hand */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      undoStackRef.current.push(canvas.toDataURL("image/png"));
      if (undoStackRef.current.length > UNDO_DEPTH) undoStackRef.current.shift();
      setCanUndo(true);
    } catch {
      /* a snapshot the browser refuses — the undo simply rests */
    }
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const shot = undoStackRef.current.pop();
    if (!canvas || !ctx) return;
    if (!shot) {
      setCanUndo(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = shot;
    setCanUndo(undoStackRef.current.length > 0);
    marksRef.current = Math.max(0, marksRef.current - 1);
    setTouched(marksRef.current > 0);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    snapshot();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    marksRef.current = 0;
    setTouched(false);
  }, [snapshot]);

  const pointFromEvent = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / Math.max(1, r.width)) * canvas.width,
      y: ((e.clientY - r.top) / Math.max(1, r.height)) * canvas.height,
    };
  }, []);

  /* one segment of a living stroke — the four brushes each breathe
     their own way; the eraser lifts the ink instead of laying it */
  const strokeSegment = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number },
      brush: BrushId,
      col: string,
      w: number,
      erase: boolean
    ) => {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (erase) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = w * 2.4;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
        return;
      }
      if (brush === "ink") {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      } else if (brush === "glow") {
        ctx.shadowColor = col;
        ctx.shadowBlur = w * 2.1;
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(2, w * 0.6);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.stroke();
      } else if (brush === "rainbow") {
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        hueRef.current = (hueRef.current + dist * 0.55) % 360;
        ctx.strokeStyle = `hsl(${hueRef.current.toFixed(0)} 86% 54%)`;
        ctx.lineWidth = w;
        ctx.shadowColor = `hsl(${hueRef.current.toFixed(0)} 86% 60%)`;
        ctx.shadowBlur = w * 0.9;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      } else {
        /* starlight — a soft silver thread raining tiny four-ray
           sparkles along its path, like dust catching a dream */
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.34;
        ctx.lineWidth = Math.max(1.6, w * 0.34);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const n = Math.max(1, Math.floor(dist / 26));
        for (let i = 0; i < n; i++) {
          const t = i / Math.max(1, n - 1);
          const x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * w * 2.6;
          const y = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * w * 2.6;
          const r = w * (0.28 + Math.random() * 0.5);
          ctx.strokeStyle = col;
          ctx.lineWidth = Math.max(1.2, r * 0.34);
          ctx.beginPath();
          ctx.moveTo(x - r, y);
          ctx.lineTo(x + r, y);
          ctx.moveTo(x, y - r);
          ctx.lineTo(x, y + r);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, r * 0.32, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
        }
      }
      ctx.restore();
    },
    []
  );

  const placeStamp = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const drawer = STAMP_DRAWERS[tool as StampId];
      if (!drawer) return;
      const scale =
        (sizePx === 5 ? 58 : sizePx === 11 ? 96 : 150) * (0.9 + Math.random() * 0.24);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.translate(-x, -y);
      drawer(ctx, x, y, scale, color);
      ctx.restore();
      stampsUsedRef.current.add(tool as StampId);
      strokesRef.current += 1;
    },
    [tool, color, sizePx]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const isStamp = STAMPS.some((s) => s.id === tool);
      snapshot();
      const p = pointFromEvent(e);
      if (isStamp) {
        placeStamp(ctx, p.x, p.y);
        marksRef.current += 1;
        setTouched(true);
        return;
      }
      drawingRef.current = true;
      lastRef.current = p;
      colorsUsedRef.current.add(color);
      strokesRef.current += 1;
      marksRef.current += 1;
      setTouched(true);
      /* a touch alone already lays a dot of ink */
      strokeSegment(ctx, p, { x: p.x + 0.4, y: p.y + 0.4 }, tool as BrushId, color, sizePx, erasing);
    },
    [color, erasing, placeStamp, pointFromEvent, sizePx, snapshot, strokeSegment, tool]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const ctx = ctxRef.current;
      const last = lastRef.current;
      if (!ctx || !last) return;
      e.preventDefault();
      const p = pointFromEvent(e);
      strokeSegment(ctx, last, p, tool as BrushId, color, sizePx, erasing);
      lastRef.current = p;
    },
    [color, erasing, pointFromEvent, sizePx, strokeSegment, tool]
  );

  const endStroke = useCallback(() => {
    drawingRef.current = false;
    lastRef.current = null;
  }, []);

  /* the finished drawing rides home: composited onto parchment,
     scaled to travel light, beside the honest memory of what was used */
  const finish = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || marksRef.current === 0) return;
    const out = document.createElement("canvas");
    out.width = EXPORT_W;
    out.height = Math.round((EXPORT_W * CANVAS_H) / CANVAS_W);
    const octx = out.getContext("2d");
    if (!octx) return;
    octx.fillStyle = PARCHMENT;
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0, out.width, out.height);
    onDone(out.toDataURL("image/jpeg", 0.86), {
      strokes: strokesRef.current,
      colors: Array.from(colorsUsedRef.current).slice(0, 8),
      stamps: Array.from(stampsUsedRef.current).slice(0, 10),
    });
  }, [onDone]);

  const toolBtn =
    "focus-glow flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground";

  return (
    <div
      className="rounded-2xl border p-2.5"
      style={{
        borderColor: "color-mix(in srgb, var(--scope-a) 32%, transparent)",
        background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
      }}
      data-testid="dream-sketch-pad"
    >
      {/* the parchment sheet */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-[#fffdf6] shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
          className="block aspect-[16/10] w-full cursor-crosshair touch-none"
          aria-label={t("The drawing sheet")}
          data-testid="dream-sketch-canvas"
        />
        {!touched && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="max-w-[320px] px-6 text-center font-[family-name(var(--font-literata))] text-[13px] italic leading-relaxed text-foreground/35">
              {t(
                "Draw the book into existence — creatures, places, colors, anything the dream holds…"
              )}
            </p>
          </div>
        )}
      </div>

      {/* the brushes, the eraser, the weights */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {BRUSHES.map((b) => {
          const active = !erasing && tool === b.id;
          const Icon =
            b.id === "ink" ? PenLine : b.id === "glow" ? Wand2 : b.id === "rainbow" ? Rainbow : Sparkles;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setTool(b.id);
                setErasing(false);
              }}
              aria-pressed={active}
              title={t(b.label)}
              className={cn(
                toolBtn,
                active &&
                  "border-[var(--scope-a)] bg-[color-mix(in_srgb,var(--scope-a)_16%,transparent)] text-foreground glow-sm"
              )}
              data-testid={`dream-sketch-brush-${b.id}`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {t(b.label)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setErasing((s) => !s)}
          aria-pressed={erasing}
          title={t("Eraser")}
          className={cn(
            toolBtn,
            erasing &&
              "border-[var(--scope-a)] bg-[color-mix(in_srgb,var(--scope-a)_16%,transparent)] text-foreground glow-sm"
          )}
          data-testid="dream-sketch-eraser"
        >
          <Eraser className="size-3.5" aria-hidden="true" />
        </button>

        <span className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />

        {SIZES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSizeId(s.id)}
            aria-pressed={sizeId === s.id}
            title={t("Brush weight")}
            className={cn(
              "focus-glow flex size-7 items-center justify-center rounded-full border transition-all duration-300",
              sizeId === s.id
                ? "border-[var(--scope-a)] bg-[color-mix(in_srgb,var(--scope-a)_16%,transparent)] glow-sm"
                : "border-border hover:border-foreground/40"
            )}
          >
            <span
              className="rounded-full bg-foreground/70"
              style={{ width: s.dot, height: s.dot, maxWidth: 16, maxHeight: 16 }}
            />
          </button>
        ))}

        <span className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />

        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title={t("Undo")}
          aria-label={t("Undo")}
          className={cn(toolBtn, "px-2 disabled:cursor-not-allowed disabled:opacity-35")}
          data-testid="dream-sketch-undo"
        >
          <Undo2 className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!touched}
          title={t("Clear the sheet")}
          aria-label={t("Clear the sheet")}
          className={cn(toolBtn, "px-2 disabled:cursor-not-allowed disabled:opacity-35")}
          data-testid="dream-sketch-clear"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* the colors */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setColor(c);
              setErasing(false);
            }}
            aria-pressed={color === c && !erasing}
            title={t("Color")}
            aria-label={t("Color")}
            className={cn(
              "focus-glow flex size-7 items-center justify-center rounded-full border-2 transition-all duration-300",
              color === c
                ? "scale-110 border-foreground/70 glow-sm"
                : "border-transparent hover:scale-105 hover:border-foreground/25"
            )}
            style={{ background: c }}
          />
        ))}
      </div>

      {/* the elements — the little world a hand can summon at once */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
        {STAMPS.map(({ id, Icon }) => {
          const active = !erasing && tool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTool(id);
                setErasing(false);
              }}
              aria-pressed={active}
              title={t(id.charAt(0).toUpperCase() + id.slice(1))}
              className={cn(
                "focus-glow flex size-8 items-center justify-center rounded-full border transition-all duration-300",
                active
                  ? "border-[var(--scope-a)] bg-[color-mix(in_srgb,var(--scope-a)_16%,transparent)] text-foreground glow-sm"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
              data-testid={`dream-sketch-stamp-${id}`}
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          );
        })}

        <span className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="papyrus-btn focus-glow flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px]"
            data-testid="dream-sketch-cancel"
          >
            <X className="size-3.5" aria-hidden="true" />
            {t("Not now")}
          </button>
          <button
            type="button"
            onClick={finish}
            disabled={!touched}
            className="akashic-btn focus-glow flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium disabled:cursor-not-allowed disabled:opacity-35"
            data-testid="dream-sketch-done"
          >
            <Check className="size-3.5" aria-hidden="true" />
            {t("Draw it into the book")}
          </button>
        </span>
      </div>
    </div>
  );
}

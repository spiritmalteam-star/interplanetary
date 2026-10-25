"use client";

/* ------------------------------------------------------------------ */
/*  THE DEEP SCENES — 3D templates of the Visual Intelligence SDK.     */
/*                                                                     */
/*  Three.js arrives ONLY when a visitor opens a 3D scene (lazy        */
/*  import), and every resource it borrows is returned when the scene  */
/*  rests (dispose on unmount). While the scene stands off-screen the  */
/*  render loop sleeps; while the visitor's device asks for stillness  */
/*  the scene stands as one quiet frame.                               */
/*                                                                     */
/*  THE BOUNDARY LAW — the visitor's hand inside the scene moves the   */
/*  scene's own camera (drag rotates, wheel/pinch zooms) and never     */
/*  the branch network around it: every gesture stops at the canvas.  */
/* ------------------------------------------------------------------ */

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { useReducedMotion } from "framer-motion";
import type { Group, Material, Mesh, Vector3 } from "three";
import type { SceneId } from "@/lib/visual-scenes";
import { perfEco } from "@/lib/perf-mode";

type ThreeModule = typeof import("three");
type ThreeNS = ThreeModule;

interface Engine {
  dispose: () => void;
  reset: () => void;
  rotate: (dx: number, dy: number) => void;
  zoomBy: (factor: number) => void;
  setPaused: (p: boolean) => void;
  setReduced: (r: boolean) => void;
}

/* --------------------------- scene builders ------------------------- */

type Builder = (T: ThreeNS, accent: string, seed: number) => {
  group: import("three").Group;
  tick?: (t: number, reduced: boolean) => void;
  camera: { z: number; y?: number; fov?: number };
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pointsMaterial(T: ThreeNS, accent: string, size: number, opacity = 0.9) {
  return new T.PointsMaterial({
    color: new T.Color(accent),
    size,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    depthWrite: false,
  });
}

function lineMaterial(T: ThreeNS, accent: string, opacity = 0.35) {
  return new T.LineBasicMaterial({
    color: new T.Color(accent),
    transparent: true,
    opacity,
  });
}

const BUILDERS: Partial<Record<SceneId, Builder>> = {
  helix: (T, accent) => {
    const group = new T.Group();
    const N = 340;
    const radius = 3.4;
    const rise = 13;
    const posA = new Float32Array(N * 3);
    const posB = new Float32Array(N * 3);
    const rungPos: number[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const a = t * Math.PI * 6;
      const y = (t - 0.5) * rise;
      posA[i * 3] = Math.cos(a) * radius;
      posA[i * 3 + 1] = y;
      posA[i * 3 + 2] = Math.sin(a) * radius;
      posB[i * 3] = Math.cos(a + Math.PI) * radius;
      posB[i * 3 + 1] = y;
      posB[i * 3 + 2] = Math.sin(a + Math.PI) * radius;
      if (i % 14 === 0) {
        rungPos.push(posA[i * 3], y, posA[i * 3 + 2], posB[i * 3], y, posB[i * 3 + 2]);
      }
    }
    const gA = new T.BufferGeometry();
    gA.setAttribute("position", new T.BufferAttribute(posA, 3));
    const gB = new T.BufferGeometry();
    gB.setAttribute("position", new T.BufferAttribute(posB, 3));
    const gR = new T.BufferGeometry();
    gR.setAttribute("position", new T.BufferAttribute(new Float32Array(rungPos), 3));
    group.add(new T.Points(gA, pointsMaterial(T, accent, 0.16)));
    group.add(new T.Points(gB, pointsMaterial(T, accent, 0.16, 0.55)));
    group.add(new T.LineSegments(gR, lineMaterial(T, accent, 0.3)));
    return { group, camera: { z: 13.5, y: 0, fov: 50 } };
  },

  wavefield: (T, accent) => {
    const group = new T.Group();
    const seg = 68;
    const geo = new T.PlaneGeometry(26, 16, seg, Math.round(seg * 0.62));
    const base = (geo.attributes.position.array as Float32Array).slice();
    const mesh = new T.Points(geo, pointsMaterial(T, accent, 0.11, 0.8));
    mesh.rotation.x = -Math.PI / 2.6;
    group.add(mesh);
    return {
      group,
      camera: { z: 13, y: 3.2, fov: 50 },
      tick: (t) => {
        const arr = geo.attributes.position.array as Float32Array;
        for (let i = 0; i < arr.length; i += 3) {
          const x = base[i];
          const y = base[i + 1];
          arr[i + 2] =
            Math.sin(x * 0.5 + t * 0.9) * 0.55 +
            Math.cos(y * 0.7 + t * 0.6) * 0.4;
        }
        geo.attributes.position.needsUpdate = true;
      },
    };
  },

  orbits: (T, accent) => {
    const group = new T.Group();
    const rng = mulberry32(77);
    const core = new T.Mesh(
      new T.SphereGeometry(0.9, 24, 18),
      new T.MeshBasicMaterial({ color: new T.Color(accent), transparent: true, opacity: 0.9 })
    );
    group.add(core);
    const planets: { pivot: Group; speed: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const r = 2.6 + i * 1.55;
      const ring = new T.Line(
        new T.BufferGeometry().setFromPoints(
          Array.from({ length: 97 }, (_, k) => {
            const a = (k / 96) * Math.PI * 2;
            return new T.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
          })
        ),
        lineMaterial(T, accent, 0.22)
      );
      ring.rotation.x = (rng() - 0.5) * 0.7;
      group.add(ring);
      const pivot = new T.Group();
      pivot.rotation.x = ring.rotation.x;
      const p = new T.Mesh(
        new T.SphereGeometry(0.16 + rng() * 0.14, 12, 10),
        new T.MeshBasicMaterial({ color: new T.Color(accent), transparent: true, opacity: 0.95 })
      );
      p.position.x = r;
      pivot.add(p);
      group.add(pivot);
      planets.push({ pivot, speed: 0.5 / (i + 1) });
    }
    /* the field of far stars */
    const starN = 260;
    const sp = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      sp[i * 3] = (rng() - 0.5) * 60;
      sp[i * 3 + 1] = (rng() - 0.5) * 40;
      sp[i * 3 + 2] = (rng() - 0.5) * 60;
    }
    const sg = new T.BufferGeometry();
    sg.setAttribute("position", new T.BufferAttribute(sp, 3));
    group.add(new T.Points(sg, pointsMaterial(T, "#ffffff", 0.06, 0.5)));
    return {
      group,
      camera: { z: 14, y: 4, fov: 50 },
      tick: (t) => {
        for (const p of planets) p.pivot.rotation.y = t * p.speed * 0.7;
      },
    };
  },

  pyramids: (T, accent) => {
    const group = new T.Group();
    const mk = (x: number, z: number, size: number, h: number) => {
      const cone = new T.Mesh(
        new T.ConeGeometry(size, h, 4),
        new T.MeshBasicMaterial({
          color: new T.Color(accent),
          transparent: true,
          opacity: 0.16,
        })
      );
      cone.position.set(x, h / 2, z);
      cone.rotation.y = Math.PI / 4;
      const wire = new T.LineSegments(
        new T.EdgesGeometry(cone.geometry),
        lineMaterial(T, accent, 0.65)
      );
      wire.position.copy(cone.position);
      wire.rotation.y = cone.rotation.y;
      group.add(cone, wire);
    };
    mk(0, 0, 3.6, 4.6);
    mk(4.6, 1.6, 2.5, 3.2);
    mk(-4.2, 2.2, 1.9, 2.4);
    const ground = new T.Line(
      new T.BufferGeometry().setFromPoints([
        new T.Vector3(-12, 0, 6),
        new T.Vector3(12, 0, 6),
      ]),
      lineMaterial(T, accent, 0.3)
    );
    group.add(ground);
    /* one bright wanderer above */
    const sun = new T.Mesh(
      new T.SphereGeometry(0.42, 16, 12),
      new T.MeshBasicMaterial({ color: new T.Color(accent), transparent: true, opacity: 0.9 })
    );
    sun.position.set(5.2, 6.4, -4);
    group.add(sun);
    return {
      group,
      camera: { z: 12.5, y: 3.4, fov: 50 },
      tick: (t, reduced) => {
        if (!reduced) sun.position.y = 6.4 + Math.sin(t * 0.5) * 0.25;
      },
    };
  },

  neural: (T, accent, seed) => {
    const group = new T.Group();
    const rng = mulberry32(seed);
    const N = 60;
    const pts: Vector3[] = [];
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = new T.Vector3(
        (rng() - 0.5) * 11,
        (rng() - 0.5) * 7,
        (rng() - 0.5) * 9
      );
      pts.push(v);
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;
    }
    const pg = new T.BufferGeometry();
    pg.setAttribute("position", new T.BufferAttribute(pos, 3));
    group.add(new T.Points(pg, pointsMaterial(T, accent, 0.18, 0.95)));
    const linePos: number[] = [];
    for (let i = 0; i < N; i++) {
      const near = pts
        .map((p, j) => ({ j, d: p.distanceToSquared(pts[i]) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const n of near)
        if (n.j > i) linePos.push(pts[i].x, pts[i].y, pts[i].z, pts[n.j].x, pts[n.j].y, pts[n.j].z);
    }
    const lg = new T.BufferGeometry();
    lg.setAttribute("position", new T.BufferAttribute(new Float32Array(linePos), 3));
    const lines = new T.LineSegments(lg, lineMaterial(T, accent, 0.28));
    group.add(lines);
    return {
      group,
      camera: { z: 12, y: 0, fov: 50 },
      tick: (t, reduced) => {
        if (reduced) return;
        group.rotation.y = t * 0.06;
        lines.material.opacity = 0.22 + Math.sin(t * 0.8) * 0.08;
      },
    };
  },

  lattice: (T, accent) => {
    const group = new T.Group();
    const ico = new T.Mesh(
      new T.IcosahedronGeometry(4.4, 1),
      new T.MeshBasicMaterial({
        color: new T.Color(accent),
        transparent: true,
        opacity: 0.08,
      })
    );
    const wire = new T.LineSegments(
      new T.EdgesGeometry(ico.geometry),
      lineMaterial(T, accent, 0.5)
    );
    group.add(ico, wire);
    const inner = new T.LineSegments(
      new T.EdgesGeometry(new T.IcosahedronGeometry(2.4, 0)),
      lineMaterial(T, accent, 0.65)
    );
    group.add(inner);
    const rng = mulberry32(21);
    const N = 130;
    const sp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = new T.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5)
        .normalize()
        .multiplyScalar(4.4 * (0.98 + rng() * 0.04));
      sp[i * 3] = v.x;
      sp[i * 3 + 1] = v.y;
      sp[i * 3 + 2] = v.z;
    }
    const sg = new T.BufferGeometry();
    sg.setAttribute("position", new T.BufferAttribute(sp, 3));
    group.add(new T.Points(sg, pointsMaterial(T, accent, 0.1, 0.85)));
    return {
      group,
      camera: { z: 11.5, y: 0, fov: 50 },
      tick: (t, reduced) => {
        if (reduced) return;
        wire.rotation.y = t * 0.07;
        ico.rotation.y = t * 0.07;
        inner.rotation.y = -t * 0.12;
        inner.rotation.x = t * 0.05;
      },
    };
  },

  spiral: (T, accent) => {
    const group = new T.Group();
    const pts: Vector3[] = [];
    const b = 0.24;
    for (let i = 0; i < 420; i++) {
      const th = (i / 420) * Math.PI * 7;
      const r = 0.35 * Math.exp(b * th);
      if (r > 9) break;
      pts.push(new T.Vector3(Math.cos(th) * r, (i / 420) * 3.4 - 1.7, Math.sin(th) * r));
    }
    const geo = new T.BufferGeometry().setFromPoints(pts);
    group.add(new T.Points(geo, pointsMaterial(T, accent, 0.14)));
    group.add(new T.Line(geo, lineMaterial(T, accent, 0.4)));
    return {
      group,
      camera: { z: 11, y: 4.5, fov: 50 },
      tick: (t, reduced) => {
        if (reduced) return;
        group.rotation.y = t * 0.1;
      },
    };
  },
};

const FALLBACK_3D: Builder = BUILDERS.spiral as Builder;

/* ------------------------------ engine ------------------------------ */

function buildEngine(
  canvas: HTMLCanvasElement,
  T: ThreeNS,
  scene: SceneId,
  accent: string,
  seed: number,
  reducedInitial: boolean
): Engine {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  /* AUTOMATIC PERFORMANCE MODE — weaker devices receive the lighter
     render honestly: one lower pixel ceiling, everything still smooth */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, perfEco() ? 1 : 1.5));

  const builder = BUILDERS[scene] ?? FALLBACK_3D;
  const built = builder(T, accent, seed);
  const sceneObj = new T.Scene();
  sceneObj.add(built.group);

  const camera = new T.PerspectiveCamera(
    built.camera.fov ?? 50,
    1,
    0.1,
    200
  );
  const HOME = { rotX: 0.32, rotY: 0.5, dist: built.camera.z, y: built.camera.y ?? 0 };
  camera.position.set(0, HOME.y, HOME.dist);
  camera.lookAt(0, 0, 0);

  let rotX = HOME.rotX;
  let rotY = HOME.rotY;
  let dist = HOME.dist;
  let vRotX = rotX;
  let vRotY = rotY;
  let vDist = dist;
  let paused = false;
  let reduced = reducedInitial;
  let raf = 0;
  let disposed = false;
  let t0 = performance.now();
  const elapsed = () => (performance.now() - t0) / 1000;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  /* one pivot, born once — the per-frame camera orbit reuses it
     instead of raising a new Group at display refresh rate */
  const pivot = new T.Group();

  const frame = () => {
    /* the sleeping scene schedules nothing: a paused or unmounted loop
       never wakes a no-op callback at display refresh rate */
    if (paused || disposed) {
      raf = 0;
      return;
    }
    const t = elapsed();
    built.tick?.(t, reduced);
    vRotX += (rotX - vRotX) * 0.12;
    vRotY += (rotY - vRotY) * 0.12;
    vDist += (dist - vDist) * 0.12;
    pivot.rotation.x = vRotX;
    pivot.rotation.y = vRotY;
    pivot.updateMatrixWorld();
    camera.position.set(0, HOME.y, vDist).applyMatrix4(pivot.matrixWorld);
    camera.lookAt(0, 0, 0);
    renderer.render(sceneObj, camera);
    raf = requestAnimationFrame(frame);
  };

  /* the loop's one door back in — every waking passes through here,
     and a loop already running is never scheduled twice */
  const wake = () => {
    if (raf || paused || disposed || reduced) return;
    raf = requestAnimationFrame(frame);
  };

  if (!reduced) {
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  } else {
    /* one honest still frame */
    built.tick?.(0, true);
    renderer.render(sceneObj, camera);
  }

  const io = new IntersectionObserver((entries) => {
    paused = !entries[0]?.isIntersecting;
    /* back in view — the loop rises again */
    if (!paused) wake();
  });
  io.observe(canvas);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      sceneObj.traverse((obj) => {
        const mesh = obj as Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as unknown as { material?: Material }).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      pivot.clear();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
    reset() {
      rotX = HOME.rotX;
      rotY = HOME.rotY;
      dist = HOME.dist;
    },
    rotate(dx, dy) {
      rotY = Math.max(-Math.PI, Math.min(Math.PI, rotY + dx));
      rotX = Math.max(-1.2, Math.min(1.35, rotX + dy));
      /* a still scene wakes for the hand that touches it */
      if (reduced) {
        reduced = false;
        if (!raf) t0 = performance.now();
      }
      wake();
    },
    zoomBy(factor) {
      dist = Math.max(HOME.dist * 0.42, Math.min(HOME.dist * 2.1, dist * factor));
      if (reduced) {
        reduced = false;
        if (!raf) t0 = performance.now();
      }
      wake();
    },
    setPaused(p) {
      paused = p;
      /* the pause hand lifts — the loop rises with it */
      if (!p) wake();
    },
    setReduced(r) {
      reduced = r;
    },
  };
}

/* --------------------------- the component -------------------------- */

export const Scene3D = memo(function Scene3D({
  scene,
  accent,
  seedKey,
  testIdPrefix,
  paused,
  spec,
}: {
  scene: SceneId;
  accent: string;
  seedKey: string;
  testIdPrefix?: string;
  /** THE PAUSE HAND — the loop sleeps, the frame stands. */
  paused?: boolean;
  /** The validated specification — a quiet legend of named elements. */
  spec?: { entities: string[]; relationships: string[] } | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduced = useReducedMotion();
  const seed = useMemo(() => hashStr(`3d:${scene}:${seedKey}`), [scene, seedKey]);

  useEffect(() => {
    let dead = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    (async () => {
      try {
        const T = await import("three");
        if (dead) return;
        engineRef.current = buildEngine(
          canvas,
          T,
          scene,
          accent,
          seed,
          !!reduced
        );
        setReady(true);
      } catch {
        if (!dead) setFailed(true);
      }
    })();
    return () => {
      dead = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
     
  }, [scene, seedKey]);

  useEffect(() => {
    engineRef.current?.setReduced(!!reduced);
  }, [reduced]);

  /* THE PAUSE HAND — the engine's own loop rests while the hand holds */
  useEffect(() => {
    engineRef.current?.setPaused(!!paused);
  }, [paused, ready]);

  /* THE BOUNDARY LAW — gestures end at the scene's own glass */
  const dragRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const pinchRef = useRef<{ d: number; active: boolean }>({ d: 0, active: false });

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    dragRef.current = { x: e.clientX, y: e.clientY, active: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    e.stopPropagation();
    const engine = engineRef.current;
    if (!engine) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    engine.rotate(dx * 0.0052, dy * 0.0042);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    dragRef.current.active = false;
    pinchRef.current.active = false;
  };
  /* two quiet fingers — pinch to come closer or drift away */
  const onTouchEnd = (e: ReactTouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    dragRef.current.active = false;
    pinchRef.current.active = false;
  };
  const onTouchMove = (e: ReactTouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 2) return;
    e.stopPropagation();
    const [a, b] = [e.touches[0], e.touches[1]];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (pinchRef.current.active && pinchRef.current.d > 0) {
      engineRef.current?.zoomBy(pinchRef.current.d / Math.max(1, d));
    }
    pinchRef.current = { d, active: true };
    dragRef.current.active = false;
  };
  const onWheel = (e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    /* zoom handled by the native canvas listener registered below */
  };

  /* wheel + drag live as native listeners so they can stopPropagation
     at the lowest level (React's synthetic wheel is passive) */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheelNative = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
      engineRef.current?.zoomBy(Math.exp(e.deltaY * 0.0012));
    };
    canvas.addEventListener("wheel", onWheelNative, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheelNative);
  }, []);

  if (failed) {
    return (
      <div
        className="flex h-full w-full items-center justify-center text-[11px] italic text-muted-foreground"
        data-testid={testIdPrefix ? `${testIdPrefix}-scene-3d-failed` : undefined}
      >
        The deep scene could not rise here — the words remain.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" data-testid={testIdPrefix ? `${testIdPrefix}-scene-3d` : undefined}>
      <canvas
        ref={canvasRef}
        className="nowheel nopan nodrag h-full w-full cursor-grab touch-none active:cursor-grabbing"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 500ms ease" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            The scene gathers…
          </span>
        </div>
      )}
      {/* THE LEGEND — the elements the transmission itself named, so the
          scene is read as an explanation, never a decoration */}
      {ready && spec && (spec.entities.length > 0 || spec.relationships.length > 0) && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 bg-gradient-to-t from-[color-mix(in_srgb,var(--background)_88%,transparent)] to-transparent px-3 pb-1.5 pt-4"
          data-testid={testIdPrefix ? `${testIdPrefix}-scene-3d-legend` : undefined}
        >
          {spec.entities.slice(0, 4).map((e, i) => (
            <span
              key={`${e}:${i}`}
              className="mono-label text-[8px] uppercase tracking-[0.14em] text-foreground/75"
            >
              {i > 0 && <span className="mr-2 text-muted-foreground/50">·</span>}
              {e}
            </span>
          ))}
          {spec.relationships.length > 0 && (
            <span
              className="w-full truncate text-[9.5px] italic leading-tight text-muted-foreground"
              title={spec.relationships.join(" · ")}
            >
              {spec.relationships[0]}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

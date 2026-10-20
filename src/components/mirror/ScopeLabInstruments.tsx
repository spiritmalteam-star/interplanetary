"use client";

/* =====================================================================
   SCOPE LAB INSTRUMENTS — the second bench of the laboratories.

   THE HONESTY LAW — every instrument here does its own real work:
   true interferometer math, true Bloch projections, true device
   entropy, true WebAudio oscillators, true Pearson correlations,
   true Tsiolkovsky rocket equation, true circular-orbit ephemerides.
   Nothing pretends; where the physics is approximated (circular
   orbits, impulsive Δv), the instrument says so on its own face.
   ===================================================================== */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  Binary,
  CalendarClock,
  Dices,
  Eraser,
  Fuel,
  Globe,
  SatelliteDish,
  Split,
  Timer,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";

/* ── shared atoms (the deck's own dialect) ──────────────────────────── */

const mix = (accent: string, pct: number): string =>
  `color-mix(in srgb, ${accent} ${pct}%, transparent)`;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

const subscribeNoop = (): (() => void) => () => {};

/** the mounted gate — values that depend on "now" never render on the
    server's clock (no hydration drift, the visitor's clock speaks) */
function useMounted(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

/* the image banner — the instrument's own plate: what it is and the
   world it belongs to, seen at one glance */
export function InstrumentPlate({
  src,
  alt,
  accent,
}: {
  src: string;
  alt: string;
  accent: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="mb-2 h-24 w-full rounded-xl border object-cover sm:h-28"
      style={{ borderColor: mix(accent, 20) }}
    />
  );
}

function Chip({ accent, active = false, onClick, disabled = false, title, children }: {
  accent: string; active?: boolean; onClick: () => void; disabled?: boolean; title?: string; children: ReactNode;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title} aria-pressed={active}
      className={`focus-glow min-h-[32px] rounded-full border px-2.5 py-1 text-[10.5px] leading-tight transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${active ? "" : "text-muted-foreground hover:text-foreground"}`}
      style={{
        borderColor: active ? mix(accent, 60) : mix(accent, 22),
        background: active ? mix(accent, 16) : "transparent",
        color: active ? accent : undefined,
      }}
    >
      {children}
    </button>
  );
}

function LabButton({ accent, onClick, disabled = false, children }: {
  accent: string; onClick: () => void; disabled?: boolean; children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="mono-label focus-glow min-h-[32px] rounded-xl border px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition-colors duration-300 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
      style={{ borderColor: mix(accent, 45), background: mix(accent, 12), color: accent }}>
      {children}
    </button>
  );
}

function GhostAsk({ accent, onClick, disabled = false, children }: {
  accent: string; onClick: () => void; disabled?: boolean; children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="focus-glow min-h-[32px] rounded-lg px-1 py-1 text-left text-[11px] text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      style={{ textDecorationColor: mix(accent, 55) }}>
      {children}
    </button>
  );
}

function HonestLine({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[10.5px] italic leading-snug text-muted-foreground/80">{children}</p>;
}

function ReadRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="mono-label text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">{label}</span>
      <span className="text-[11.5px] tabular-nums text-foreground/90" style={accent ? { color: mix(accent, 85) } : undefined}>
        {value}
      </span>
    </div>
  );
}

/* ═══ QUANTUM — the Mach–Zehnder interferometer ═══════════════════════
   THE REAL EXPERIMENT: one photon, two paths, one phase shifter. The
   first beam splitter splits the amplitude; the phase plate delays one
   path by φ; the second beam splitter recombines. The detectors' law
   is the interference itself: P(D0) = cos²(φ/2), P(D1) = sin²(φ/2).
   Every photon drawn is sampled from exactly that distribution. */

function InterferometerBench({ accent, disabled, onSample, onAsk, counts, reset }: {
  accent: string; disabled: boolean;
  onSample: (p0: number) => 0 | 1; onAsk: (question: string) => void;
  counts: { d0: number; d1: number }; reset: () => void;
}) {
  const t = useT();
  const [phaseDeg, setPhaseDeg] = useState(90);
  const [flash, setFlash] = useState<0 | 1 | null>(null);
  const flashTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    []
  );

  const phaseRad = (phaseDeg * Math.PI) / 180;
  const p0 = Math.cos(phaseRad / 2) ** 2;
  const p1 = 1 - p0;

  const sendPhoton = () => {
    const outcome = onSample(p0);
    setFlash(outcome);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 600);
  };

  const total = counts.d0 + counts.d1;
  const seenP0 = total > 0 ? counts.d0 / total : null;

  /* the optical layout — source, two splitters, two mirrors, one phase
     plate, two detectors; the visitor's own phase written on the plate */
  const detectorGlow = (d: 0 | 1): string =>
    flash === d ? mix(accent, 85) : mix(accent, 18);

  return (
    <div>
      <svg viewBox="0 0 320 96" className="h-[96px] w-full rounded-xl border" style={{ borderColor: mix(accent, 18), background: "rgba(0,0,0,0.35)" }} role="img" aria-label={t("Mach–Zehnder interferometer diagram")}>
        {/* source */}
        <circle cx="14" cy="48" r="5" fill={mix(accent, 70)} />
        {/* beam: source → BS1 */}
        <line x1="19" y1="48" x2="86" y2="48" stroke={mix(accent, 45)} strokeWidth="1.2" />
        {/* BS1 */}
        <rect x="82" y="44" width="8" height="8" fill={mix(accent, 40)} transform="rotate(45 86 48)" />
        {/* upper path → phase plate → BS2 */}
        <line x1="86" y1="48" x2="86" y2="16" stroke={mix(accent, 45)} strokeWidth="1.2" />
        <line x1="86" y1="16" x2="234" y2="16" stroke={mix(accent, 45)} strokeWidth="1.2" />
        <rect x="152" y="12" width="14" height="8" rx="1.5" fill={mix(accent, 55)} />
        <text x="159" y="9" textAnchor="middle" fontSize="6.5" fill={mix(accent, 90)}>φ = {phaseDeg}°</text>
        <line x1="234" y1="16" x2="234" y2="48" stroke={mix(accent, 45)} strokeWidth="1.2" />
        {/* lower path → mirror → BS2 */}
        <line x1="86" y1="48" x2="86" y2="80" stroke={mix(accent, 45)} strokeWidth="1.2" />
        <line x1="86" y1="80" x2="234" y2="80" stroke={mix(accent, 45)} strokeWidth="1.2" />
        <line x1="234" y1="80" x2="234" y2="48" stroke={mix(accent, 45)} strokeWidth="1.2" />
        {/* mirrors */}
        <rect x="82" y="12" width="8" height="8" fill={mix(accent, 30)} transform="rotate(45 86 16)" />
        <rect x="82" y="76" width="8" height="8" fill={mix(accent, 30)} transform="rotate(45 86 80)" />
        <rect x="230" y="76" width="8" height="8" fill={mix(accent, 30)} transform="rotate(45 234 80)" />
        {/* BS2 */}
        <rect x="230" y="44" width="8" height="8" fill={mix(accent, 40)} transform="rotate(45 234 48)" />
        {/* detectors */}
        <circle cx="272" cy="24" r="6" fill={detectorGlow(0)} stroke={mix(accent, 50)} />
        <text x="272" y="26.5" textAnchor="middle" fontSize="6.5" fill="#fff">D0</text>
        <circle cx="272" cy="72" r="6" fill={detectorGlow(1)} stroke={mix(accent, 50)} />
        <text x="272" y="74.5" textAnchor="middle" fontSize="6.5" fill="#fff">D1</text>
        <line x1="238" y1="46" x2="266" y2="26" stroke={mix(accent, 35)} strokeWidth="1" />
        <line x1="238" y1="50" x2="266" y2="70" stroke={mix(accent, 35)} strokeWidth="1" />
      </svg>
      <input
        type="range" min={0} max={360} step={1} value={phaseDeg} disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPhaseDeg(Number(e.target.value))}
        aria-label={t("Phase of the upper path")}
        className="focus-glow mt-2 h-8 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        style={{ accentColor: accent }}
      />
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="mono-label text-[9px] text-muted-foreground">
          {t("P(D0) = cos²(φ/2) — the law of the recombined paths")}
        </span>
        <span className="mono-label text-[9px] tabular-nums" style={{ color: mix(accent, 85) }}>
          {Math.round(p0 * 100)}% / {Math.round(p1 * 100)}%
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <LabButton accent={accent} disabled={disabled} onClick={sendPhoton}>{t("Send one photon")}</LabButton>
        <LabButton accent={accent} disabled={disabled} onClick={reset}>{t("Clear counts")}</LabButton>
        <span className="mono-label ml-auto text-[9px] text-muted-foreground/70">
          {t("D0 {d0} · D1 {d1}", { d0: counts.d0, d1: counts.d1 })}
        </span>
      </div>
      {seenP0 !== null ? (
        <p className="mono-label mt-1.5 text-[9px] text-muted-foreground/80" aria-live="polite">
          {t("Seen so far: {pct}% at D0 — watch it walk toward the law", {
            pct: Math.round(seenP0 * 100),
          })}
        </p>
      ) : null}
      {total >= 30 ? (
        <div className="mt-2">
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              onAsk(
                t("My interferometer counted {total} single photons: {pct}% arrived at D0, and the phase slider says cos²(φ/2) — why does one photon alone carry a wave?", {
                  total,
                  pct: Math.round((counts.d0 / total) * 100),
                })
              )
            }
          >
            {t("Bring the interference to the field")}
          </GhostAsk>
        </div>
      ) : null}
      <HonestLine>{t("One photon at a time — the pattern builds from single arrivals.")}</HonestLine>
    </div>
  );
}

/* ═══ QUANTUM — the Bloch state bench ═════════════════════════════════
   THE REAL STATE: |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩. The sliders
   place the state on the sphere; the projection is honest spherical
   coordinates, the amplitudes and phases are exact. */

const BLOCH_PRESETS: readonly { label: string; theta: number; phi: number }[] = [
  { label: "|0⟩", theta: 0, phi: 0 },
  { label: "|1⟩", theta: 180, phi: 0 },
  { label: "|+⟩", theta: 90, phi: 0 },
  { label: "|−⟩", theta: 90, phi: 180 },
  { label: "|i⟩", theta: 90, phi: 90 },
];

function BlochBench({ accent, disabled, onAsk }: {
  accent: string; disabled: boolean; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [theta, setTheta] = useState(90);
  const [phi, setPhi] = useState(0);
  const [collapsed, setCollapsed] = useState<string | null>(null);

  const th = (theta * Math.PI) / 180;
  const ph = (phi * Math.PI) / 180;
  const a = Math.cos(th / 2);
  const bRe = Math.sin(th / 2) * Math.cos(ph);
  const bIm = Math.sin(th / 2) * Math.sin(ph);
  const p0 = a * a;
  const p1 = 1 - p0;

  /* the honest orthographic projection — x right, up pole up, the
     equator drawn as the sphere's own ellipse */
  const r = 34;
  const cx = 52;
  const cy = 46;
  const vx = Math.sin(th) * Math.sin(ph) * r;
  const vy = -Math.cos(th) * r;
  const depth = Math.sin(th) * Math.cos(ph); // + toward the viewer

  const fmt = (n: number): string => (Math.abs(n) < 0.005 ? "0" : n.toFixed(2));

  const measure = () => {
    const outcome = Math.random() < p0 ? "0" : "1";
    setCollapsed(outcome);
    if (outcome === "0") {
      setTheta(0);
      setPhi(0);
    } else {
      setTheta(180);
      setPhi(0);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-[400px]:flex-row">
      <svg viewBox="0 0 104 96" className="h-[96px] w-[104px] shrink-0" role="img" aria-label={t("The state on the Bloch sphere")}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={mix(accent, 30)} />
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.32} fill="none" stroke={mix(accent, 22)} strokeDasharray="3 3" />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={mix(accent, 18)} />
        <text x={cx} y={cy - r - 3} textAnchor="middle" fontSize="7" fill={mix(accent, 85)}>|0⟩</text>
        <text x={cx} y={cy + r + 8} textAnchor="middle" fontSize="7" fill={mix(accent, 85)}>|1⟩</text>
        {/* the state vector — brighter when facing the viewer */}
        <line x1={cx} y1={cy} x2={cx + vx} y2={cy + vy} stroke={accent} strokeWidth="1.6" opacity={0.75 + 0.25 * (depth + 1) / 2} />
        <circle cx={cx + vx} cy={cy + vy} r="2.6" fill={accent} />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {BLOCH_PRESETS.map((p) => (
            <Chip key={p.label} accent={accent} disabled={disabled}
              active={Math.round(theta) === p.theta && Math.round(phi) === p.phi}
              onClick={() => { setTheta(p.theta); setPhi(p.phi); setCollapsed(null); }}>
              {t(p.label)}
            </Chip>
          ))}
        </div>
        <label className="mono-label mt-1.5 block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          θ {theta}°
        </label>
        <input type="range" min={0} max={180} step={1} value={theta} disabled={disabled}
          onChange={(e) => { setTheta(Number(e.target.value)); setCollapsed(null); }}
          aria-label={t("Polar angle θ")}
          className="focus-glow h-6 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          style={{ accentColor: accent }} />
        <label className="mono-label block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          φ {phi}°
        </label>
        <input type="range" min={0} max={360} step={1} value={phi} disabled={disabled}
          onChange={(e) => { setPhi(Number(e.target.value)); setCollapsed(null); }}
          aria-label={t("Azimuthal phase φ")}
          className="focus-glow h-6 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          style={{ accentColor: accent }} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <ReadRow label={t("α (a|0⟩)")} value={`${fmt(a)}${bIm === 0 && a === 1 ? "" : ""}`} accent={accent} />
        <ReadRow label={t("β (b|1⟩)")} value={`${fmt(bRe)} ${bIm < 0 ? "−" : "+"} ${fmt(Math.abs(bIm))}i`} accent={accent} />
        <ReadRow label={t("P(|0⟩)")} value={`${Math.round(p0 * 100)}%`} />
        <ReadRow label={t("P(|1⟩)")} value={`${Math.round(p1 * 100)}%`} />
        <div className="pt-1">
          <LabButton accent={accent} disabled={disabled} onClick={measure}>{t("Measure")}</LabButton>
        </div>
        {collapsed ? (
          <p className="mono-label text-[9.5px]" style={{ color: mix(accent, 85) }} aria-live="polite">
            {t("Collapsed to |{o}⟩", { o: collapsed })}
          </p>
        ) : null}
      </div>
      <div className="min-[400px]:w-full">
        <GhostAsk
          accent={accent} disabled={disabled}
          onClick={() =>
            onAsk(
              t("I placed a qubit at θ = {theta}°, φ = {phi}° on the Bloch sphere — what does this state quietly prepare?", {
                theta,
                phi,
              })
            )
          }
        >
          {t("Ask the field about this state")}
        </GhostAsk>
      </div>
    </div>
  );
}

/* ═══ QUANTUM — the QRNG bench ════════════════════════════════════════
   THE REAL SOURCE: the device's own entropy pool (crypto.getRandomValues)
   read honestly; bits pass a von Neumann pairing sweep so a biased coin
   still lands honest. A true random source for decisions, shuffles and
   draws — the instrument names its own limits (not key-grade secrecy). */

type QrngMode = "coin" | "dice" | "bits" | "pick";

function deviceBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** the von Neumann sweep — pairs of raw bits map to one honest bit:
    01 → 0, 10 → 1, equal pairs are discarded (bias falls away) */
function debiasedBits(count: number): number[] {
  const out: number[] = [];
  while (out.length < count) {
    const bytes = deviceBytes(Math.max(16, count));
    for (let i = 0; i < bytes.length && out.length < count * 4; i += 1) {
      for (let bit = 0; bit < 8 && out.length < count * 4; bit += 2) {
        const b1 = (bytes[i] >> (7 - bit)) & 1;
        const b2 = (bytes[i] >> (6 - bit)) & 1;
        if (b1 !== b2) out.push(b1);
      }
    }
  }
  return out.slice(0, count);
}

function QrngBench({ accent, disabled, onAsk }: {
  accent: string; disabled: boolean; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<QrngMode>("coin");
  const [coin, setCoin] = useState<0 | 1 | null>(null);
  const [die, setDie] = useState<number | null>(null);
  const [hex, setHex] = useState<string>("");
  const [pickList, setPickList] = useState<string>("tea\nwalk\nstars\nsilence");
  const [picked, setPicked] = useState<string | null>(null);
  const [drawn, setDrawn] = useState(0);

  const drawCoin = () => {
    const bits = debiasedBits(1);
    setCoin(bits[0] === 1 ? 1 : 0);
    setDrawn((n) => n + 2);
  };
  const drawDie = () => {
    /* rejection sampling — 0..255 mod 6 bias is refused, honest faces only */
    const bytes = deviceBytes(1);
    let v = bytes[0];
    while (v >= 252) {
      v = deviceBytes(1)[0];
      setDrawn((n) => n + 1);
    }
    setDie((v % 6) + 1);
    setDrawn((n) => n + 1);
  };
  const drawHex = () => {
    const bytes = deviceBytes(16);
    setHex(
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ")
        .replace(/(.{11}) /g, "$1\n  ")
    );
    setDrawn((n) => n + 16);
  };
  const drawPick = () => {
    const lines = pickList.split("\n").map((s) => s.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const bytes = deviceBytes(2);
    const v = (bytes[0] << 8) | bytes[1];
    setPicked(lines[v % lines.length]);
    setDrawn((n) => n + 2);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Chip accent={accent} active={mode === "coin"} disabled={disabled} onClick={() => setMode("coin")}>{t("Coin")}</Chip>
        <Chip accent={accent} active={mode === "dice"} disabled={disabled} onClick={() => setMode("dice")}>{t("Die")}</Chip>
        <Chip accent={accent} active={mode === "bits"} disabled={disabled} onClick={() => setMode("bits")}>{t("Raw bits")}</Chip>
        <Chip accent={accent} active={mode === "pick"} disabled={disabled} onClick={() => setMode("pick")}>{t("Choose for me")}</Chip>
      </div>
      <div className="mt-2 min-h-[64px] rounded-xl border p-2.5" style={{ borderColor: mix(accent, 18) }}>
        {mode === "coin" ? (
          <div className="flex h-full items-center gap-3">
            <p className="font-serif text-[22px] leading-none" style={{ color: mix(accent, 90) }} aria-live="polite">
              {coin === null ? "—" : coin === 0 ? t("Heads") : t("Tails")}
            </p>
            <span className="mono-label text-[8.5px] text-muted-foreground/60">1 honest bit</span>
          </div>
        ) : null}
        {mode === "dice" ? (
          <div className="flex h-full items-center gap-3">
            <p className="font-serif text-[22px] leading-none" style={{ color: mix(accent, 90) }} aria-live="polite">
              {die === null ? "—" : die}
            </p>
            <span className="mono-label text-[8.5px] text-muted-foreground/60">rejection-sampled · uniform</span>
          </div>
        ) : null}
        {mode === "bits" ? (
          <pre className="mono-label overflow-x-auto text-[10px] leading-relaxed text-foreground/85" aria-live="polite">
            {hex || t("— draw —")}
          </pre>
        ) : null}
        {mode === "pick" ? (
          <div>
            <textarea
              value={pickList}
              onChange={(e) => setPickList(e.target.value)}
              rows={3}
              disabled={disabled}
              aria-label={t("One option per line")}
              className="focus-glow w-full resize-none rounded-lg border bg-transparent p-2 text-[11px] text-foreground placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: mix(accent, 22) }}
            />
            {picked ? (
              <p className="mt-1.5 font-serif text-[13px]" style={{ color: mix(accent, 90) }} aria-live="polite">
                {t("The source chose:")} <span className="font-medium">{picked}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <LabButton accent={accent} disabled={disabled}
          onClick={() => (mode === "coin" ? drawCoin() : mode === "dice" ? drawDie() : mode === "bits" ? drawHex() : drawPick())}>
          {t("Draw")}
        </LabButton>
        <span className="mono-label ml-auto flex items-center gap-1 text-[9px] text-muted-foreground/70">
          <Binary className="size-3" aria-hidden="true" />
          {t("{n} bits drawn", { n: drawn })}
        </span>
      </div>
      {mode === "pick" && pickList.split("\n").filter((s) => s.trim()).length < 2 ? (
        <p className="mt-1.5 text-[10px] text-muted-foreground">{t("Give the source at least two lines to choose between.")}</p>
      ) : null}
      {coin !== null || die !== null || hex || picked ? (
        <div className="mt-2">
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              onAsk(
                t("I asked the quantum source for an honest draw and it answered \"{answer}\" — what walks beside a chance that no one, not even the device, knew in advance?", {
                  answer: mode === "coin" ? (coin === 0 ? t("Heads") : t("Tails")) : mode === "dice" ? String(die ?? "") : mode === "pick" ? (picked ?? "") : "raw bits",
                })
              )
            }
          >
            {t("Bring the draw to the field")}
          </GhostAsk>
        </div>
      ) : null}
      <HonestLine>{t("Device entropy, debiased — honest for decisions, not for keys.")}</HonestLine>
    </div>
  );
}

/* ═══ HEALX — the coherence oscillator ════════════════════════════════
   THE REAL SOUND: two true sine oscillators, one into each ear, a few
   hertz apart — the beat lives in the listener's own perception. Real
   WebAudio nodes, real panning, a real session timer with a gentle
   fade at the end. */

interface OscPreset { key: string; label: string; carrier: number; beat: number; note: string }

const OSC_PRESETS: readonly OscPreset[] = [
  { key: "delta", label: "Delta Rest", carrier: 140, beat: 2, note: "the slow tide of deep sleep" },
  { key: "theta", label: "Theta Drift", carrier: 160, beat: 6, note: "the drift where meditation lives" },
  { key: "alpha", label: "Alpha Calm", carrier: 180, beat: 10, note: "the quiet hum of a settled mind" },
  { key: "beta", label: "Beta Bright", carrier: 200, beat: 16, note: "the bright edge of focus" },
];

const OSC_SESSIONS = [5, 10, 20] as const;

function CoherenceOscillator({ accent, disabled, onSession }: {
  accent: string; disabled: boolean; onSession: () => void;
}) {
  const t = useT();
  const [presetIdx, setPresetIdx] = useState(2);
  const [minutes, setMinutes] = useState<number>(10);
  const [volume, setVolume] = useState(30);
  const [running, setRunning] = useState(false);
  const [remainingS, setRemainingS] = useState<number | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; nodes: AudioNode[]; oscs: OscillatorNode[]; gain: GainNode } | null>(null);
  const fadeRef = useRef<number | null>(null);
  const sessionDoneRef = useRef(false);

  const stopAudio = useCallback((fadeMs = 400) => {
    const audio = audioRef.current;
    if (!audio) return;
    audioRef.current = null;
    try {
      const now = audio.ctx.currentTime;
      audio.gain.gain.cancelScheduledValues(now);
      audio.gain.gain.setValueAtTime(audio.gain.gain.value, now);
      audio.gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
      for (const o of audio.oscs) o.stop(now + fadeMs / 1000 + 0.05);
      window.setTimeout(() => {
        for (const n of audio.nodes) {
          try { n.disconnect(); } catch { /* already quiet */ }
        }
        void audio.ctx.close().catch(() => undefined);
      }, fadeMs + 120);
    } catch {
      /* the sound had already gone */
    }
  }, []);

  useEffect(
    () => () => {
      if (fadeRef.current !== null) window.clearInterval(fadeRef.current);
      stopAudio(0);
    },
    [stopAudio]
  );

  const start = () => {
    const preset = OSC_PRESETS[presetIdx];
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(ctx.destination);
    const nodes: AudioNode[] = [gain];
    const oscs: OscillatorNode[] = [];
    for (const [i, f] of [preset.carrier, preset.carrier + preset.beat].entries()) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const pan = ctx.createStereoPanner();
      pan.pan.value = i === 0 ? -1 : 1;
      osc.connect(pan);
      pan.connect(gain);
      osc.start();
      oscs.push(osc);
      nodes.push(pan);
    }
    const now = ctx.currentTime;
    gain.gain.linearRampToValueAtTime(volume / 100 * 0.5, now + 1.2);
    audioRef.current = { ctx, nodes, oscs, gain };
    setRunning(true);
    sessionDoneRef.current = false;
    setRemainingS(minutes * 60);
    if (fadeRef.current !== null) window.clearInterval(fadeRef.current);
    fadeRef.current = window.setInterval(() => {
      setRemainingS((s) => {
        if (s === null) return null;
        if (s <= 1) {
          if (!sessionDoneRef.current) {
            sessionDoneRef.current = true;
            setRunning(false);
            stopAudio(1500);
            onSession();
          }
          if (fadeRef.current !== null) window.clearInterval(fadeRef.current);
          fadeRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stop = () => {
    setRunning(false);
    setRemainingS(null);
    if (fadeRef.current !== null) window.clearInterval(fadeRef.current);
    fadeRef.current = null;
    stopAudio(400);
  };

  const preset = OSC_PRESETS[presetIdx];
  const mm = remainingS !== null ? String(Math.floor(remainingS / 60)).padStart(2, "0") : "--";
  const ss = remainingS !== null ? String(remainingS % 60).padStart(2, "0") : "--";

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {OSC_PRESETS.map((p, i) => (
          <Chip key={p.key} accent={accent} disabled={disabled || running}
            active={presetIdx === i}
            onClick={() => setPresetIdx(i)} title={t(p.note)}>
            {t(p.label)} · {p.beat} {t("Hz")}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-xl border p-2.5" style={{ borderColor: mix(accent, 18) }}>
        <span
          aria-hidden="true"
          className={`size-2.5 shrink-0 rounded-full ${running ? "motion-safe:animate-pulse" : ""}`}
          style={{ background: running ? accent : mix(accent, 25) }}
        />
        <div className="min-w-0 flex-1">
          <p className="mono-label text-[9px] uppercase tracking-[0.16em] text-muted-foreground" aria-live="polite">
            {running
              ? t("L {l} Hz · R {r} Hz — the beat is {b} Hz", {
                  l: preset.carrier.toFixed(1),
                  r: (preset.carrier + preset.beat).toFixed(1),
                  b: preset.beat,
                })
              : t("Two ears, two tones, one beat between them")}
          </p>
          {running ? (
            <p className="mono-label mt-0.5 text-[9px] tabular-nums text-muted-foreground/70">
              {t("{mm}:{ss} remaining", { mm, ss })}
            </p>
          ) : null}
        </div>
      </div>
      <label className="mono-label mt-2 block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {t("Volume {v}%", { v: volume })}
      </label>
      <input type="range" min={0} max={70} step={1} value={volume} disabled={disabled || running}
        onChange={(e) => setVolume(Number(e.target.value))} aria-label={t("Volume")}
        className="focus-glow h-7 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        style={{ accentColor: accent }} />
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {OSC_SESSIONS.map((m) => (
          <Chip key={m} accent={accent} disabled={disabled || running} active={minutes === m}
            onClick={() => setMinutes(m)}>{m} {t("min")}</Chip>
        ))}
        <span className="min-w-2 flex-1" />
        {running ? (
          <LabButton accent={accent} onClick={stop}>{t("Stop")}</LabButton>
        ) : (
          <LabButton accent={accent} disabled={disabled} onClick={start}>{t("Begin the session")}</LabButton>
        )}
      </div>
      <HonestLine>{t("Headphones make the beat — speakers carry both tones to both ears.")}</HonestLine>
    </div>
  );
}

/* ═══ HEALX — the day-log correlator ══════════════════════════════════
   THE REAL STATISTICS: the visitor's own days, Pearson's own r. Sleep
   against strain, stress against strain — computed on the device, read
   honestly (a whisper of a thread is named a whisper). */

interface DayEntry { d: string; sleep: number; stress: number; strain: number }

const DAYLOG_KEY = "mirror:healx-daylog:v1";

function readDayLog(): DayEntry[] {
  try {
    const raw = window.localStorage.getItem(DAYLOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DayEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e) =>
          typeof e?.d === "string" &&
          typeof e?.sleep === "number" &&
          typeof e?.stress === "number" &&
          typeof e?.strain === "number"
      )
      .slice(-30);
  } catch {
    return [];
  }
}

function writeDayLog(entries: DayEntry[]): void {
  try {
    window.localStorage.setItem(DAYLOG_KEY, JSON.stringify(entries.slice(-30)));
  } catch {
    /* the log forgives */
  }
}

/** Pearson's r — the honest linear thread between two days' columns */
function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx <= 1e-9 || syy <= 1e-9) return null;
  return Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
}

function CorrelationBar({ label, r, accent }: { label: string; r: number | null; accent: string }) {
  const t = useT();
  const shown = r ?? 0;
  const width = Math.abs(shown) * 50; // half-bar per side
  const reading =
    r === null
      ? t("keep logging — three days give the threads their first shape")
      : Math.abs(r) >= 0.5
        ? t("a clear thread")
        : Math.abs(r) >= 0.3
          ? t("a whisper of a thread")
          : t("no clear thread yet");
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="mono-label text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">{label}</span>
        <span className="text-[11px] tabular-nums" style={{ color: mix(accent, 85) }}>
          {r === null ? "—" : `r = ${r >= 0 ? "+" : "−"}${Math.abs(r).toFixed(2)}`}
        </span>
      </div>
      <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-foreground/25" />
        <span
          className="absolute top-0 h-full rounded-full transition-[width,left] duration-500 motion-reduce:transition-none"
          style={{
            width: `${width}%`,
            left: shown >= 0 ? "50%" : `${50 - width}%`,
            background: accent,
          }}
        />
      </div>
      <p className="mt-0.5 text-[10px] italic text-muted-foreground/75">{reading}</p>
    </div>
  );
}

function DayLogCorrelator({ accent, disabled, onAsk }: {
  accent: string; disabled: boolean; onAsk: (question: string) => void;
}) {
  const t = useT();
  /* the log is read once, lazily — the lab travels client-only
     (the deck is ssr:false), so the device's own shelf is safe to
     open in the first render; no effect ever replays it */
  const [entries, setEntries] = useState<DayEntry[]>(() => readDayLog());
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(3);
  const [strain, setStrain] = useState(2);
  const [logged, setLogged] = useState(false);

  const logDay = () => {
    const today = new Date().toISOString().slice(0, 10);
    const next = [...entries.filter((e) => e.d !== today), { d: today, sleep, stress, strain }].slice(-30);
    setEntries(next);
    writeDayLog(next);
    setLogged(true);
    window.setTimeout(() => setLogged(false), 2400);
  };

  const clearLog = () => {
    setEntries([]);
    writeDayLog([]);
  };

  const rSleep = pearson(entries.map((e) => e.sleep), entries.map((e) => e.strain));
  const rStress = pearson(entries.map((e) => e.stress), entries.map((e) => e.strain));
  const enough = entries.length >= 5;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mono-label block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {t("Sleep {h} h", { h: sleep })}
          </label>
          <input type="range" min={3} max={12} step={0.5} value={sleep} disabled={disabled}
            onChange={(e) => setSleep(Number(e.target.value))} aria-label={t("Hours of sleep")}
            className="focus-glow h-7 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            style={{ accentColor: accent }} />
        </div>
        <div>
          <label className="mono-label block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {t("Stress {v}/5", { v: stress })}
          </label>
          <input type="range" min={1} max={5} step={1} value={stress} disabled={disabled}
            onChange={(e) => setStress(Number(e.target.value))} aria-label={t("Stress of the day")}
            className="focus-glow h-7 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            style={{ accentColor: accent }} />
        </div>
        <div>
          <label className="mono-label block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {t("Strain {v}/5", { v: strain })}
          </label>
          <input type="range" min={1} max={5} step={1} value={strain} disabled={disabled}
            onChange={(e) => setStrain(Number(e.target.value))} aria-label={t("Symptom load of the day")}
            className="focus-glow h-7 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            style={{ accentColor: accent }} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <LabButton accent={accent} disabled={disabled} onClick={logDay}>{t("Log this day")}</LabButton>
        {entries.length > 0 ? (
          <button type="button" onClick={clearLog} disabled={disabled}
            className="focus-glow flex min-h-[32px] items-center gap-1 rounded-xl px-2 text-[10.5px] text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
            <Eraser className="size-3" aria-hidden="true" />
            {t("Clear")}
          </button>
        ) : null}
        <span className="mono-label ml-auto text-[9px] text-muted-foreground/70">
          {t("{n} days kept", { n: entries.length })}
        </span>
      </div>
      <p
        className={`text-[10px] italic text-muted-foreground transition-opacity duration-700 motion-reduce:transition-none ${logged ? "opacity-100" : "opacity-0"}`}
        aria-live="polite">
        {t("The day is written.")}
      </p>
      <div className="mt-1.5 space-y-2.5 rounded-xl border p-2.5" style={{ borderColor: mix(accent, 18) }}>
        <CorrelationBar label={t("Sleep → strain")} r={enough ? rSleep : null} accent={accent} />
        <CorrelationBar label={t("Stress → strain")} r={enough ? rStress : null} accent={accent} />
      </div>
      {entries.length > 0 ? (
        <div className="mt-2">
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              onAsk(
                t("My day log holds {n} days: sleep-to-strain r = {rs}, stress-to-strain r = {rt} — read the pattern of my days gently.", {
                  n: entries.length,
                  rs: rSleep === null ? "—" : rSleep.toFixed(2),
                  rt: rStress === null ? "—" : rStress.toFixed(2),
                })
              )
            }
          >
            {t("Bring the pattern to the field")}
          </GhostAsk>
        </div>
      ) : null}
      <HonestLine>{t("Correlation is a thread, never a cause — kept on this device only.")}</HonestLine>
    </div>
  );
}

/* ═══ HEALX — the body heatmap ════════════════════════════════════════
   THE REAL MAP: the visitor's own body, today's own load. Eight zones
   drawn as the body's own silhouette; a tap cycles rest → warm → hot →
   burning; the day is kept on the device and the heat fades with it. */

interface BodyZone { key: string; label: string; shape: "circle" | "torso" | "arm-l" | "arm-r" | "leg-l" | "leg-r" }

const BODY_ZONES: readonly BodyZone[] = [
  { key: "head", label: "Head", shape: "circle" },
  { key: "chest", label: "Chest", shape: "torso" },
  { key: "belly", label: "Belly", shape: "torso" },
  { key: "arm-l", label: "Left arm", shape: "arm-l" },
  { key: "arm-r", label: "Right arm", shape: "arm-r" },
  { key: "leg-l", label: "Left leg", shape: "leg-l" },
  { key: "leg-r", label: "Right leg", shape: "leg-r" },
];

const HEAT_DAYS_KEY = "mirror:healx-bodymap:v1";

interface BodyMapLog { [date: string]: { [zone: string]: number } }

function readBodyMap(): BodyMapLog {
  try {
    const raw = window.localStorage.getItem(HEAT_DAYS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BodyMapLog;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** heat color — 0 rests, 1 warms, 2 burns, 3 burns bright */
function heatFill(level: number, accent: string): string {
  if (level <= 0) return "transparent";
  if (level === 1) return mix(accent, 22);
  if (level === 2) return "color-mix(in srgb, #f59e0b 42%, transparent)";
  return "color-mix(in srgb, #ef4444 55%, transparent)";
}

function BodyHeatmap({ accent, disabled, onAsk }: {
  accent: string; disabled: boolean; onAsk: (question: string) => void;
}) {
  const t = useT();
  /* today's map is read once, lazily — the lab travels client-only
     (the deck is ssr:false), so the device's own shelf is safe to
     open in the first render; no effect ever replays it */
  const [dateKey, setDateKey] = useState(() => new Date().toISOString().slice(0, 10));
  const [zones, setZones] = useState<Record<string, number>>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const log = readBodyMap();
    return log[today] ?? {};
  });

  const persist = (next: Record<string, number>) => {
    if (!dateKey) return;
    const log = readBodyMap();
    /* keep the last seven days — the map fades with the week */
    const days = Object.keys(log).sort().slice(-6);
    const kept: BodyMapLog = {};
    for (const d of days) kept[d] = log[d];
    if (Object.keys(next).length > 0) kept[dateKey] = next;
    try {
      window.localStorage.setItem(HEAT_DAYS_KEY, JSON.stringify(kept));
    } catch {
      /* the log forgives */
    }
  };

  const cycle = (key: string) => {
    setZones((z) => {
      const next = { ...z, [key]: ((z[key] ?? 0) + 1) % 4 };
      if (next[key] === 0) delete next[key];
      persist(next);
      return next;
    });
  };

  const clearToday = () => {
    setZones({});
    persist({});
  };

  const hot = BODY_ZONES.filter((z) => (zones[z.key] ?? 0) >= 2);
  const warm = BODY_ZONES.filter((z) => (zones[z.key] ?? 0) === 1);

  return (
    <div className="flex gap-3">
      <svg viewBox="0 0 72 150" className="h-[150px] w-[72px] shrink-0" role="img" aria-label={t("Today's body map — tap a zone to mark its load")}>
        {/* the silhouette's own outline */}
        <g stroke={mix(accent, 30)} strokeWidth="1" fill="none">
          <circle cx="36" cy="16" r="10" fill={heatFill(zones.head ?? 0, accent)} className="cursor-pointer" onClick={() => !disabled && cycle("head")} />
          <rect x="24" y="30" width="24" height="40" rx="9" fill="transparent" />
          <rect x="27" y="30" width="18" height="22" rx="6" fill={heatFill(zones.chest ?? 0, accent)} className="cursor-pointer" onClick={() => !disabled && cycle("chest")} />
          <rect x="27" y="52" width="18" height="18" rx="6" fill={heatFill(zones.belly ?? 0, accent)} className="cursor-pointer" onClick={() => !disabled && cycle("belly")} />
          <rect x="14" y="32" width="8" height="34" rx="4" fill={heatFill(zones["arm-l"] ?? 0, accent)} className="cursor-pointer" onClick={() => !disabled && cycle("arm-l")} />
          <rect x="50" y="32" width="8" height="34" rx="4" fill={heatFill(zones["arm-r"] ?? 0, accent)} className="cursor-pointer" onClick={() => !disabled && cycle("arm-r")} />
          <rect x="26" y="72" width="8" height="62" rx="4" fill={heatFill(zones["leg-l"] ?? 0, accent)} className="cursor-pointer" onClick={() => !disabled && cycle("leg-l")} />
          <rect x="38" y="72" width="8" height="62" rx="4" fill={heatFill(zones["leg-r"] ?? 0, accent)} className="cursor-pointer" onClick={() => !disabled && cycle("leg-r")} />
        </g>
      </svg>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1.5">
          {BODY_ZONES.map((z) => {
            const level = zones[z.key] ?? 0;
            return (
              <Chip key={z.key} accent={accent} disabled={disabled} active={level > 0}
                onClick={() => cycle(z.key)}
                title={t("Tap to cycle the load")}>
                {t(z.label)}{level > 0 ? ` · ${level}` : ""}
              </Chip>
            );
          })}
        </div>
        <p className="mono-label mt-2 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
          {t("rest → warm → hot → burning")}
        </p>
        {hot.length > 0 || warm.length > 0 ? (
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground" aria-live="polite">
            {hot.length > 0
              ? t("{zones} ask for care first", { zones: hot.map((z) => t(z.label)).join(", ") })
              : t("Only a quiet warmth remains — {zones}", { zones: warm.map((z) => t(z.label)).join(", ") })}
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
            {t("A resting body — nothing glows today.")}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {Object.keys(zones).length > 0 ? (
            <LabButton accent={accent} disabled={disabled} onClick={clearToday}>{t("Clear today")}</LabButton>
          ) : null}
        </div>
        {Object.keys(zones).length > 0 ? (
          <div className="mt-1">
            <GhostAsk
              accent={accent} disabled={disabled}
              onClick={() =>
                onAsk(
                  t("Today's body map glows at {zones} — where should gentleness begin?", {
                    zones: [...hot, ...warm].map((z) => t(z.label).toLowerCase()).join(", "),
                  })
                )
              }
            >
              {t("Bring today's map to the field")}
            </GhostAsk>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ═══ INTERPLANETARY — the Δv mission planner ═════════════════════════
   THE REAL EQUATION: Tsiolkovsky's own rocket equation, Δv = Isp·g₀·
   ln(m₀/m₁), fed with real route budgets (LEO, the Moon, Mars) and
   real engine vacuüm impulses (kerolox, hydrolox, NERVA, ion). */

interface DvRoute { key: string; label: string; dv: number; note: string }
interface DvEngine { key: string; label: string; isp: number }

const DV_ROUTES: readonly DvRoute[] = [
  { key: "le2lo", label: "Earth surface → low orbit", dv: 9.4, note: "the price of the atmosphere and gravity" },
  { key: "lo2moon", label: "Low orbit → Moon landing", dv: 6.0, note: "3.2 transfer + 0.9 orbit + 1.9 descent" },
  { key: "lo2mars", label: "Low orbit → Mars orbit", dv: 5.6, note: "3.6 transfer + 2.0 capture" },
  { key: "lo2marsland", label: "Low orbit → Mars landing", dv: 6.6, note: "transfer + capture + 1.0 descent (with aerobraking help)" },
];

const DV_ENGINES: readonly DvEngine[] = [
  { key: "kerolox", label: "Kerolox stage", isp: 320 },
  { key: "hydrolox", label: "Hydrolox stage", isp: 450 },
  { key: "ntr", label: "Nuclear thermal (NERVA)", isp: 850 },
  { key: "ion", label: "Ion drive", isp: 3100 },
];

const G0 = 9.80665;

function DeltaVPlanner({ accent, disabled, onAsk }: {
  accent: string; disabled: boolean; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [routeIdx, setRouteIdx] = useState(1);
  const [engineIdx, setEngineIdx] = useState(0);
  const [payloadT, setPayloadT] = useState(1);
  const [computed, setComputed] = useState<{ routeIdx: number; engineIdx: number; payloadT: number } | null>(null);

  const route = DV_ROUTES[routeIdx];
  const engine = DV_ENGINES[engineIdx];

  const shown = computed
    ? (() => {
        const r = DV_ROUTES[computed.routeIdx];
        const e = DV_ENGINES[computed.engineIdx];
        const ratio = Math.exp((r.dv * 1000) / (e.isp * G0));
        return { route: r, engine: e, ratio, propellantPerTonne: ratio - 1 };
      })()
    : null;

  const barFrac = shown ? clamp01((shown.propellantPerTonne || 0) / 20) : 0;

  return (
    <div>
      <label className="mono-label block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {t("The route")}
      </label>
      <select value={routeIdx} disabled={disabled} onChange={(e) => setRouteIdx(Number(e.target.value))}
        aria-label={t("Mission route")}
        className="focus-glow mt-1 h-8 w-full rounded-lg border bg-background px-2 text-[11.5px] text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        style={{ borderColor: mix(accent, 24) }}>
        {DV_ROUTES.map((r, i) => (
          <option key={r.key} value={i}>{t(r.label)} — {r.dv} km/s</option>
        ))}
      </select>
      <p className="mt-1 text-[10px] italic text-muted-foreground/75">{t(route.note)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {DV_ENGINES.map((e, i) => (
          <Chip key={e.key} accent={accent} disabled={disabled} active={engineIdx === i}
            onClick={() => setEngineIdx(i)} title={`Isp ${e.isp} s`}>
            {t(e.label)} · {e.isp} {t("s")}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <label className="mono-label shrink-0 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {t("Payload {n} t", { n: payloadT })}
        </label>
        <input type="range" min={1} max={40} step={1} value={payloadT} disabled={disabled}
          onChange={(e) => setPayloadT(Number(e.target.value))} aria-label={t("Payload mass in tonnes")}
          className="focus-glow h-7 min-w-0 flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          style={{ accentColor: accent }} />
      </div>
      <div className="mt-2">
        <LabButton accent={accent} disabled={disabled}
          onClick={() => setComputed({ routeIdx, engineIdx, payloadT })}>
          {t("Weigh the tanks")}
        </LabButton>
      </div>
      {shown ? (
        <div className="mt-2 space-y-1.5 rounded-xl border p-2.5" style={{ borderColor: mix(accent, 18) }} aria-live="polite">
          <ReadRow label={t("Route Δv")} value={`${shown.route.dv.toFixed(1)} km/s`} accent={accent} />
          <ReadRow label={t("Mass ratio m₀/m₁")} value={`×${shown.ratio.toFixed(2)}`} />
          <ReadRow
            label={t("Propellant per tonne delivered")}
            value={`${shown.propellantPerTonne < 1000 ? shown.propellantPerTonne.toFixed(1) : Math.round(shown.propellantPerTonne).toLocaleString("en-US")} t`}
          />
          <div className="pt-1">
            <div className="flex h-2 overflow-hidden rounded-full bg-foreground/10">
              <span style={{ width: "5%", background: mix(accent, 80) }} />
              <span
                className="transition-[width] duration-700 motion-reduce:transition-none"
                style={{ width: `${barFrac * 95}%`, background: "color-mix(in srgb, #f59e0b 60%, transparent)" }}
              />
            </div>
            <p className="mono-label mt-1 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
              {t("ship+payload · propellant")}
            </p>
          </div>
        </div>
      ) : null}
      {shown ? (
        <div className="mt-2">
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              onAsk(
                t("The rocket equation asks ×{ratio} of my ship's mass in propellant for a {dv} km/s crossing on a {engine} — what does such a mass budget truly mean for the voyage?", {
                  ratio: shown.ratio.toFixed(1),
                  dv: shown.route.dv.toFixed(1),
                  engine: t(shown.engine.label),
                })
              )
            }
          >
            {t("Bring the mass budget to the field")}
          </GhostAsk>
        </div>
      ) : null}
      <HonestLine>{t("Impulsive Δv, no losses — real missions carry margin.")}</HonestLine>
    </div>
  );
}

/* ═══ INTERPLANETARY — the light-time gauge ═══════════════════════════
   THE REAL SKY: a circular-orbit ephemeris with each planet's true mean
   distance and true sidereal period, seeded with its real mean longitude
   at J2000. The one-way delay is c's own law: 499.005 seconds per AU. */

interface PlanetEphem { key: string; name: string; a: number; periodDays: number; l0: number }

const PLANET_EPHEM: readonly PlanetEphem[] = [
  { key: "mercury", name: "Mercury", a: 0.387, periodDays: 87.97, l0: 252.25 },
  { key: "venus", name: "Venus", a: 0.723, periodDays: 224.7, l0: 181.98 },
  { key: "mars", name: "Mars", a: 1.524, periodDays: 686.98, l0: 355.45 },
  { key: "jupiter", name: "Jupiter", a: 5.203, periodDays: 4332.59, l0: 34.35 },
  { key: "saturn", name: "Saturn", a: 9.537, periodDays: 10759.22, l0: 50.08 },
];

const EARTH_EPHEM: PlanetEphem = { key: "earth", name: "Earth", a: 1.0, periodDays: 365.256, l0: 100.46 };

const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const AU_LIGHT_SECONDS = 499.005;

/** the circular-orbit position angle (degrees) days from J2000 */
function longitudeAt(p: PlanetEphem, days: number): number {
  return p.l0 + (360 * days) / p.periodDays;
}

function distanceAu(p: PlanetEphem, days: number): number {
  const le = (longitudeAt(EARTH_EPHEM, days) * Math.PI) / 180;
  const lp = (longitudeAt(p, days) * Math.PI) / 180;
  const dx = p.a * Math.cos(lp) - EARTH_EPHEM.a * Math.cos(le);
  const dy = p.a * Math.sin(lp) - EARTH_EPHEM.a * Math.sin(le);
  return Math.sqrt(dx * dx + dy * dy);
}

function fmtDelay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h} ${"h"} ${String(m % 60).padStart(2, "0")} ${"min"}`;
  }
  return `${m} min ${String(s).padStart(2, "0")} s`;
}

function LightTimeGauge({ accent, disabled, onAsk }: {
  accent: string; disabled: boolean; onAsk: (question: string) => void;
}) {
  const t = useT();
  const mounted = useMounted();
  const [planetIdx, setPlanetIdx] = useState(2); // Mars
  const [offsetDays, setOffsetDays] = useState(0);
  const [askedAt, setAskedAt] = useState<{ planet: string; au: number; mmss: string } | null>(null);

  const daysSinceJ2000 = mounted ? (Date.now() - J2000_MS) / 86400000 : 0;
  const days = daysSinceJ2000 + offsetDays;
  const planet = PLANET_EPHEM[planetIdx];
  const au = mounted ? distanceAu(planet, days) : 0;
  const oneWay = au * AU_LIGHT_SECONDS;
  const roundTrip = oneWay * 2;

  const when =
    mounted && offsetDays !== 0
      ? new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10)
      : t("today");

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {PLANET_EPHEM.map((p, i) => (
          <Chip key={p.key} accent={accent} disabled={disabled} active={planetIdx === i}
            onClick={() => setPlanetIdx(i)}>
            {t(p.name)}
          </Chip>
        ))}
      </div>
      <label className="mono-label mt-2 block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {t("Mission day — {when}", { when })}
      </label>
      <input type="range" min={-365} max={1095} step={1} value={offsetDays} disabled={disabled}
        onChange={(e) => setOffsetDays(Number(e.target.value))} aria-label={t("Days from today")}
        className="focus-glow h-7 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        style={{ accentColor: accent }} />
      <div className="mt-1.5 space-y-1 rounded-xl border p-2.5" style={{ borderColor: mix(accent, 18) }}>
        <ReadRow label={t("Distance now")} value={mounted ? `${au.toFixed(2)} AU` : "—"} accent={accent} />
        <ReadRow label={t("One way")} value={mounted ? fmtDelay(oneWay) : "—"} />
        <ReadRow label={t("Question and answer")} value={mounted ? fmtDelay(roundTrip) : "—"} />
      </div>
      <p className="mono-label mt-1 text-[9px] text-muted-foreground/70">
        {t("light crosses one AU in 8 min 19 s — the sky's own metronome")}
      </p>
      {mounted ? (
        <div className="mt-2">
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              setAskedAt({ planet: t(planet.name), au, mmss: fmtDelay(oneWay) })
            }
          >
            {t("Hold this distance")}
          </GhostAsk>
          {askedAt ? (
            <GhostAsk
              accent={accent} disabled={disabled}
              onClick={() => {
                onAsk(
                  t("A signal from {planet} is {au} AU away — one way takes {mmss}. What does a conversation at that delay teach about distance?", {
                    planet: askedAt.planet,
                    au: askedAt.au.toFixed(2),
                    mmss: askedAt.mmss,
                  })
                );
                setAskedAt(null);
              }}
            >
              {t("Bring the silence to the field")}
            </GhostAsk>
          ) : null}
        </div>
      ) : null}
      <HonestLine>{t("Circular orbits, true distances and periods — a navigator's first sketch.")}</HonestLine>
    </div>
  );
}

/* ═══ INTERPLANETARY — the transfer window finder ═════════════════════
   THE REAL MECHANICS: the synodic period from true sidereal years, the
   Hohmann transfer's own half-period, and the departure phase angle
   ψ = 180° − ω_target·t_transfer. The wait is solved, not guessed. */

const WINDOW_TARGETS = [0, 1, 2, 3, 4]; // Mercury..Saturn — all of them

function WindowFinder({ accent, disabled, onAsk }: {
  accent: string; disabled: boolean; onAsk: (question: string) => void;
}) {
  const t = useT();
  const mounted = useMounted();
  const [targetIdx, setTargetIdx] = useState(2); // Mars
  const planet = PLANET_EPHEM[targetIdx];

  const result = useMemo(() => {
    if (!mounted) return null;
    const teYears = EARTH_EPHEM.periodDays / 365.25;
    const tpYears = planet.periodDays / 365.25;
    /* the synodic period — how often the same geometry returns */
    const synodicYears = 1 / Math.abs(1 / teYears - 1 / tpYears);
    /* the Hohmann half-ellipse — the transfer's own duration */
    const aT = (EARTH_EPHEM.a + planet.a) / 2;
    const tHYears = 0.5 * aT ** 1.5;
    /* the phase angle the target must hold at departure */
    const omegaP = 360 / tpYears; // deg per year
    const psiDeg = (((180 - omegaP * tHYears) % 360) + 360) % 360;
    /* the phase now, and its drift */
    const daysNow = (Date.now() - J2000_MS) / 86400000;
    const phiNow = (((longitudeAt(planet, daysNow) - longitudeAt(EARTH_EPHEM, daysNow)) % 360) + 360) % 360;
    const omegaRel = (360 / planet.periodDays - 360 / EARTH_EPHEM.periodDays); // deg per day
    const dPhi = (((psiDeg - phiNow) % 360) + 360) % 360;
    const waitDays = dPhi / Math.abs(omegaRel);
    return { synodicYears, tHDays: tHYears * 365.25, psiDeg, phiNow, waitDays };
  }, [mounted, planet]);

  const fmtDays = (d: number): string => (d >= 730 ? `${(d / 365.25).toFixed(1)} yr` : `${Math.round(d)} d`);

  const arrival =
    result
      ? new Date(Date.now() + (result.waitDays + result.tHDays) * 86400000)
          .toISOString()
          .slice(0, 10)
      : null;
  const departure =
    result ? new Date(Date.now() + result.waitDays * 86400000).toISOString().slice(0, 10) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {WINDOW_TARGETS.map((i) => (
          <Chip key={PLANET_EPHEM[i].key} accent={accent} disabled={disabled}
            active={targetIdx === i} onClick={() => setTargetIdx(i)}>
            {t(PLANET_EPHEM[i].name)}
          </Chip>
        ))}
      </div>
      <div className="mt-2 space-y-1 rounded-xl border p-2.5" style={{ borderColor: mix(accent, 18) }}>
        <ReadRow label={t("Synodic period")} value={result ? `${result.synodicYears.toFixed(2)} yr` : "—"} accent={accent} />
        <ReadRow label={t("Transfer (Hohmann)")} value={result ? fmtDays(result.tHDays) : "—"} />
        <ReadRow label={t("Departure phase needed")} value={result ? `${Math.round(result.psiDeg)}°` : "—"} />
        <ReadRow
          label={t("Next window opens")}
          value={result ? `${fmtDays(result.waitDays)} — ${departure ?? ""}` : "—"}
        />
        <ReadRow label={t("Arrival")} value={arrival ?? "—"} />
      </div>
      {result ? (
        <div className="mt-2">
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              onAsk(
                t("The transfer window to {planet} opens in {wait} and the crossing takes {th} — what should the waiting teach the crew?", {
                  planet: t(planet.name),
                  wait: fmtDays(result.waitDays),
                  th: fmtDays(result.tHDays),
                })
              )
            }
          >
            {t("Bring the window to the field")}
          </GhostAsk>
        </div>
      ) : null}
      <HonestLine>{t("Circular orbits, Hohmann's own ellipse — the clockwork's first light.")}</HonestLine>
    </div>
  );
}

/* ═══ THE LAB PAGE — new instruments for each scope ═══════════════════ */

interface InstrumentCardProps {
  icon: LucideIcon;
  title: string;
  note: string;
  image: { src: string; alt: string };
  accent: string;
  className?: string;
  children: ReactNode;
}

export function InstrumentCard({ icon: Icon, title, note, image, accent, className = "", children }: InstrumentCardProps) {
  return (
    <div className={`rounded-2xl border p-3 transition-colors duration-300 ${className}`}
      style={{ borderColor: mix(accent, 20), background: mix(accent, 6) }}>
      <InstrumentPlate src={image.src} alt={image.alt} accent={accent} />
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" style={{ color: accent }} aria-hidden="true" />
        <h3 className="font-serif text-[13px] leading-tight text-foreground">{title}</h3>
      </div>
      <p className="mono-label mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">{note}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/* the bench's own name — spoken between the deck's first row and the
   deeper instruments (the plate images carry the domain's sky) */
const BENCH_TITLES: Record<string, string> = {
  quantum: "The Measurement Bench",
  healing: "The Care Instruments",
  interplanetary: "The Mission Instruments",
};

function BenchDivider({ scope, accent }: { scope: string; accent: string }) {
  const t = useT();
  return (
    <div className="min-[540px]:col-span-2 flex items-center gap-2 pt-1" aria-hidden="false">
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: mix(accent, 70) }} />
      <p className="mono-label shrink-0 text-[9px] uppercase tracking-[0.2em]" style={{ color: mix(accent, 85) }}>
        {t(BENCH_TITLES[scope] ?? "")}
      </p>
      <span className="h-px min-w-4 flex-1" style={{ background: mix(accent, 18) }} />
    </div>
  );
}

/* the three labs' own instrument pages — each receives the deck's own
   hands (accent, disabled, addXp, onAsk) and lays its instruments out */

export function QuantumInstruments({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [counts, setCounts] = useState({ d0: 0, d1: 0 });

  const samplePhoton = useCallback(
    (p0: number): 0 | 1 => {
      const outcome: 0 | 1 = Math.random() < p0 ? 0 : 1;
      setCounts((c) =>
        outcome === 0 ? { ...c, d0: c.d0 + 1 } : { ...c, d1: c.d1 + 1 }
      );
      addXp(1);
      return outcome;
    },
    [addXp]
  );

  return (
    <>
      <BenchDivider scope="quantum" accent={accent} />
      <InstrumentCard
        icon={Split}
        accent={accent}
        title={t("Interferometer Bench")}
        note={t("one photon, two paths, the law of recombination")}
        image={{ src: "/lab/quantum-interferometer.png", alt: t("A Mach–Zehnder interferometer on an optical bench") }}
      >
        <InterferometerBench
          accent={accent} disabled={disabled}
          onSample={samplePhoton} onAsk={onAsk}
          counts={counts}
          reset={() => setCounts({ d0: 0, d1: 0 })}
        />
      </InstrumentCard>
      <InstrumentCard
        icon={Globe}
        accent={accent}
        title={t("Bloch State Bench")}
        note={t("place a state on the sphere, read its amplitudes")}
        image={{ src: "/lab/quantum-bloch.png", alt: t("A glowing Bloch sphere instrument") }}
      >
        <BlochBench accent={accent} disabled={disabled} onAsk={onAsk} />
      </InstrumentCard>
      <InstrumentCard
        icon={Dices}
        accent={accent}
        title={t("Quantum Random Source")}
        note={t("honest draws from the device's own entropy")}
        image={{ src: "/lab/quantum-qrng.png", alt: t("A quantum random number generator device") }}
        className="min-[540px]:col-span-2"
      >
        <QrngBench accent={accent} disabled={disabled} onAsk={onAsk} />
      </InstrumentCard>
    </>
  );
}

export function HealxInstruments({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  return (
    <>
      <BenchDivider scope="healing" accent={accent} />
      <InstrumentCard
        icon={Waves}
        accent={accent}
        title={t("Coherence Oscillator")}
        note={t("two tones, one beat — the real binaural instrument")}
        image={{ src: "/lab/healx-oscillator.png", alt: t("Headphones beside a small glowing sound instrument") }}
        className="min-[540px]:col-span-2"
      >
        <CoherenceOscillator accent={accent} disabled={disabled} onSession={() => addXp(3, 1)} />
      </InstrumentCard>
      <InstrumentCard
        icon={Activity}
        accent={accent}
        title={t("Day Log Correlator")}
        note={t("your days, Pearson's own r — real statistics")}
        image={{ src: "/lab/healx-correlator.png", alt: t("A health journal with a glowing correlation chart") }}
        className="min-[540px]:col-span-2"
      >
        <DayLogCorrelator accent={accent} disabled={disabled} onAsk={onAsk} />
      </InstrumentCard>
      <InstrumentCard
        icon={Timer}
        accent={accent}
        title={t("Body Heatmap")}
        note={t("today's load, zone by zone, kept on the device")}
        image={{ src: "/lab/healx-bodymap.png", alt: t("A holographic body scan with gentle heat map glow") }}
      >
        <BodyHeatmap accent={accent} disabled={disabled} onAsk={onAsk} />
      </InstrumentCard>
    </>
  );
}

export function InterplanetaryInstruments({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  return (
    <>
      <BenchDivider scope="interplanetary" accent={accent} />
      <InstrumentCard
        icon={Fuel}
        accent={accent}
        title={t("Δv Mission Planner")}
        note={t("Tsiolkovsky's own equation, real routes and engines")}
        image={{ src: "/lab/interp-deltav.png", alt: t("A mission planning room with a glowing delta-v map of the solar system") }}
        className="min-[540px]:col-span-2"
      >
        <DeltaVPlanner accent={accent} disabled={disabled} onAsk={onAsk} />
      </InstrumentCard>
      <InstrumentCard
        icon={SatelliteDish}
        accent={accent}
        title={t("Light-Time Gauge")}
        note={t("true distances, true delay — the sky's own metronome")}
        image={{ src: "/lab/interp-lighttime.png", alt: t("A deep space network antenna under a starry sky") }}
      >
        <LightTimeGauge accent={accent} disabled={disabled} onAsk={onAsk} />
      </InstrumentCard>
      <InstrumentCard
        icon={CalendarClock}
        accent={accent}
        title={t("Transfer Window Finder")}
        note={t("synodic clocks and Hohmann's ellipse, solved honestly")}
        image={{ src: "/lab/interp-windows.png", alt: t("A hologram of planetary orbits with a Hohmann transfer ellipse") }}
      >
        <WindowFinder accent={accent} disabled={disabled} onAsk={onAsk} />
      </InstrumentCard>
    </>
  );
}

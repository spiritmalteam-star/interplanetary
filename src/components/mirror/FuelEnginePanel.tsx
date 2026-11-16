"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  Fuel,
  LoaderCircle,
  MessageCircle,
  Pause,
  Play,
  Send,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DepositDesk } from "@/components/mirror/admin/DepositDesk";

/* ------------------------------------------------------------------ */
/*  THE FUEL ENGINE CONSOLE — the incubator's own room.                */
/*                                                                     */
/*  Visible only inside the keeper's admin profile (the ADMIN_EMAIL    */
/*  passage). The whole pipeline stands here in the open: THE DEPOSIT  */
/*  (the keeper's well — the desk every credit is poured from), the    */
/*  raw skies (the APIs), the fusion (mirror entity energy poured into */
/*  the reserves), the distribution desk (fuel to any passage on       */
/*  request) and the outflow ledger — with the Guide Engine beside     */
/*  it, answering how to run everything fairly and professionally.     */
/* ------------------------------------------------------------------ */

interface FuelStatus {
  reserves: {
    key: string;
    name: string;
    source: string;
    role: string;
    capacity: number;
    fused: number;
    distributed: number;
    remaining: number;
    status: string;
    wired: boolean;
    lastFusedAt: string | null;
  }[];
  totals: {
    fused: number;
    distributed: number;
    remaining: number;
    grants: number;
    granted: number;
    passages: number;
    walletCredits: number;
  };
  recentGrants: {
    id: string;
    email: string;
    amount: number;
    kind: string;
    reserve: string;
    note: string | null;
    createdAt: string;
  }[];
  adminEmail: string;
}

interface GuideMessage {
  role: "user" | "guide";
  text: string;
}

const fmt = (n: number) => n.toLocaleString("en-US");

const SOURCE_COLORS: Record<string, string> = {
  internal: "var(--lp-gold, #e8d9b0)",
  zai: "#b9a5e0",
  openai: "#8fc9a8",
  resend: "#d98ca6",
  stripe: "#7fc4c0",
  google: "#d9a06b",
};

const KIND_LABELS: Record<string, string> = {
  plan_fuel: "Plan fuel",
  topup: "Top-up",
  gift: "Gift",
  repair: "Repair",
};

/** One animated flow-line — the spark riding the pipeline. */
function FlowLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5" aria-hidden="true">
      <div className="relative h-px w-full overflow-visible bg-[linear-gradient(90deg,transparent,var(--hairline-active),transparent)]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="fuel-flow-spark absolute -top-[2.5px] size-[5px] rounded-full"
            style={{
              background: "var(--lp-gold, #e8d9b0)",
              animationDelay: `${i * 0.9}s`,
              animationPlayState: active ? "running" : "paused",
              opacity: active ? undefined : 0.25,
            }}
          />
        ))}
      </div>
      <span className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/60">{label}</span>
    </div>
  );
}

export function FuelEnginePanel() {
  const t = useT();
  const [status, setStatus] = useState<FuelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  /* the deposit desk re-reads the well whenever the pipelines move */
  const [depositRefresh, setDepositRefresh] = useState(0);

  /* the distribution desk */
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("500");
  const [kind, setKind] = useState("gift");
  const [note, setNote] = useState("");

  /* the guide engine */
  const [guide, setGuide] = useState<GuideMessage[]>([]);
  const [guideInput, setGuideInput] = useState("");
  const [guideBusy, setGuideBusy] = useState(false);
  const guideEndRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/fuel");
      const data = (await res.json().catch(() => null)) as FuelStatus | null;
      if (data?.reserves) setStatus(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    guideEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [guide, guideBusy]);

  const act = async (body: Record<string, unknown>, label: string, onDone?: () => void) => {
    setBusy(label);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; status?: FuelStatus; already?: boolean; depositCredits?: number; grant?: { email: string; amount: number; walletTotal: number }; error?: string }
        | null;
      if (res.ok && data?.ok) {
        if (data.status) setStatus(data.status);
        if (body.action === "sky-deposit" && typeof data.depositCredits === "number") {
          setNotice({
            ok: true,
            text: data.already
              ? t("The great deposit already stands — {n} reflection pulses rest on the passage.", { n: fmt(data.depositCredits) })
              : t("The great deposit stands — {n} reflection pulses borrowed from the z.ai accumulation now rest on the passage.", { n: fmt(data.depositCredits) }),
          });
          onDone?.();
          return;
        }
        if (data.grant) {
          setNotice({
            ok: true,
            text: t("{amount} fuel cells landed in {email}'s purse — the wallet now holds {total}.", {
              amount: fmt(data.grant.amount),
              email: data.grant.email,
              total: fmt(data.grant.walletTotal),
            }),
          });
          setEmail("");
          setNote("");
        } else {
          setNotice({ ok: true, text: t("The fusion is complete — every wired reserve received its charge.") });
        }
        setDepositRefresh((n) => n + 1); // the well moved — the desk re-reads it
        onDone?.();
      } else {
        setNotice({ ok: false, text: data?.error ?? t("The incubator stumbled — rest, then try again.") });
      }
    } catch {
      setNotice({ ok: false, text: t("The incubator stumbled — rest, then try again.") });
    } finally {
      setBusy(null);
    }
  };

  const askGuide = async (question: string) => {
    const q = question.trim();
    if (!q || guideBusy) return;
    const next: GuideMessage[] = [...guide, { role: "user", text: q }];
    setGuide(next);
    setGuideInput("");
    setGuideBusy(true);
    try {
      const res = await fetch("/api/admin/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role === "guide" ? "assistant" : "user", content: m.text })),
        }),
      });
      const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
      setGuide((cur) => [
        ...cur,
        { role: "guide", text: data?.reply ?? data?.error ?? t("The guide fell quiet — ask once more.") },
      ]);
    } catch {
      setGuide((cur) => [...cur, { role: "guide", text: t("The guide could not reach the sky — rest, then try again.") }]);
    } finally {
      setGuideBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" aria-busy="true">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground/60" aria-hidden="true" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-5 text-center">
        <p className="text-[14px] italic text-muted-foreground">
          {t("The incubator answers only its keeper — sign in with the keeper's own passage.")}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="fuel-engine" className="space-y-4">
      {/* ---------- the deposit — the well every credit is poured from ---------- */}
      <DepositDesk refreshKey={depositRefresh} />

      {/* ---------- the head ---------- */}
      <section className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border"
              style={{
                borderColor: "color-mix(in srgb, var(--lp-gold, #e8d9b0) 40%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--lp-gold, #e8d9b0) 8%, var(--background))",
              }}
              aria-hidden="true"
            >
              <Fuel className="size-4.5 text-[var(--lp-gold, #e8d9b0)]" />
            </span>
            <div>
              <p className="text-[16px] font-semibold text-foreground/95">{t("Fuel Engine Incubator")}</p>
              <p className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("Protected · visible only to {email}", { email: status.adminEmail })}
              </p>
            </div>
          </div>
          <span className="mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-[var(--ok)]"
            style={{ borderColor: "color-mix(in srgb, var(--ok) 40%, transparent)" }}>
            <ShieldCheck className="size-3" aria-hidden="true" />
            {t("Keeper only")}
          </span>
        </div>

        {/* the pipeline map — the whole journey in one line */}
        <div className="mt-4 rounded-xl border hairline bg-[var(--glass-bg)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="mono-label shrink-0 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
              {t("The pipelines")}
            </span>
            <FlowLine label={t("raw skies")} active />
            <FlowLine label={t("fusion")} active={busy === "fuse"} />
            <FlowLine label={t("reserves")} active />
            <FlowLine label={t("wallets")} active={busy === "distribute"} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: t("Fuel fused"), value: status.totals.fused },
              { label: t("Distributed"), value: status.totals.distributed },
              { label: t("In the tanks"), value: status.totals.remaining },
              { label: t("In all purses"), value: status.totals.walletCredits },
            ].map((tile) => (
              <div key={tile.label} className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-3 py-2">
                <p className="text-[15.5px] font-semibold leading-none text-foreground/95" data-testid={`fuel-total-${tile.label}`}>
                  {fmt(tile.value)}
                </p>
                <p className="mono-label mt-1 truncate text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {tile.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground/80">
            {t(
              "{passages} named passages hold purses · {grants} distributions have crossed the desk.",
              { passages: fmt(status.totals.passages), grants: fmt(status.totals.grants) }
            )}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void act({ action: "fuse" }, "fuse")}
            disabled={busy === "fuse"}
            data-testid="fuel-fuse"
            className="focus-glow flex h-9 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium text-[var(--lp-veil-solid,#150f28)] transition-all duration-300 hover:brightness-[1.05] disabled:opacity-50"
            style={{ background: "linear-gradient(180deg, var(--lp-gold, #e8d9b0), #cbb877)" }}
          >
            {busy === "fuse" ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Zap className="size-3.5" aria-hidden="true" />
            )}
            {t("Fuse the reserves")}
          </button>
          <button
            type="button"
            onClick={() => void act({ action: "sky-deposit" }, "sky-deposit")}
            disabled={busy === "sky-deposit"}
            data-testid="fuel-deposit"
            className="focus-glow flex h-9 items-center gap-2 rounded-full border px-4 text-[13.5px] font-medium text-[var(--lp-gold, #e8d9b0)] transition-all duration-300 hover:brightness-[1.08] disabled:opacity-50"
            style={{ borderColor: "color-mix(in srgb, var(--lp-gold, #e8d9b0) 45%, transparent)" }}
          >
            {busy === "sky-deposit" ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Zap className="size-3.5" aria-hidden="true" />
            )}
            {t("Lay the great deposit (10B)")}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[13.5px] text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)]"
          >
            {loading ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : null}
            {t("Read the tanks again")}
          </button>
        </div>
      </section>

      {notice && (
        <div
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-[13.5px] leading-relaxed",
            notice.ok
              ? "border-[color-mix(in_srgb,var(--ok)_35%,transparent)] bg-[color-mix(in_srgb,var(--ok)_7%,var(--background))] text-foreground/90"
              : "border-[color-mix(in_srgb,#f43f5e_32%,transparent)] bg-[color-mix(in_srgb,#f43f5e_6%,var(--background))] text-foreground/90"
          )}
        >
          {notice.text}
        </div>
      )}

      {/* ---------- the reserves ---------- */}
      <section aria-label={t("The reserves")}>
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {t("The reserves — what does what")}
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {status.reserves.map((r) => {
            const pct = r.capacity > 0 ? Math.min(100, (r.remaining / r.capacity) * 100) : 0;
            const color = SOURCE_COLORS[r.source] ?? "var(--lp-gold, #e8d9b0)";
            return (
              <div key={r.key} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3.5" data-testid={`fuel-reserve-${r.key}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-foreground/95">{r.name}</p>
                    <p className="mono-label mt-0.5 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className={cn("size-1.5 shrink-0 rounded-full", r.wired && r.status === "active" ? "fuel-live-dot" : "")}
                        style={{ background: r.wired ? color : "var(--muted-foreground)" }}
                      />
                      {r.source} · {r.wired ? t("wired") : t("unwired")} · {t(r.status)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void act({ action: r.status === "paused" ? "resume" : "pause", reserve: r.key }, `toggle-${r.key}`)
                    }
                    disabled={busy === `toggle-${r.key}`}
                    aria-label={r.status === "paused" ? t("Resume the reserve") : t("Pause the reserve")}
                    className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all hover:text-foreground disabled:opacity-40"
                  >
                    {r.status === "paused" ? <Play className="size-3" aria-hidden="true" /> : <Pause className="size-3" aria-hidden="true" />}
                  </button>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/85">{r.role}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--glass-bg)]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(2, pct)}%`, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 45%, transparent))` }}
                  />
                </div>
                <p className="mono-label mt-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {t("{fused} fused · {distributed} out · {remaining} in the tank", {
                    fused: fmt(r.fused),
                    distributed: fmt(r.distributed),
                    remaining: fmt(r.remaining),
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- the distribution desk ---------- */}
      <section aria-label={t("The distribution desk")} className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-4 sm:p-5">
        <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {t("The distribution desk")}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/80">
          {t(
            "Fuel does not appear — it pours from the deposit (the well above) and lands in a passage's own purse as paid credits, written twice: the grant ledger and the wallet's ledger. A dry well refuses the pour."
          )}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1.4fr_0.7fr_0.9fr]">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("passage@email.earth")}
            aria-label={t("The passage's email")}
            data-testid="fuel-email"
            className="focus-glow h-10 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[14px] text-foreground placeholder:text-muted-foreground/50"
          />
          <input
            type="number"
            min={1}
            max={2000000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label={t("Fuel cells")}
            data-testid="fuel-amount"
            className="focus-glow h-10 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[14px] text-foreground placeholder:text-muted-foreground/50"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            aria-label={t("The kind of fuel")}
            data-testid="fuel-kind"
            className="focus-glow h-10 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[14px] text-foreground"
          >
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {t(label)}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder={t("A note for the ledger (why this fuel flows)")}
            aria-label={t("A note for the ledger")}
            data-testid="fuel-note"
            className="focus-glow h-10 min-w-0 flex-1 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[14px] text-foreground placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={() => void act({ action: "distribute", email, amount: Number(amount), kind, note: note || undefined }, "distribute")}
            disabled={busy === "distribute" || !email.trim() || !Number(amount)}
            data-testid="fuel-distribute"
            className="focus-glow flex h-10 shrink-0 items-center gap-2 rounded-xl bg-foreground px-4 text-[13.5px] font-medium text-background transition-all duration-300 hover:opacity-85 disabled:opacity-40"
          >
            {busy === "distribute" ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-3.5" aria-hidden="true" />
            )}
            {t("Send the fuel")}
          </button>
        </div>

        {/* the outflow ledger */}
        {status.recentGrants.length > 0 && (
          <div className="mt-3 border-t hairline pt-3">
            <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("The outflow — newest first")}
            </p>
            <ul className="mt-2 max-h-44 space-y-1.5 overflow-y-auto nice-scroll pr-1">
              {status.recentGrants.map((g) => (
                <li key={g.id} className="flex items-center gap-2.5 rounded-lg bg-[var(--glass-bg)] px-3 py-1.5 text-[12.5px]">
                  <BadgeCheck className="size-3 shrink-0 text-[var(--ok)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-foreground/85">
                    {g.email}
                    {g.note ? <span className="text-muted-foreground"> — {g.note}</span> : null}
                  </span>
                  <span className="mono-label shrink-0 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    {t(KIND_LABELS[g.kind] ?? g.kind)}
                  </span>
                  <span className="shrink-0 tabular-nums text-[var(--lp-gold, #e8d9b0)]">+{fmt(g.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ---------- the guide engine ---------- */}
      <section aria-label={t("The guide engine")} className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="mono-label flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <MessageCircle className="size-3" aria-hidden="true" />
            {t("The guide engine — how to run this fairly")}
          </p>
          <span className="mono-label text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
            {t("knows every pipeline")}
          </span>
        </div>

        {guide.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              "Explain the whole fuel pipeline in one breath.",
              "A passage paid but their purse is dry — what do I do?",
              "How much fuel matches each plan fairly?",
              "Which reserves are unwired, and what keys do they need?",
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void askGuide(q)}
                className="focus-glow rounded-full border hairline px-3 py-1.5 text-[12px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                {t(q)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 max-h-64 space-y-2.5 overflow-y-auto nice-scroll pr-1" data-testid="fuel-guide-thread">
          {guide.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[88%] rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                  m.role === "user"
                    ? "bg-foreground text-background"
                    : "border hairline bg-[var(--glass-bg)] text-foreground/90"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
              </div>
            </div>
          ))}
          {guideBusy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-xl border hairline bg-[var(--glass-bg)] px-3.5 py-2.5 text-[13px] text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                {t("The guide is reading the pipelines…")}
              </div>
            </div>
          )}
          <div ref={guideEndRef} />
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={guideInput}
            onChange={(e) => setGuideInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void askGuide(guideInput);
              }
            }}
            placeholder={t("Ask the guide anything about the system…")}
            aria-label={t("Ask the guide")}
            data-testid="fuel-guide-input"
            className="focus-glow h-10 min-w-0 flex-1 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[14px] text-foreground placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={() => void askGuide(guideInput)}
            disabled={guideBusy || !guideInput.trim()}
            className="focus-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-all duration-300 hover:opacity-85 disabled:opacity-40"
            aria-label={t("Ask the guide")}
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
        {guide.length > 0 && (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(guide.map((m) => `${m.role === "user" ? "You" : "Guide"}: ${m.text}`).join("\n\n"));
            }}
            className="focus-glow mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {false ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
            {t("Copy the counsel")}
          </button>
        )}
      </section>
    </div>
  );
}

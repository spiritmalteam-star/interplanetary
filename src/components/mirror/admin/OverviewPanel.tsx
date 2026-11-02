"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Bot, Database, Flag, Megaphone, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/*  THE COMMAND CENTER PANEL — the owner's glance, laid in cards.      */
/*  Every number arrives from /api/admin/overview (real tables, real   */
/*  witnesses); the panel invents nothing and hides nothing.           */
/* ------------------------------------------------------------------ */

interface OverviewPayload {
  generatedAt: string;
  system: {
    users: { total: number; verified: number; anonymous: number; new24h: number; new7d: number };
    activity: {
      dau: number;
      mau: number;
      requests24h: number;
      errors24h: number;
      errorRate24hPct: number;
      avgLatencyMs24h: number | null;
    };
    pulse: Array<{ day: string; requests: number; errors: number }>;
  };
  intelligence: {
    health: Record<
      string,
      {
        available: boolean;
        breakerOpen: boolean;
        consecutiveFailures: number;
        totalSuccess: number;
        totalFailure: number;
        latencyEwmaMs: number | null;
        lastError: string | null;
      }
    >;
    models7d: Array<{ model: string; calls: number; inputTokens: number; outputTokens: number }>;
    providers7d: Array<{ provider: string; calls: number; inputTokens: number; outputTokens: number }>;
    operations7d: Array<{ operation: string; success: number; failed: number }>;
    tasks: Array<{ kind: string; label: string; skies: Array<{ sky: string; model: string; available: boolean }> }>;
    agents: Array<{ id: string; name: string; version: string; status: string }>;
  };
  business: {
    wallets: Array<{ planTier: string; count: number }>;
    credits: { free: number; paid: number; deposit: number };
    paymentsTotal: number;
    activeSubscriptions: number;
  };
  infrastructure: {
    db: { latencyMs: number; kind: string };
    processJobs: Array<{ status: string; count: number }>;
    generationJobs: Array<{ status: string; count: number }>;
  };
  config: {
    flags: Array<{ key: string; value: unknown; updatedAt: string; updatedBy: string | null }>;
    announcement: { message?: string; level?: string } | null;
  };
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-white/90">{value}</div>
      {hint ? <div className="text-[11px] text-white/40">{hint}</div> : null}
    </div>
  );
}

export function OverviewPanel() {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [announcement, setAnnouncement] = useState("");
  const [level, setLevel] = useState<"info" | "warning" | "celebration">("info");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (res.status === 403 || res.status === 401) {
        setState("denied");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      const payload = (await res.json()) as OverviewPayload;
      setData(payload);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const publish = useCallback(async () => {
    setPosting(true);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: announcement, level }),
      });
      if (res.ok) setAnnouncement("");
    } catch (err) {
      console.error("[OverviewPanel] announcement failed:", err);
    } finally {
      setPosting(false);
      load();
    }
  }, [announcement, level, load]);

  if (state === "loading") {
    return (
      <div className="py-8 text-center text-sm text-white/50" data-testid="overview-loading">
        The command center gathers its numbers…
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className="py-8 text-center text-sm text-white/50" data-testid="overview-denied">
        The console keeps its silence.
      </div>
    );
  }
  if (state === "error" || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-white/50">
        <span>The glance rested — the numbers did not arrive.</span>
        <Button size="sm" variant="outline" onClick={load}>
          Ask again
        </Button>
      </div>
    );
  }

  const s = data.system;
  const maxPulse = Math.max(1, ...data.system.pulse.map((p) => p.requests));

  return (
    <div className="space-y-4" data-testid="command-center">
      {/* ---------------- system overview ---------------- */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            System overview
            <span className="ml-auto text-[11px] font-normal text-white/40">
              {new Date(data.generatedAt).toLocaleTimeString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Passages" value={s.users.total} hint={`${s.users.anonymous} anonymous`} />
            <Stat label="Verified" value={s.users.verified} />
            <Stat label="New · 24h" value={s.users.new24h} hint={`${s.users.new7d} this week`} />
            <Stat label="DAU / MAU" value={`${s.activity.dau} / ${s.activity.mau}`} />
            <Stat label="Requests · 24h" value={s.activity.requests24h} />
            <Stat
              label="Errors · 24h"
              value={`${s.activity.errorRate24hPct}%`}
              hint={
                s.activity.avgLatencyMs24h != null
                  ? `avg ${s.activity.avgLatencyMs24h} ms`
                  : undefined
              }
            />
          </div>
          {/* the 14-day pulse — pure divs, no chart engine woken for it */}
          <div className="flex h-14 items-end gap-[3px]" role="img" aria-label="Requests over the last 14 days">
            {s.pulse.map((p) => (
              <div key={p.day} className="group relative flex-1" title={`${p.day}: ${p.requests} requests, ${p.errors} errors`}>
                <div
                  className="w-full rounded-t bg-white/25 transition-colors group-hover:bg-white/45"
                  style={{ height: `${Math.max(2, (p.requests / maxPulse) * 52)}px` }}
                />
                {p.errors > 0 ? (
                  <div
                    className="w-full rounded-t bg-red-400/60"
                    style={{ height: `${Math.max(2, (p.errors / maxPulse) * 52)}px` }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ---------------- M.E. intelligence ---------------- */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Bot className="h-4 w-4" aria-hidden />
            M.E. — Mirror Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.keys(data.intelligence.health).length === 0 ? (
              <span className="text-xs text-white/40">
                No sky has been touched this boot — the first ask will teach the map.
              </span>
            ) : (
              Object.entries(data.intelligence.health).map(([sky, h]) => (
                <Badge
                  key={sky}
                  variant="outline"
                  className={`gap-1.5 ${
                    h.breakerOpen
                      ? "border-red-400/40 text-red-300"
                      : h.available
                        ? "border-emerald-400/40 text-emerald-200"
                        : "border-amber-400/40 text-amber-200"
                  }`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      h.breakerOpen ? "bg-red-400" : h.available ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  {sky} · {h.totalSuccess}✓ {h.totalFailure}✕
                  {h.latencyEwmaMs != null ? ` · ${h.latencyEwmaMs}ms` : ""}
                </Badge>
              ))
            )}
          </div>
          {data.intelligence.models7d.length > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-black/40 text-white/45">
                  <tr>
                    <th className="px-3 py-2 font-medium">Model (7d)</th>
                    <th className="px-3 py-2 font-medium">Calls</th>
                    <th className="px-3 py-2 font-medium">Tokens in</th>
                    <th className="px-3 py-2 font-medium">Tokens out</th>
                  </tr>
                </thead>
                <tbody>
                  {data.intelligence.models7d.map((m) => (
                    <tr key={m.model} className="border-t border-white/5 text-white/75">
                      <td className="px-3 py-1.5 font-mono">{m.model}</td>
                      <td className="px-3 py-1.5 tabular-nums">{m.calls}</td>
                      <td className="px-3 py-1.5 tabular-nums">{m.inputTokens.toLocaleString()}</td>
                      <td className="px-3 py-1.5 tabular-nums">{m.outputTokens.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-white/40">No model served a call in the last 7 days.</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {data.intelligence.agents.map((a) => (
              <Badge key={a.id} variant="outline" className="text-[11px] text-white/60">
                {a.name} v{a.version}
                {a.status === "dormant" ? " · resting" : ""}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ---------------- business + infrastructure ---------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Users className="h-4 w-4" aria-hidden />
              Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Wallets"
                value={data.business.wallets.reduce((acc, w) => acc + w.count, 0)}
                hint={data.business.wallets.map((w) => `${w.planTier}: ${w.count}`).join(" · ")}
              />
              <Stat
                label="Credits outstanding"
                value={(data.business.credits.free + data.business.credits.paid).toLocaleString()}
                hint={`deposit well ${data.business.credits.deposit.toLocaleString()}`}
              />
              <Stat label="Payments" value={data.business.paymentsTotal} />
              <Stat label="Active subscriptions" value={data.business.activeSubscriptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Database className="h-4 w-4" aria-hidden />
              Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Database"
                value={data.infrastructure.db.kind}
                hint={`answered in ${data.infrastructure.db.latencyMs} ms`}
              />
              <Stat
                label="Works in Motion"
                value={data.infrastructure.processJobs.reduce((a, j) => a + j.count, 0)}
                hint={data.infrastructure.processJobs.map((j) => `${j.status}: ${j.count}`).join(" · ") || "none yet"}
              />
              <Stat
                label="Generation jobs"
                value={data.infrastructure.generationJobs.reduce((a, j) => a + j.count, 0)}
                hint={data.infrastructure.generationJobs.map((j) => `${j.status}: ${j.count}`).join(" · ") || "none yet"}
              />
              <Stat
                label="Feature switches"
                value={data.config.flags.length}
                hint="PlatformConfig rows"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- announcements ---------------- */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Megaphone className="h-4 w-4" aria-hidden />
            System announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.config.announcement?.message ? (
            <p className="text-xs text-white/60">
              Standing voice ({data.config.announcement.level}): “{data.config.announcement.message}”
            </p>
          ) : (
            <p className="text-xs text-white/40">No announcement stands.</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="A short voice for the whole house (280 characters)…"
              maxLength={280}
              className="min-h-[64px] flex-1 bg-white/[0.04] text-sm"
              aria-label="Announcement message"
            />
            <div className="flex gap-2 sm:flex-col">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as typeof level)}
                className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-xs text-white/80"
                aria-label="Announcement level"
              >
                <option value="info">info</option>
                <option value="warning">warning</option>
                <option value="celebration">celebration</option>
              </select>
              <Button size="sm" onClick={publish} disabled={posting || announcement.trim().length === 0}>
                {posting ? "Raising…" : "Raise the voice"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- the flags ledger ---------------- */}
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Flag className="h-4 w-4" aria-hidden />
            The switches ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {data.config.flags.map((f) => (
              <div
                key={f.key}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs"
              >
                <span className="font-mono text-white/75">{f.key}</span>
                <span className="truncate text-white/45">
                  {JSON.stringify(f.value).slice(0, 60)}
                </span>
                <span className="shrink-0 text-white/30">
                  {f.updatedBy ?? "—"} · {new Date(f.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 pb-2 text-[11px] text-white/35">
        <Activity className="h-3 w-3" aria-hidden />
        Every number is read live from the house's own tables — nothing cached, nothing invented.
      </p>
    </div>
  );
}

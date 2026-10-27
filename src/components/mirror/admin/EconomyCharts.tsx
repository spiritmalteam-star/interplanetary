"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE LEDGER'S THIRTY DAYS — the keeper's own analytics room.        */
/*  Rides the same /api/admin/economy glance (its `analytics` object)  */
/*  through TanStack Query, and draws the economy's tide: credits      */
/*  granted against credits spent, and the net weight of every door.   */
/*  Strokes wear the house's lavender and cyan; axes and labels wear   */
/*  the mono face; the grid stays hairline. Reduced motion is          */
/*  honored — the charts simply stand still for those hands.           */
/* ------------------------------------------------------------------ */

interface DailyPoint {
  date: string;
  spent: number;
  granted: number;
}

interface ByActionRow {
  actionType: string;
  count: number;
  totalCredits: number;
}

interface EconomyAnalytics {
  since: string;
  daily: DailyPoint[];
  byAction: ByActionRow[];
}

/* the house's chart palette — lavender for light laid in, cyan for
   light drawn out; never the default blues */
const LAVENDER = "#c4b5fd";
const LAVENDER_SOFT = "#a78bfa";
const CYAN = "#67e8f9";
const CYAN_SOFT = "#22d3ee";
const MONO_FACE = "var(--font-jetbrains), ui-monospace, monospace";

const AXIS_TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 10,
  fontFamily: MONO_FACE,
} as const;

/** Computed once per mount — the charts never move for still hands. */
function usePrefersReducedMotion(): boolean {
  return useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )[0];
}

/* ---------- the glass tooltip the house already speaks ------------- */

function GlassFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-36 rounded-xl border hairline bg-background/90 px-3 py-2 shadow-lg backdrop-blur-md">
      {children}
    </div>
  );
}

function DailyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number | string; color?: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <GlassFrame>
      <p className="mono-label text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((p) => (
          <p key={String(p.dataKey)} className="flex items-center gap-1.5 font-mono text-[11px] text-foreground/90">
            <span className="inline-block size-1.5 rounded-full" style={{ background: p.color }} aria-hidden="true" />
            {String(p.dataKey)}
            <span className="ml-auto pl-2 text-muted-foreground">{Number(p.value ?? 0)}✦</span>
          </p>
        ))}
      </div>
    </GlassFrame>
  );
}

function ActionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ByActionRow }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <GlassFrame>
      <p className="mono-label text-[9px] uppercase tracking-[0.16em] text-[var(--scope-a,var(--gd))]">
        {row.actionType}
      </p>
      <p className="mt-1 font-mono text-[11px] text-foreground/90">
        {row.count} {row.count === 1 ? "movement" : "movements"}
      </p>
      <p className="font-mono text-[11px] text-muted-foreground">
        net {row.totalCredits > 0 ? "+" : ""}
        {row.totalCredits}✦
      </p>
    </GlassFrame>
  );
}

/* ---------- the room ------------------------------------------------ */

export function EconomyCharts() {
  const t = useT();
  const reduceMotion = usePrefersReducedMotion();
  const gradDaily = useId();
  const gradGranted = useId();

  const analyticsQuery = useQuery({
    queryKey: ["admin", "economy-analytics"],
    staleTime: 60_000,
    queryFn: async (): Promise<EconomyAnalytics> => {
      const res = await fetch("/api/admin/economy");
      if (res.status === 403) throw new Error("SILENCE");
      if (!res.ok) throw new Error("GLANCE_FAILED");
      const json = (await res.json().catch(() => null)) as { analytics?: EconomyAnalytics } | null;
      if (!json?.analytics) throw new Error("NO_ANALYTICS");
      return json.analytics;
    },
  });

  if (analyticsQuery.status === "error") {
    /* not the keeper — the room keeps its silence, like the console */
    if (analyticsQuery.error?.message === "SILENCE") return null;
    return (
      <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4 text-[12.5px] text-muted-foreground">
        <p>{t("The tide could not be read — the glance rested.")}</p>
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="mt-3"
          onClick={() => void analyticsQuery.refetch()}
          data-testid="admin-analytics-retry"
        >
          {t("Read it again")}
        </Button>
      </div>
    );
  }

  if (analyticsQuery.isPending || !analyticsQuery.data) {
    return (
      <div className="grid grid-cols-1 gap-4" data-testid="admin-analytics-loading" aria-hidden="true">
        <div className="h-[268px] animate-pulse rounded-xl border hairline bg-[var(--glass-bg-soft)]" />
        <div className="h-[268px] animate-pulse rounded-xl border hairline bg-[var(--glass-bg-soft)]" />
      </div>
    );
  }

  const { daily, byAction } = analyticsQuery.data;
  const empty =
    byAction.length === 0 && daily.every((d) => d.spent === 0 && d.granted === 0);
  const totalGranted = daily.reduce((s, d) => s + d.granted, 0);
  const totalSpent = daily.reduce((s, d) => s + d.spent, 0);

  if (empty) {
    return (
      <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-6 text-center" data-testid="admin-analytics-empty">
        <p className="text-[13px] text-foreground/80">{t("The ledger is still young.")}</p>
        <p className="mt-1 text-[12px] text-muted-foreground/70">
          {t("No credit has crossed the purse in the last thirty days — the tide will rise here.")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* ---------- the tide: granted against spent, thirty days -------- */}
      <div
        className="min-w-0 rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4"
        role="img"
        aria-label={t("Thirty days of credits granted against credits spent")}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("The tide — thirty days")}
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains)] text-[10px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full" style={{ background: LAVENDER }} aria-hidden="true" />
              {t("granted")}
            </span>
            <span className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains)] text-[10px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full" style={{ background: CYAN }} aria-hidden="true" />
              {t("spent")}
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={daily} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id={gradGranted} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LAVENDER} stopOpacity={0.34} />
                <stop offset="100%" stopColor={LAVENDER} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={gradDaily} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CYAN} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CYAN} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" strokeOpacity={0.7} vertical={false} />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickFormatter={(v: string) => (typeof v === "string" ? v.slice(5) : String(v))}
              minTickGap={26}
            />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
            <Tooltip content={<DailyTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="granted"
              stroke={LAVENDER_SOFT}
              strokeWidth={1.6}
              fill={`url(#${gradGranted})`}
              isAnimationActive={!reduceMotion}
              dot={false}
              activeDot={{ r: 3, fill: LAVENDER_SOFT, stroke: "transparent" }}
            />
            <Area
              type="monotone"
              dataKey="spent"
              stroke={CYAN_SOFT}
              strokeWidth={1.6}
              fill={`url(#${gradDaily})`}
              isAnimationActive={!reduceMotion}
              dot={false}
              activeDot={{ r: 3, fill: CYAN_SOFT, stroke: "transparent" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="sr-only">
          {t("Over the last thirty days")} {totalGranted}✦ {t("granted")}, {totalSpent}✦ {t("spent")}.
        </p>
      </div>

      {/* ---------- the doors: net credits by action type --------------- */}
      <div
        className="min-w-0 rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4"
        role="img"
        aria-label={t("Net credits by action type over thirty days")}
      >
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("The doors — credits by action")}
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byAction} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barSize={14}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" strokeOpacity={0.7} horizontal={false} />
            <XAxis
              type="number"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="actionType"
              tick={{ ...AXIS_TICK, fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={104}
              tickFormatter={(v: string) => (v.length > 13 ? `${v.slice(0, 12)}…` : v)}
            />
            <Tooltip content={<ActionTooltip />} cursor={{ fill: "var(--foreground)", fillOpacity: 0.04 }} />
            <ReferenceLine y={0} stroke="var(--border)" />
            <Bar dataKey="totalCredits" isAnimationActive={!reduceMotion} radius={3}>
              {byAction.map((row) => (
                <Cell key={row.actionType} fill={row.totalCredits < 0 ? CYAN : LAVENDER} fillOpacity={0.88} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* THE FOUNDER'S OVERVIEW — only real, sourced numbers. A metric the
   house cannot know says "Not connected" or "Unavailable"; it is
   never zero-filled, never guessed. Definitions and sources sit one
   tap behind every number. */

type Status = "verified" | "estimated" | "unavailable" | "not_connected";
interface Metric { value: number | null; status: Status; source: string; definition: string; note?: string }
interface ProviderRow { provider: string; model: string | null; requests: number; failed: number; errorRatePct: number; inputTokens: number; outputTokens: number; avgLatencyMs: number | null; lastUsed: string | null }
interface Overview {
  generatedAt: string;
  rangeDays: number;
  metrics: Record<string, Metric>;
  providers: ProviderRow[] | { status: "unavailable" };
  providerBalances: Metric;
}

const MONEY = new Set(["grossRevenue", "lifetimeRevenue", "aiCost", "grossRevenueMinusAiCost"]);
const LABELS: Record<string, string> = {
  registeredUsers: "Registered users", guests: "Guest passages", newRegistrations: "New registrations",
  activeNow: "Active now (5 min)", dau: "Active 24 h", wau: "Active 7 d", mau: "Active 30 d", returningUsers: "Returning users",
  grossRevenue: "Gross revenue", lifetimeRevenue: "Lifetime revenue", uniqueBuyers: "Unique buyers (ever)",
  payingCustomersInRange: "Paying customers", complimentaryGrants: "Complimentary grants", activeSubscriptions: "Active subscriptions",
  passHolders: "Pass holders", cancelledSubscriptions: "Cancelled subscriptions", failedPayments: "Failed payments", refunds: "Refunds",
  processingFees: "Payment processing fees", hostingCosts: "Hosting & database", aiCost: "AI provider cost (recorded)",
  grossRevenueMinusAiCost: "Revenue − recorded AI cost", operatingProfit: "Operating profit", creditLiability: "Credits owed to customers",
  conversion: "Conversion rate",
};
const HEADLINE = ["registeredUsers", "dau", "grossRevenue", "aiCost", "grossRevenueMinusAiCost", "uniqueBuyers", "activeSubscriptions", "creditLiability"];
const ORDER = Object.keys(LABELS);

function show(key: string, m: Metric): string {
  if (m.status === "not_connected") return "Not connected";
  if (m.status === "unavailable" || m.value === null) return "Unavailable";
  if (MONEY.has(key)) return `$${m.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return m.value.toLocaleString();
}
const TAG: Record<Status, string> = {
  verified: "text-emerald-600 dark:text-emerald-400", estimated: "text-amber-600 dark:text-amber-400",
  unavailable: "text-muted-foreground", not_connected: "text-muted-foreground",
};

export function FounderOverview() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState(false);
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/founder/overview?days=${days}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      setData((await r.json()) as Overview);
      setErr(false);
    } catch { setErr(true); }
  }, [days]);
  useEffect(() => { void load(); }, [load]);

  if (err) return <p className="p-3 text-[12px] text-muted-foreground" data-testid="founder-overview-error">The overview is unavailable right now. Nothing is shown rather than a guess.</p>;
  if (!data) return <p className="p-3 text-[12px] text-muted-foreground">Reading the house…</p>;

  const keys = all ? ORDER : HEADLINE;
  const cell = (k: string) => {
    const m = data.metrics[k];
    if (!m) return null;
    return (
      <button key={k} type="button" onClick={() => setOpen(open === k ? null : k)} className="rounded-xl border border-border/50 bg-card/40 p-3 text-left transition-colors hover:bg-card/70" data-testid={`founder-metric-${k}`}>
        <p className="text-[10.5px] text-muted-foreground">{LABELS[k]}</p>
        <p className={cn("mt-0.5 text-[17px] font-semibold tabular-nums", (m.status === "not_connected" || m.status === "unavailable") && "text-[13px] font-normal text-muted-foreground")}>{show(k, m)}</p>
        <p className={cn("text-[10px]", TAG[m.status])}>{m.status.replace("_", " ")}</p>
        {open === k && (
          <span className="mt-2 block space-y-1 text-[10.5px] leading-snug text-muted-foreground">
            <span className="block">{m.definition}</span>
            <span className="block">Source: {m.source}</span>
            {m.note ? <span className="block">{m.note}</span> : null}
          </span>
        )}
      </button>
    );
  };

  const providers = Array.isArray(data.providers) ? data.providers : null;
  return (
    <section className="space-y-3" data-testid="founder-overview">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold">Founder overview</h3>
        <div className="flex gap-1" role="group" aria-label="Date range">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className={cn("rounded-full border px-2.5 py-1 text-[11px]", days === d ? "border-foreground/40 bg-foreground/10" : "border-border/50 text-muted-foreground")}>{d} d</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{keys.map(cell)}</div>
      <button type="button" onClick={() => setAll(!all)} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline" data-testid="founder-toggle-all">
        {all ? "Show fewer" : "Show every metric and definition"}
      </button>
      <div>
        <p className="mb-1 text-[11.5px] font-medium">Intelligence providers · last {data.rangeDays} d (from recorded requests)</p>
        {providers && providers.length > 0 ? (
          <div className="space-y-1">
            {providers.map((p) => (
              <p key={`${p.provider}|${p.model}`} className="flex flex-wrap justify-between gap-x-3 rounded-lg border border-border/40 px-2.5 py-1.5 text-[11px] tabular-nums">
                <span className="font-medium">{p.provider}{p.model ? ` · ${p.model}` : ""}</span>
                <span className="text-muted-foreground">{p.requests.toLocaleString()} req · {p.errorRatePct}% failed · {p.avgLatencyMs === null ? "latency n/a" : `${p.avgLatencyMs} ms`} · {(p.inputTokens + p.outputTokens).toLocaleString()} tok</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">{providers ? "No requests recorded in this range." : "Unavailable."}</p>
        )}
        <p className="mt-1 text-[10.5px] text-muted-foreground">Account balance: {show("balance", data.providerBalances)} — {data.providerBalances.note}</p>
      </div>
      <p className="text-[10px] text-muted-foreground">Read {new Date(data.generatedAt).toLocaleString()}. Revenue is not profit; estimated values are labeled.</p>
    </section>
  );
}

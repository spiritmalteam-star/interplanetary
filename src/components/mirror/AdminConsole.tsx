"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { EconomyCharts } from "@/components/mirror/admin/EconomyCharts";

/* ------------------------------------------------------------------ */
/*  THE KEEPER'S CONSOLE — the platform administration panel. Only     */
/*  the verified administrator ever sees it: the server answers 403    */
/*  silence to every other hand, and this room simply stays dark for   */
/*  them. Overview, the users' shelf with grants and draws, the        */
/*  standing prices of the paid creations, the music engine's own      */
/*  honesty, and the ledger's newest movements.                        */
/* ------------------------------------------------------------------ */

interface EconomyOverview {
  users: number;
  signedUsers: number;
  wallets: number;
  creditLiability: number;
  purchased: number;
  spent: number;
  refunded: number;
  enforcement: string;
  /** THE DEPOSIT — the keeper's well every mint pours from */
  depositBalance?: number;
  paymentSources?: { total: number; active: number };
}

interface EconomyUser {
  id: string;
  email: string;
  name: string | null;
  provider: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  admin: boolean;
  spent: number;
  wallet?: {
    planTier: string;
    freeCreditsRemaining: number;
    paidCreditsRemaining: number;
    depositCredits: number;
  } | null;
}

interface AuditRow {
  id: string;
  email: string;
  actionType: string;
  credits: number;
  admin: boolean;
  at: string;
}

/** the chartable series the glance carries beside its older fields */
interface EconomyAnalytics {
  since: string;
  daily: { date: string; spent: number; granted: number }[];
  byAction: { actionType: string; count: number; totalCredits: number }[];
}

interface EconomyData {
  overview: EconomyOverview;
  usage: { operation: string; count: number }[];
  prices: {
    musicPreview: number;
    musicFull: number;
    musicLoop: number;
    akashicReading: number;
    bookShort: number;
    bookExtended: number;
  };
  packs: { id: string; label: string; credits: number; priceCents: number; currency: string }[];
  limits: Record<string, number>;
  lcEngine: {
    weavingNow: number;
    globalToday: number;
    lastSuccess: { model: string; at: number } | null;
    lastError: { code: string; message: string; at: number } | null;
    limits: Record<string, number>;
  };
  audit: AuditRow[];
  analytics?: EconomyAnalytics;
}

function StatCell({ k, v, warn }: { k: string; v: string | number; warn?: boolean }) {
  return (
    <div className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-3 py-2">
      <p className="mono-label text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">{k}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-[15px]",
          warn ? "text-[color-mix(in_srgb,var(--destructive)_80%,var(--foreground))]" : "text-foreground/90"
        )}
      >
        {v}
      </p>
    </div>
  );
}

export function AdminConsole() {
  const t = useT();
  const refreshWallet = useMirror((s) => s.refreshWallet);
  const [data, setData] = useState<EconomyData | null>(null);
  const [denied, setDenied] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<EconomyUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [grantAmount, setGrantAmount] = useState<Record<string, string>>({});
  const [grantReason, setGrantReason] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [prices, setPrices] = useState<EconomyData["prices"] | null>(null);
  const [savingPrices, setSavingPrices] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/economy");
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      const json = (await res.json().catch(() => null)) as EconomyData | null;
      if (res.ok && json) {
        setData(json);
        setPrices(json.prices);
      }
    } catch {
      /* the console rests */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/economy?q=${encodeURIComponent(q)}`);
      const json = (await res.json().catch(() => null)) as { users?: EconomyUser[] } | null;
      if (res.ok && json?.users) setUsers(json.users);
      else setUsers([]);
    } catch {
      setUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const act = async (action: "grant" | "deduct", userId: string) => {
    const credits = Math.floor(Number(grantAmount[userId] ?? 0));
    if (!credits || credits <= 0) return;
    setFlash(null);
    try {
      const res = await fetch("/api/admin/economy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, credits, reason: grantReason }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string; taken?: number } | null;
      if (res.ok) {
        setFlash(
          action === "grant"
            ? t("The light was laid.")
            : t("{taken} lights were drawn.", { taken: json?.taken ?? 0 })
        );
        setGrantAmount((m) => ({ ...m, [userId]: "" }));
        void search();
        void load();
        void refreshWallet();
      } else {
        setFlash(json?.error ?? t("The hand rested."));
      }
    } catch {
      setFlash(t("The hand rested."));
    }
  };

  const savePrices = async () => {
    if (!prices) return;
    setSavingPrices(true);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/economy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPrices", prices }),
      });
      if (res.ok) {
        setFlash(t("The standing prices moved."));
        void load();
      } else {
        setFlash(t("The prices did not land."));
      }
    } catch {
      setFlash(t("The prices did not land."));
    } finally {
      setSavingPrices(false);
    }
  };

  if (denied) return null; /* not the keeper — the room keeps its silence */

  if (!data) {
    return (
      <div className="flex items-center gap-2 p-4 text-[13px] text-muted-foreground" data-testid="admin-console-loading">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        {t("The console opens…")}
      </div>
    );
  }

  const priceFields: { key: keyof EconomyData["prices"]; label: string }[] = [
    { key: "musicPreview", label: t("Music preview (30s)") },
    { key: "musicFull", label: t("Full song (3+ min)") },
    { key: "musicLoop", label: t("Endless journey (~30 min loop)") },
    { key: "akashicReading", label: t("Akashic creative reading") },
    { key: "bookShort", label: t("Short book") },
    { key: "bookExtended", label: t("Extended book") },
  ];

  return (
    <div className="space-y-4" data-testid="admin-console">
      {flash && (
        <p role="status" className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-3 py-2 text-[12.5px] text-muted-foreground">
          {flash}
        </p>
      )}

      {/* ---------- overview ---------- */}
      <section>
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("The platform at a glance")}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCell k={t("Visitors")} v={data.overview.users} />
          <StatCell k={t("Passages")} v={data.overview.signedUsers} />
          <StatCell k={t("Credit liability")} v={data.overview.creditLiability} />
          <StatCell
            k={t("Enforcement")}
            v={data.overview.enforcement === "active" ? t("active") : t("resting")}
            warn={data.overview.enforcement !== "active"}
          />
          <StatCell k={t("Purchased")} v={data.overview.purchased} />
          <StatCell k={t("Spent")} v={data.overview.spent} />
          <StatCell k={t("Refunded")} v={data.overview.refunded} />
          <StatCell
            k={t("DEPOSIT well")}
            v={data.overview.depositBalance ?? 0}
            warn={data.overview.enforcement === "active" && (data.overview.depositBalance ?? 0) <= 0}
          />
          <StatCell k={t("Weaving now")} v={data.lcEngine.weavingNow} />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/60">
          {t(
            "The deposit is the house's well: purchases fill it, every mint pours from it — a dry well refuses new light when enforcement stands."
          )}
        </p>
      </section>

      {/* ---------- payment sources — the sealed cupboard's glance ---------- */}
      <section>
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("Payment sources")}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border hairline bg-[var(--glass-bg-soft)] px-3 py-2">
          <p className="text-[12.5px] text-muted-foreground">
            <span className="font-mono text-foreground/85">
              {data.overview.paymentSources?.active ?? 0}/{data.overview.paymentSources?.total ?? 0}
            </span>{" "}
            {t("active · sealed with AES-256-GCM · hints only, never the secrets")}
          </p>
          <span className="mono-label text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
            {t("managed at the fuel desk")}
          </span>
        </div>
      </section>

      {/* ---------- the music engine's honesty ---------- */}
      <section>
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("The music engine")}
        </p>
        <div className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-3 py-2 text-[12px] text-muted-foreground">
          <p>
            {t("Woven today")}: <span className="font-mono text-foreground/85">{data.lcEngine.globalToday}</span>
            {" · "}
            {t("day's allowance")}:{" "}
            <span className="font-mono text-foreground/85">
              {data.lcEngine.limits?.globalPerDay ?? "—"}
            </span>
          </p>
          <p className="mt-1">
            {data.lcEngine.lastSuccess
              ? `${t("Last successful weave")}: ${data.lcEngine.lastSuccess.model} · ${new Date(
                  data.lcEngine.lastSuccess.at
                ).toLocaleString()}`
              : t("No successful weave yet on this warm instance")}
          </p>
          {data.lcEngine.lastError && (
            <p className="mt-1 text-[color-mix(in_srgb,var(--destructive)_75%,var(--foreground))]">
              {t("Last error")}: {data.lcEngine.lastError.code} — {data.lcEngine.lastError.message}
            </p>
          )}
        </div>
      </section>

      {/* ---------- the users' shelf ---------- */}
      <section>
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("The users' shelf")}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search by email or id…")}
            aria-label={t("Search users")}
            data-testid="admin-user-search"
            className="focus-glow h-9 min-w-0 flex-1 rounded-full border hairline bg-background/60 px-4 text-[13px] outline-none"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            aria-label={t("Search")}
            className="focus-glow flex size-9 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            {searching ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </form>
        <input
          type="text"
          value={grantReason}
          onChange={(e) => setGrantReason(e.target.value)}
          placeholder={t("Reason written beside every movement…")}
          aria-label={t("Reason")}
          maxLength={200}
          className="focus-glow mt-2 h-9 w-full rounded-full border hairline bg-background/60 px-4 text-[12.5px] outline-none"
        />
        <div className="nice-scroll mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border hairline bg-[var(--glass-bg-soft)] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-[12.5px] text-foreground/90">
                  {u.email}
                  {u.admin && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10.5px] text-[var(--scope-a)]">
                      <ShieldCheck className="size-3" aria-hidden="true" />
                      {t("keeper")}
                    </span>
                  )}
                </p>
                <p className="shrink-0 font-mono text-[12px] text-muted-foreground">
                  ✦{(u.wallet?.freeCreditsRemaining ?? 0) + (u.wallet?.paidCreditsRemaining ?? 0)}
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={grantAmount[u.id] ?? ""}
                  onChange={(e) => setGrantAmount((m) => ({ ...m, [u.id]: e.target.value }))}
                  aria-label={t("Credits")}
                  className="focus-glow h-8 w-20 rounded-md border hairline bg-background/60 px-2 font-mono text-[12px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => void act("grant", u.id)}
                  data-testid={`admin-grant-${u.id}`}
                  className="focus-glow h-8 rounded-full border hairline px-2.5 text-[11.5px] text-foreground/85 transition-colors hover:border-[var(--hairline-hover)]"
                >
                  {t("Grant")}
                </button>
                <button
                  type="button"
                  onClick={() => void act("deduct", u.id)}
                  className="focus-glow h-8 rounded-full border hairline px-2.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("Draw")}
                </button>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
                  {t("spent")} ✦{u.spent}
                </span>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="px-1 text-[12px] text-muted-foreground/70">{t("Search to open the shelf.")}</p>
          )}
        </div>
      </section>

      {/* ---------- the standing prices ---------- */}
      <section>
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("The standing prices")}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {prices &&
            priceFields.map((f) => (
              <label key={f.key} className="flex items-center justify-between gap-2 rounded-lg border hairline bg-[var(--glass-bg-soft)] px-3 py-2">
                <span className="text-[12.5px] text-foreground/85">{f.label}</span>
                <input
                  type="number"
                  min={0}
                  value={prices[f.key]}
                  onChange={(e) =>
                    setPrices((p) => (p ? { ...p, [f.key]: Math.max(0, Math.floor(Number(e.target.value) || 0)) } : p))
                  }
                  aria-label={f.label}
                  className="focus-glow h-8 w-16 rounded-md border hairline bg-background/60 px-2 text-right font-mono text-[12.5px] outline-none"
                />
              </label>
            ))}
        </div>
        <button
          type="button"
          onClick={() => void savePrices()}
          disabled={savingPrices || !prices}
          data-testid="admin-save-prices"
          className="focus-glow mt-2 flex h-9 items-center gap-1.5 rounded-full border hairline px-4 text-[12.5px] text-foreground/90 transition-colors hover:border-[var(--hairline-hover)] disabled:opacity-50"
        >
          {savingPrices && <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />}
          {t("Move the standing prices")}
        </button>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground/70">
          {t("The packs ride their launch shape:")}{" "}
          {data.packs.map((p) => `${p.credits}✦ €${(p.priceCents / 100).toFixed(0)}`).join(" · ")}
        </p>
      </section>

      {/* ---------- the ledger's thirty days ---------- */}
      <section>
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("The ledger's thirty days")}
        </p>
        <EconomyCharts />
      </section>

      {/* ---------- the ledger's newest movements ---------- */}
      <section>
        <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("The ledger's newest movements")}
        </p>
        <div className="nice-scroll max-h-64 space-y-1 overflow-y-auto pr-1" data-testid="admin-audit">
          {data.audit.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[11.5px] hover:bg-foreground/5">
              <span className="min-w-0 truncate text-muted-foreground">
                {row.email}
                {row.admin && <span className="ml-1 text-[10px] text-[var(--scope-a)]">{t("keeper")}</span>}
              </span>
              <span className="shrink-0 font-mono text-muted-foreground/80">
                {row.actionType} {row.credits > 0 ? `+${row.credits}` : row.credits}
              </span>
            </div>
          ))}
          {data.audit.length === 0 && (
            <p className="px-1 text-[12px] text-muted-foreground/70">{t("The ledger rests quiet.")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

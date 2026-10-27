"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  THE BOOK OF MOVEMENTS — the purse's own ledger, read from the      */
/*  visitor's own rows only (GET /api/wallet/ledger).                  */
/*                                                                     */
/*  TanStack Query serves it: newest first, refetching gently when     */
/*  the window regains focus (the default) and when the house's own    */
/*  "wallet:refresh" bell rings (a purchase, a grant, a refund).       */
/*  Loading wears skeletons, never a lone turning wheel; an empty      */
/*  book says so honestly.                                             */
/* ------------------------------------------------------------------ */

interface LedgerRow {
  id: string;
  actionType: string;
  creditsDeducted: number;
  rawCostUsd: number | null;
  metadata: { description?: unknown } & Record<string, unknown> | null;
  createdAt: string;
}

/* the movements' human names — the ActionType values the server's
   wallet law writes (SQLite keeps no enums; these are the rows) */
const ACTION_NAMES: Record<string, string> = {
  CHAT: "A conversation's weigh",
  AKASHIC: "Akashic reading",
  ART_X: "Art creation",
  LIGHT_CODES: "Music weave",
  DREAM_BOOK: "Dream book",
  SUBSCRIPTION_GRANT: "Moon pass grant",
  TOPUP_PURCHASE: "Purchased light",
  DEPOSIT_ZAI: "The great deposit",
};

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtCredits = (n: number) => n.toLocaleString("en-US");

const rowDescription = (meta: LedgerRow["metadata"]): string | null => {
  if (!meta || typeof meta !== "object") return null;
  const d = meta.description;
  return typeof d === "string" && d.trim() ? d : null;
};

export function TransactionsPanel() {
  const t = useT();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["wallet", "ledger"],
    /* refetch on window focus rides by default — the book stays true */
    queryFn: async (): Promise<LedgerRow[]> => {
      const res = await fetch("/api/wallet/ledger");
      if (!res.ok) throw new Error("the ledger's door did not open");
      const json = (await res.json().catch(() => null)) as {
        ledger?: LedgerRow[];
      } | null;
      return json?.ledger ?? [];
    },
  });

  /* the house's own bell — a purchase or a refund rings it, the book
     turns to its freshest page at once */
  useEffect(() => {
    const onRefresh = () => void refetch();
    window.addEventListener("wallet:refresh", onRefresh);
    return () => window.removeEventListener("wallet:refresh", onRefresh);
  }, [refetch]);

  if (isPending) {
    return (
      <div
        className="space-y-2 py-1"
        aria-busy="true"
        aria-live="polite"
        data-testid="profilepage-transactions-loading"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2.5"
          >
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32 max-w-[60%]" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-3 w-10 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-3">
        <p className="text-[13px] text-muted-foreground">
          {t("The book could not be read — rest a breath, then open it again.")}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="focus-glow mt-2 rounded-full border hairline px-3 py-1.5 text-[12.5px] text-foreground/85 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm"
        >
          {t("Read again")}
        </button>
      </div>
    );
  }

  const rows = data ?? [];

  if (rows.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-2 rounded-xl border hairline bg-[var(--glass-bg)] px-4 py-8 text-center"
        data-testid="profilepage-transactions-empty"
      >
        <span className="flex size-9 items-center justify-center rounded-full border hairline bg-[var(--glass-bg-soft)]">
          <ScrollText className="size-4 text-muted-foreground/70" aria-hidden="true" />
        </span>
        <p className="text-[14px] font-medium text-foreground/90">
          {t("The book rests — no movements yet.")}
        </p>
        <p className="max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
          {t(
            "Every creation weighed, every light purchased and every light given back arrives here, newest first."
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul
        className="nice-scroll max-h-96 space-y-1.5 overflow-y-auto pr-0.5"
        data-testid="profilepage-transactions-list"
      >
        {rows.map((row) => {
          const granted = row.creditsDeducted >= 0;
          const desc = rowDescription(row.metadata);
          return (
            <li
              key={row.id}
              className="flex items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2.5 transition-colors duration-300 hover:border-[var(--hairline-hover)]"
            >
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full border hairline bg-[var(--glass-bg-soft)]"
                aria-hidden="true"
              >
                <Sparkles
                  className={`size-3 ${granted ? "text-[var(--cy)]" : "text-muted-foreground/70"}`}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-foreground/90">
                  {t(ACTION_NAMES[row.actionType] ?? row.actionType)}
                </span>
                <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/80">
                  {fmtWhen(row.createdAt)}
                  {desc ? ` · ${desc}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span
                  className={`text-[13px] font-semibold tabular-nums ${
                    granted ? "text-[var(--cy)]" : "text-foreground/80"
                  }`}
                >
                  {granted ? "+" : "−"}
                  {fmtCredits(Math.abs(row.creditsDeducted))}
                </span>
                {row.rawCostUsd != null && row.rawCostUsd > 0 && (
                  <span
                    className="mono-label text-[9px] tabular-nums text-muted-foreground/60"
                    title={t("The weave's internal cost — bookkeeping, never a charge")}
                  >
                    ≈ €{row.rawCostUsd.toFixed(2)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mono-label mt-2 px-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
        {t("The newest fifty movements — the book's freshest pages")}
      </p>
    </div>
  );
}

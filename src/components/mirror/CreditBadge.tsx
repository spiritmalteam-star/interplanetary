"use client";

import { Sparkles } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE LIGHT BADGE — the visitor's purse, glanced at a glance.        */
/*                                                                     */
/*  Sits quietly among the floating handles: the sum of the free and   */
/*  the purchased light, with the passage's tier when one is held.     */
/*  One touch opens the unlock modal — the doors to more light.        */
/* ------------------------------------------------------------------ */

const TIER_MARK: Record<string, string | null> = {
  FREE: null,
  SEEKER: "SEEKER",
  OBSERVATORY_PRO: "OBSERVATORY",
};

export function CreditBadge() {
  const t = useT();
  const wallet = useMirror((s) => s.wallet);
  const openWalletModal = useMirror((s) => s.openWalletModal);

  if (!wallet) return null;
  const low = wallet.total <= 2;
  const tierMark = TIER_MARK[wallet.planTier] ?? null;

  return (
    <button
      type="button"
      onClick={() => openWalletModal(null)}
      aria-label={t("Your light — credits remaining")}
      title={t("Your light — credits remaining")}
      data-testid="credit-badge"
      className={`focus-glow flex h-9 items-center gap-1.5 rounded-full border hairline px-3 shadow-[0_2px_14px_-8px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-colors duration-300 hover:border-[var(--hairline-hover)] ${
        low
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          : "bg-[var(--glass-bg)] text-muted-foreground hover:text-foreground"
      }`}
    >
      <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="text-[12.5px] font-medium tabular-nums">{wallet.total}</span>
      {tierMark && (
        <span className="mono-label hidden text-[8px] uppercase tracking-[0.16em] opacity-70 sm:inline">
          {tierMark}
        </span>
      )}
    </button>
  );
}

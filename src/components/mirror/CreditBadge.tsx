"use client";

import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE WALLET PILL — the purse's place in the crown.                  */
/*                                                                     */
/*  A quiet glass handle beside the navigator: the sum of the free     */
/*  and the purchased light in a mono-label figure, the passage's      */
/*  tier when a moon pass is held, an amber hush when the light runs   */
/*  low. One touch opens the visitor's own room (the profile — where   */
/*  the Transactions book and the account chamber live), exactly the   */
/*  way the crown's profile icon opens it: the store's own hand, no    */
/*  new modal of its own.                                              */
/*                                                                     */
/*  Before the wallet's first glance answers, the pill wears a dash —  */
/*  nothing pretended. On the smallest screens the figure stands       */
/*  alone (no mark, no star — the crown stays quiet), and the touch    */
/*  target stays at least 44px (the after-veil the crown's hands wear).*/
/* ------------------------------------------------------------------ */

const TIER_MARK: Record<string, string | null> = {
  FREE: null,
  SEEKER: "SEEKER",
  OBSERVATORY_PRO: "OBSERVATORY",
};

export function CreditBadge() {
  const t = useT();
  const wallet = useMirror((s) => s.wallet);
  const openProfilePage = useMirror((s) => s.openProfilePage);

  const loaded = wallet != null;
  const low = loaded && wallet.total <= 2;
  const tierMark = loaded ? (TIER_MARK[wallet.planTier] ?? null) : null;
  const balance = loaded ? wallet.total.toLocaleString("en-US") : "—";

  const ariaLabel = loaded
    ? `${t("Your purse")}: ${balance} ${t("lights")}`
    : t("Your purse — the light is still being counted");

  return (
    <button
      type="button"
      onClick={openProfilePage}
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      title={ariaLabel}
      data-testid="credit-badge"
      className={`focus-glow relative flex h-9 items-center gap-1.5 rounded-full border hairline px-3 backdrop-blur-md transition-all duration-300 after:absolute after:-inset-1 after:rounded-full after:content-[''] hover:border-[var(--hairline-hover)] hover:glow-sm ${
        low
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          : "bg-[var(--glass-bg)] text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className="mono-label text-[11px] tabular-nums tracking-[0.06em]"
        aria-hidden={loaded ? undefined : true}
      >
        {balance}
      </span>
      {tierMark && (
        <span className="mono-label hidden text-[9px] uppercase tracking-[0.16em] opacity-70 lg:inline">
          {tierMark}
        </span>
      )}
    </button>
  );
}

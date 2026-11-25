"use client";

/* ------------------------------------------------------------------ */
/*  THE PURSE — the one door for every purchase: memberships and       */
/*  coin packs, paid through PayPal or card. The catalog and the       */
/*  providers' readiness are read live from the house; the money       */
/*  itself moves only through checkout and capture. A provider whose   */
/*  key still rests is shown honestly as "available soon" — never      */
/*  pretended. The unified ledger links every coin to every profile.   */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Coins, CreditCard, Loader2, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { ModalShell } from "../ModalShell";
import { cn } from "@/lib/utils";

interface CatalogMembership {
  sku: string;
  planId: string;
  label: string;
  priceCents: number;
  currency: string;
  monthlyCredits: number;
  note: string;
}

interface CatalogCoins {
  sku: string;
  label: string;
  coins: number;
  priceCents: number;
  currency: string;
  note: string;
}

interface Catalog {
  memberships: CatalogMembership[];
  coins: CatalogCoins[];
}

interface ProvidersConfig {
  paypal: boolean;
  card: boolean;
  stripePublishable: boolean;
}

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ThePurseModal({ open, onClose }: Props) {
  const t = useT();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [config, setConfig] = useState<ProvidersConfig | null>(null);
  const [busySku, setBusySku] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capture, setCapture] = useState<
    { ok: boolean; coins: number; plan: string | null; already: boolean } | null
  >(null);
  const [checkingReturn, setCheckingReturn] = useState(false);

  const readShop = useCallback(async () => {
    try {
      const [catalogRes, configRes] = await Promise.all([
        fetch("/api/payments/catalog", { cache: "no-store" }),
        fetch("/api/payments/config", { cache: "no-store" }),
      ]);
      const catalogData = (await catalogRes.json().catch(() => null)) as Catalog | null;
      const configData = (await configRes.json().catch(() => null)) as ProvidersConfig | null;
      if (catalogData) setCatalog(catalogData);
      if (configData) setConfig(configData);
    } catch {
      /* the shop forgives a stumble — the shelves rest */
    }
  }, []);

  /* the provider's return — the truth arrives through the capture */
  const checkReturn = useCallback(async () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paypalToken = params.get("purse") === "paypal" ? params.get("token") : null;
    const cardSession = params.get("purse") === "card" ? params.get("session") : null;
    const ref = paypalToken ?? cardSession;
    if (!ref) return;
    setCheckingReturn(true);
    try {
      const res = await fetch("/api/payments/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref,
          provider: paypalToken ? "paypal" : "card",
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        already?: boolean;
        coinsCredited?: number;
        planId?: string | null;
        error?: string;
      } | null;
      if (data?.ok) {
        setCapture({
          ok: true,
          coins: data.coinsCredited ?? 0,
          plan: data.planId ?? null,
          already: data.already === true,
        });
        /* the purse's own truth, read fresh — the badge and every
           room that shows the lights follows at once */
        try {
          void useMirror.getState().refreshWallet();
        } catch {
          /* the badge rests until the next read */
        }
      } else if (data?.error) {
        setError(data.error);
      }
      /* the door's own marks leave the address — a refresh never re-asks */
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      setError("The capture could not be finished. Nothing is lost — try again from the shelf.");
    } finally {
      setCheckingReturn(false);
      void readShop();
    }
  }, [readShop]);

  useEffect(() => {
    if (!open) return;
    void readShop();
    void checkReturn();
  }, [open, readShop, checkReturn]);

  const beginCheckout = useCallback(
    async (provider: "paypal" | "card", kind: "membership" | "coins", sku: string) => {
      setBusySku(sku);
      setError(null);
      try {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, kind, sku }),
        });
        const data = (await res.json().catch(() => null)) as
          | { redirectUrl?: string; error?: string }
          | null;
        if (res.ok && data?.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }
        setError(data?.error ?? "The checkout could not be opened. Rest, then try again.");
      } catch {
        setError("The checkout could not be opened. Rest, then try again.");
      } finally {
        setBusySku(null);
      }
    },
    []
  );

  const ProviderButtons = ({
    kind,
    sku,
  }: {
    kind: "membership" | "coins";
    sku: string;
  }) => {
    const paypalReady = config?.paypal === true;
    const cardReady = config?.card === true;
    return (
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={!paypalReady || busySku !== null}
          onClick={() => void beginCheckout("paypal", kind, sku)}
          data-testid={`purse-paypal-${sku}`}
          className={cn(
            "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11.5px] transition-all duration-300",
            paypalReady
              ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)] text-[var(--scope-a)] hover:glow-sm"
              : "cursor-not-allowed border-[var(--hairline)] text-muted-foreground/50"
          )}
          title={paypalReady ? "PayPal" : "PayPal rests — its keys are not yet in the vault"}
        >
          {busySku === sku ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : null}
          PayPal{paypalReady ? "" : " · soon"}
        </button>
        <button
          type="button"
          disabled={!cardReady || busySku !== null}
          onClick={() => void beginCheckout("card", kind, sku)}
          data-testid={`purse-card-${sku}`}
          className={cn(
            "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11.5px] transition-all duration-300",
            cardReady
              ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)] text-[var(--scope-a)] hover:glow-sm"
              : "cursor-not-allowed border-[var(--hairline)] text-muted-foreground/50"
          )}
          title={cardReady ? "Bank card" : "Card payments rest — their keys are not yet in the vault"}
        >
          <CreditCard className="size-3" aria-hidden="true" />
          Card{cardReady ? "" : " · soon"}
        </button>
      </div>
    );
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(v) => (v ? undefined : onClose())}
      title={t("The Purse")}
      description={t("Membership and coins — one purse, every profile, kept together.")}
      widthClass="sm:max-w-[640px]"
    >
      <div className="px-5 pb-6 sm:px-6" data-testid="the-purse-modal">
        {/* the provider's return — the capture's honest word */}
        {checkingReturn ? (
          <p className="mb-3 flex items-center gap-2 rounded-xl border hairline px-3 py-2 text-[12.5px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {t("Reading the payment's truth…")}
          </p>
        ) : null}
        {capture?.ok ? (
          <p className="mb-3 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--scope-a)_45%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_8%,transparent)] px-3 py-2 text-[12.5px] text-foreground">
            <BadgeCheck className="size-4 text-[var(--scope-a)]" aria-hidden="true" />
            {capture.already
              ? t("This payment was already kept — your purse stands as it stood.")
              : capture.plan
                ? `${t("The membership lives")}: ${capture.plan} · +${capture.coins} ${t("lights")}`
                : `+${capture.coins} ${t("lights")} ${t("landed in your purse")}`}
          </p>
        ) : null}
        {error ? (
          <p className="mb-3 rounded-xl border border-[color-mix(in_srgb,var(--destructive)_30%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-3 py-2 text-[12.5px] text-foreground/85">
            {error}
          </p>
        ) : null}

        {!catalog ? (
          <div className="space-y-2 py-2" aria-busy="true">
            <div className="h-20 animate-pulse rounded-xl border hairline bg-[var(--glass-bg-soft)]" />
            <div className="h-32 animate-pulse rounded-xl border hairline bg-[var(--glass-bg-soft)]" />
          </div>
        ) : (
          <>
            {/* MEMBERSHIPS */}
            <section aria-label={t("Memberships")}>
              <p className="mono-label mb-2 text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("Memberships")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {catalog.memberships.map((m) => (
                  <div
                    key={m.sku}
                    className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3"
                    data-testid={`purse-plan-${m.planId}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-[15px] text-foreground">{m.label}</h3>
                      <span className="mono-label text-[11px] text-[var(--scope-a)]">
                        {money(m.priceCents, m.currency)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
                      {m.note}
                    </p>
                    <p className="mono-label mt-1.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
                      {t("every month")}: +{m.monthlyCredits} {t("lights")}
                    </p>
                    <ProviderButtons kind="membership" sku={m.sku} />
                  </div>
                ))}
              </div>
            </section>

            {/* COINS */}
            <section className="mt-5" aria-label={t("Coin packs")}>
              <p className="mono-label mb-2 text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("Coin packs")}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {catalog.coins.map((c) => (
                  <div
                    key={c.sku}
                    className="flex flex-col rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3"
                    data-testid={`purse-pack-${c.sku}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Coins className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                      <span className="text-[14px] font-semibold text-foreground">{c.coins}</span>
                    </div>
                    <p className="mono-label mt-1 text-[10px] text-[var(--scope-a)]">
                      {money(c.priceCents, c.currency)}
                    </p>
                    <p className="mt-1 flex-1 text-[10.5px] leading-snug text-muted-foreground/80">
                      {c.note}
                    </p>
                    <div className="mt-2">
                      <ProviderButtons kind="coins" sku={c.sku} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
              <Sparkles className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              {t(
                "One purse links every coin to every profile — pay once, keep everything, on every device. A provider still resting its keys is shown honestly as soon."
              )}
            </p>
          </>
        )}
      </div>
    </ModalShell>
  );
}

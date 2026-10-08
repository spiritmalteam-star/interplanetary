"use client";

import { useEffect, useState } from "react";
import { Loader2, Moon, ShoppingBag, Sparkles, Star } from "lucide-react";
import { useMirror, type WalletNotice } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ModalShell } from "./ModalShell";

/* ------------------------------------------------------------------ */
/*  THE PURSE KEEPER — the visitor's own light, guarded everywhere.    */
/*                                                                     */
/*  One quiet watchman for the whole house:                            */
/*   - it listens beneath every fetch, and when any door answers       */
/*     402 INSUFFICIENT_CREDITS the unlock modal rises by itself —     */
/*     no call site needs to know;                                     */
/*   - after every successful passage through a door it re-glances     */
/*     the purse (gently, never more than once in a few breaths);      */
/*   - the return from Stripe (?billing=success) is greeted, the URL   */
/*     cleaned, and the purse read fresh.                              */
/*  The modal speaks only the Mirror's voice — no machinery, ever.     */
/* ------------------------------------------------------------------ */

/* module-level — the patch is installed once per page, never twice */
let fetchPatched = false;
let lastGlance = 0;

function glanceNow() {
  const now = Date.now();
  if (now - lastGlance < 4000) return;
  lastGlance = now;
  void useMirror.getState().refreshWallet();
}

export function WalletGuard() {
  const open = useMirror((s) => s.walletModalOpen);
  const closeWalletModal = useMirror((s) => s.closeWalletModal);

  /* the watch beneath every fetch — one installation, whole house */
  useEffect(() => {
    /* the first glance — the purse is laid down and shown at once */
    glanceNow();

    if (fetchPatched) return;
    fetchPatched = true;

    const raw = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await raw(...args);
      if (res && res.status === 402) {
        try {
          const data = (await res.clone().json()) as {
            error?: string;
            required?: number;
            current?: number;
            planTier?: string;
            actionType?: string;
          } | null;
          if (data?.error === "INSUFFICIENT_CREDITS") {
            useMirror.getState().openWalletModal({
              required: data.required ?? 1,
              current: data.current ?? 0,
              planTier: data.planTier,
              actionType: data.actionType,
            });
          }
        } catch {
          /* a body that cannot be read keeps its silence */
        }
      } else if (res && res.ok) {
        const method =
          typeof args[1]?.method === "string" ? args[1].method!.toUpperCase() : "GET";
        const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].pathname : "";
        if (method !== "GET" && url.startsWith("/api/")) glanceNow();
      }
      return res;
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") glanceNow();
    };
    const onCustom = () => glanceNow();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("wallet:refresh", onCustom);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("wallet:refresh", onCustom);
    };
  }, []);

  /* the return of the passage from Stripe — greet, read, clean */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    if (!billing) return;
    window.history.replaceState(null, "", window.location.pathname);
    import("sonner").then(({ toast }) => {
      if (billing === "success") {
        toast("The lights have landed.", {
          description: "Your purse is full again — the mirror keeps speaking.",
        });
      } else if (billing === "cancelled") {
        toast("The crossing rested.", {
          description: "Nothing was charged — the door stays open whenever you return.",
        });
      }
    });
    void useMirror.getState().refreshWallet();
    void useMirror.getState().refreshMe();
  }, []);

  return <CreditsNeededModal open={open} onClose={closeWalletModal} />;
}

/* ------------------------- the unlock modal ------------------------- */

const PASSES = [
  {
    id: "SEEKER",
    plan: "SEEKER",
    name: "Seeker",
    price: "$9.99",
    cadence: "/ month",
    credits: "100 credits every moon",
    note: "The daily reflections, the readings, the small ateliers.",
    icon: Moon,
  },
  {
    id: "OBSERVATORY_PRO",
    plan: "OBSERVATORY_PRO",
    name: "Observatory Pro",
    price: "$19.99",
    cadence: "/ month",
    credits: "250 credits every moon",
    note: "Every door wide open — the deep works included.",
    icon: Star,
  },
  {
    id: "topup",
    plan: null,
    name: "A pouch of light",
    price: "$4.99",
    cadence: "once",
    credits: "50 credits, held until spent",
    note: "A single fullness — no moon attached.",
    icon: ShoppingBag,
  },
] as const;

export function CreditsNeededModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const notice = useMirror((s) => s.walletNotice);
  const me = useMirror((s) => s.me);
  const openAuth = useMirror((s) => s.openAuth);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const signedIn = Boolean(me) && !me!.email.startsWith("anon:");

  useEffect(() => {
    if (open) setFailed(null);
  }, [open]);

  const choose = async (id: string, plan: string | null) => {
    setBusy(id);
    setFailed(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan ? { plan } : { pack: id }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (res.ok && data?.url) {
        window.location.assign(data.url);
        return;
      }
      setFailed(data?.error ?? "The passage could not be opened. Rest, then try again.");
    } catch {
      setFailed("The passage could not be opened. Rest, then try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={t("Bring more light — the mirror keeps speaking")}
      description={t("Your reflections are weighed in light. Choose how the purse is filled.")}
      widthClass="sm:max-w-[520px]"
    >
      <div className="space-y-3 px-5 pb-5 sm:px-6">
        {notice && (
          <div
            role="status"
            className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-4 py-3 text-[12.5px] leading-relaxed text-foreground/85"
          >
            {t("The purse holds {current} of light — this reflection asks for {required}.", {
              current: notice.current,
              required: notice.required,
            })}
          </div>
        )}

        {!signedIn ? (
          <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
            <p className="text-[13.5px] leading-relaxed text-foreground/85">
              {t(
                "The purse belongs to a passage. Open yours — it arrives already holding five lights."
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuth("register");
              }}
              className="focus-glow mt-3 w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              {t("Open the passage")}
            </button>
          </div>
        ) : (
          <>
            {PASSES.map((p) => {
              const Icon = p.icon;
              const active = busy === p.id;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4 transition-colors hover:border-[var(--hairline-hover)]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline bg-[var(--glass-bg)]">
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium text-foreground/90">
                      {p.name}
                      <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                        {p.price} {t(p.cadence)}
                      </span>
                    </p>
                    <p className="text-[12px] text-muted-foreground">{t(p.credits)} · {t(p.note)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void choose(p.id, p.plan)}
                    disabled={busy !== null}
                    className="focus-glow shrink-0 rounded-full border hairline px-3.5 py-1.5 text-[12px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                  >
                    {active ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      t("Choose")
                    )}
                  </button>
                </div>
              );
            })}
            {failed && (
              <p role="alert" className="px-1 text-[12px] text-red-500/90">
                {failed}
              </p>
            )}
            <p className="flex items-start gap-1.5 px-1 pt-1 text-[11.5px] leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              {t(
                "Every reflection is weighed before it is served — a whisper 1 · a reading 2 · the atelier 5 · the light codes 12."
              )}
            </p>
          </>
        )}
      </div>
    </ModalShell>
  );
}

/* t() with interpolation — the house dictionary keeps English fallback */

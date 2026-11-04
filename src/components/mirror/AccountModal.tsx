"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  BadgeMinus,
  Copy,
  Check,
  Gauge,
  Gem,
  KeyRound,
  LoaderCircle,
  Moon,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE ACCOUNT CHAMBER — plan, credits, usage, ledger, security and   */
/*  the developer keys, all in one honest room. Nothing is pretended:  */
/*  when Stripe or a messenger rests unconfigured, the chamber says    */
/*  so instead of faking a button that cannot work.                    */
/* ------------------------------------------------------------------ */

interface Summary {
  user: { email: string; name: string | null; image?: string | null; emailVerified: boolean; createdAt: string | null };
  admin?: boolean;
  wallet?: { planTier: string; free: number; paid: number; deposit?: number; depositSource?: string | null; total: number } | null;
  plan: {
    id: string;
    label: string;
    priceCents: number;
    features: string[];
    monthlyCredits: number;
    status: string;
    cancelAtPeriodEnd: boolean;
    renewsAt: string | null;
    stripeConfigured: boolean;
  };
  credits: { balance: number | null; monthlyGrant: number; enforced: boolean };
  usage: {
    events30d: number;
    credits30d: number;
    byOperation: { operation: string; count: number; credits: number }[];
  };
  transactions: { id: string; amount: number; type: string; description: string; createdAt: string }[];
  libraryCount: number;
  capabilities: { stripe: boolean; stripeWebhook: boolean; mail: boolean; google: boolean; creditsEnforced: boolean; owner?: boolean };
  offers: {
    plans: { id: string; label: string; priceCents: number; monthlyCredits: number; features: string[]; available: boolean }[];
    packs: { id: string; label: string; credits: number; priceCents: number; available: boolean }[];
  };
}

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

const fmtCredits = (n: number) => n.toLocaleString("en-US");
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/* THE MOON PASSES — the subscription doors beside the credit packs.
   THE SAME SHAPES THE PURSE KEEPER WEARS (WalletGuard's own ladder,
   copied word for word): two monthly passes and the once-only pouch,
   each riding /api/billing/checkout with the key its branch reads —
   { plan } for the passes, { pack: "topup" } for the pouch. */
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
    name: "Mirror Pro",
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

export function AccountModal() {
  const t = useT();
  const accountOpen = useMirror((s) => s.accountOpen);
  const closeAccount = useMirror((s) => s.closeAccount);
  const signOut = useMirror((s) => s.signOut);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  /* the packs are the server's own law — read from the wallet glance */
  const packs = useMirror((s) => s.walletPacks) ?? [];

  /* security form */
  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  /* developer keys */
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<KeyRow | null>(null);
  const [revokePw, setRevokePw] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/summary");
      const data = (await res.json().catch(() => null)) as Summary | null;
      if (data?.user) setSummary(data);
      else if (res.status === 401) setSummary(null);
      /* THE STALE FACE — a resting vault (5xx / network breath) is a
         retry state, never a verdict: the last known summary stays,
         only an honest "signed out" clears the room. */
    } catch {
      /* the glance keeps its silence — the face stays as it was */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/account/keys");
      const data = (await res.json().catch(() => null)) as { keys?: KeyRow[] } | null;
      setKeys(data?.keys ?? []);
    } catch {
      setKeys([]);
    }
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    setNotice(null);
    setPwMsg(null);
    setFreshSecret(null);
    void load();
    void loadKeys();
    /* the purse read fresh — the packs and the coins answer truly */
    void useMirror.getState().refreshWallet();
  }, [accountOpen, load, loadKeys]);

  if (!accountOpen) return null;

  const plan = summary?.plan;

  /* THE ONE PURSE — the legacy workspace ledger (a phantom 10,000
     nothing spends) is never shown beside the real wallet again. */

  const billingCall = async (body: Record<string, string>, label: string) => {
    setBusy(label);
    setNotice(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(data?.error ?? "Something went wrong. Please try again.");
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const portalCall = async () => {
    setBusy("portal");
    setNotice(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const resendVerification = async () => {
    setBusy("verify");
    setNotice(null);
    try {
      const res = await fetch("/api/auth/verify/resend", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      setNotice(data?.message ?? data?.error ?? "The letter rests for now.");
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async () => {
    setBusy("pw");
    setPwMsg(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: nextPw }),
      });
      const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      setPwMsg(data?.message ?? data?.error ?? null);
      if (res.ok) {
        setCurrentPw("");
        setNextPw("");
      }
    } finally {
      setBusy(null);
    }
  };

  const createKey = async () => {
    setBusy("key");
    setNotice(null);
    try {
      const res = await fetch("/api/account/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Untitled key" }),
      });
      const data = (await res.json().catch(() => null)) as { secret?: string; message?: string; error?: string } | null;
      if (res.ok && data?.secret) {
        setFreshSecret(data.secret);
        setSecretCopied(false);
        setNewKeyName("");
        void loadKeys();
      } else {
        setNotice(data?.error ?? "The key could not be carved.");
      }
    } finally {
      setBusy(null);
    }
  };

  const revokeKey = async () => {
    if (!revokeTarget) return;
    setBusy("revoke");
    setNotice(null);
    try {
      const res = await fetch("/api/account/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: revokeTarget.id, password: revokePw }),
      });
      const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (res.ok) {
        setRevokeTarget(null);
        setRevokePw("");
        void loadKeys();
      } else {
        setNotice(data?.error ?? "The revocation failed.");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <ModalShell
      open={accountOpen}
      onOpenChange={(v) => {
        if (!v) closeAccount();
      }}
      title={t("Account & Credits")}
      description={t("Your chamber — plan, credits, usage, keys and security, all in one place.")}
      widthClass="sm:max-w-[560px]"
    >
      <div className="max-h-[70vh] overflow-y-auto scroll-smooth px-5 pb-5 sm:px-6 nice-scroll">
        {/* the chamber's shape arriving — skeleton panels that mirror
            the sections to come, instead of a lone turning wheel */}
        {loading && !summary ? (
          <div className="space-y-4 py-1" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="mt-3 h-4 w-36" />
                <Skeleton className="mt-2 h-3 w-52 max-w-full" />
              </div>
            ))}
          </div>
        ) : !summary ? (
          <div className="py-10 text-center text-[14px] text-muted-foreground">
            {t("Sign in first — the chamber opens to a named passage.")}
          </div>
        ) : (
          <div className="space-y-4">
            {notice && (
              <div
                role="status"
                className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-4 py-3 text-[13.5px] leading-relaxed text-foreground/85"
              >
                {t(notice)}
              </div>
            )}

            {/* -------- the keeper's own face --------
                the Google picture when the passage carries one, the
                name's first light when it does not — the chamber opens
                by naming whom it belongs to */}
            <section aria-label={t("Identity")} className="flex items-center gap-3.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              {summary.user.image ? (
                /* the provider's own url — no optimization needed */
                <img
                  src={summary.user.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="size-12 shrink-0 rounded-2xl object-cover"
                  data-testid="account-avatar"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="mono-label flex size-12 shrink-0 items-center justify-center rounded-2xl text-[20px] text-foreground/90"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--scope-a, var(--gd)) 40%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--scope-a, var(--gd)) 9%, var(--glass-bg))",
                  }}
                >
                  {(summary.user.name || summary.user.email).slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="ink-title truncate text-[16px] font-semibold leading-tight text-foreground/95">
                  {summary.user.name || summary.user.email.split("@")[0]}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{summary.user.email}</p>
              </div>
            </section>

            {/* -------- the plan -------- */}
            <section aria-label={t("Plan")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Plan")}</p>
                  <p className="mt-1 text-[17px] font-medium text-foreground/90">
                    {plan?.label ?? "Free"}
                    <span className="ml-2 text-[13px] text-muted-foreground">
                      {plan && plan.priceCents > 0 ? `$${(plan.priceCents / 100).toFixed(0)}/${t("mo")}` : t("Free forever — every world open")}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {summary.capabilities.stripe ? (
                    <button
                      type="button"
                      onClick={() => void portalCall()}
                      disabled={busy === "portal"}
                      className="focus-glow rounded-full border hairline px-3.5 py-1.5 text-[13px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                    >
                      {t("Manage billing")}
                    </button>
                  ) : (
                    <span className="mono-label flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      <Gem className="size-3" aria-hidden="true" />
                      Stripe
                    </span>
                  )}
                </div>
              </div>
              {plan?.renewsAt && plan.priceCents > 0 && (
                <p className="mt-2 text-[13px] text-muted-foreground">
                  {t("Renews")}: {fmtDate(plan.renewsAt)}
                </p>
              )}
            </section>

            {/* -------- the coins — the passage's own purse --------
                THE ONLY BALANCE IN THIS ROOM: the wallet the whole
                house reads by. The legacy workspace ledger is gone. */}
            {summary.wallet && (
              <section aria-label={t("Your coins")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4" data-testid="account-coins">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Your coins")}</p>
                    <p className="mt-1 text-[23px] font-semibold tracking-tight text-foreground/95" data-testid="account-coin-total">
                      {fmtCredits(summary.wallet.total)}
                      <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">{t("coins")}</span>
                    </p>
                    <p className="mono-label mt-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      {t("{free} free · {paid} paid — the free light is spent first", {
                        free: fmtCredits(summary.wallet.free),
                        paid: fmtCredits(summary.wallet.paid),
                      })}
                    </p>
                    {(summary.wallet.deposit ?? 0) > 0 && (
                      <p
                        className="mono-label mt-1.5 text-[9px] uppercase tracking-[0.14em]"
                        style={{ color: "var(--cy)" }}
                        data-testid="account-deposit"
                      >
                        {t(
                          "The great deposit — {n} reflection pulses on deposit ({source})",
                          {
                            n: fmtCredits(summary.wallet.deposit ?? 0),
                            source:
                              summary.wallet.depositSource === "zai_api_accumulation"
                                ? t("borrowed from the z.ai accumulation")
                                : (summary.wallet.depositSource ?? ""),
                          }
                        )}
                      </p>
                    )}
                  </div>
                  <span
                    className="mono-label shrink-0 rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em]"
                    style={{
                      borderColor: "color-mix(in srgb, var(--cy) 35%, transparent)",
                      color: "var(--cy)",
                    }}
                  >
                    {summary.wallet.planTier}
                  </span>
                </div>
                {/* THE CREDIT PACKS — the creator economy's own filling:
                    the server's own law (100 · 250 · 700 lights, one purse
                    across music, books and the akashic readings), read
                    fresh from the wallet glance. The checkout rides the
                    pack's own key — { pack: id } — and the signed webhook
                    stays the only hand that fills the purse. */}
                <div className="mt-3 space-y-1.5 border-t hairline pt-3">
                  <p className="mono-label px-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {t("Fill the purse — light held until spent")}
                  </p>
                  {packs.map((p) => (
                    <div
                      key={p.id}
                      data-testid={`account-pack-${p.id}`}
                      className="flex items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg)] p-3 transition-colors hover:border-[var(--hairline-hover)]"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline bg-[var(--glass-bg-soft)]">
                        <ShoppingBag className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-foreground/90">
                          {p.credits} {t("lights")}
                          <span className="ml-2 text-[13px] font-normal text-muted-foreground">
                            €{(p.priceCents / 100).toFixed(0)}
                          </span>
                        </p>
                        <p className="truncate text-[12.5px] text-muted-foreground">{t(p.note)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void billingCall({ pack: p.id }, p.id)}
                        disabled={busy !== null}
                        className="focus-glow shrink-0 rounded-full border hairline px-3.5 py-1.5 text-[13px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                      >
                        {busy === p.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          t("Choose")
                        )}
                      </button>
                    </div>
                  ))}
                  {packs.length === 0 && (
                    <p className="px-1 text-[13px] text-muted-foreground">
                      {t("The packs are being laid out — a moment.")}
                    </p>
                  )}
                </div>

                {/* THE MOON PASSES — the subscriptions beside the packs,
                    the same shapes and prices the purse keeper wears:
                    { plan: "SEEKER" | "OBSERVATORY_PRO" } for the passes,
                    { pack: "topup" } for the once-only pouch. */}
                <div className="mt-3 space-y-1.5">
                  <p className="mono-label px-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {t("Moon passes — light that arrives every month")}
                  </p>
                  {PASSES.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div
                        key={p.id}
                        data-testid={`account-pass-${p.id}`}
                        className="flex items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg)] p-3 transition-colors hover:border-[var(--hairline-hover)]"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline bg-[var(--glass-bg-soft)]">
                          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-foreground/90">
                            {p.name}
                            <span className="ml-2 text-[13px] font-normal text-muted-foreground">
                              {p.price} {t(p.cadence)}
                            </span>
                          </p>
                          <p className="truncate text-[12.5px] text-muted-foreground">
                            {t(p.credits)} · {t(p.note)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void billingCall(
                              p.plan ? { plan: p.plan } : { pack: p.id },
                              p.id
                            )
                          }
                          disabled={busy !== null}
                          className="focus-glow shrink-0 rounded-full border hairline px-3.5 py-1.5 text-[13px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                        >
                          {busy === p.id ? (
                            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            t("Choose")
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 flex items-start gap-1.5 px-1 text-[12px] leading-relaxed text-muted-foreground/80">
                  <Sparkles className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                  {t(
                    "One purse for every creation — a music preview 2 · a full song 5 · the endless journey 15 · an akashic reading 5 · a short book 15 · an extended book 40."
                  )}
                </p>
              </section>
            )}

            {/* -------- the usage -------- */}
            <section aria-label={t("Usage this month")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-center justify-between">
                <p className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Usage this month")}</p>
                <p className="text-[12.5px] text-muted-foreground">
                  {fmtCredits(summary.usage.events30d)} {t("operations")} · {fmtCredits(summary.usage.credits30d)} {t("credits used")}
                </p>
              </div>
              {summary.usage.byOperation.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {summary.usage.byOperation.slice(0, 5).map((op) => (
                    <li key={op.operation} className="flex items-center gap-2.5 text-[13px]">
                      <span className="w-28 shrink-0 truncate text-foreground/80">{op.operation}</span>
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--glass-bg)]">
                        <span
                          className="block h-full rounded-full bg-[var(--cy)]/60"
                          style={{ width: `${Math.min(100, (op.count / Math.max(1, summary.usage.byOperation[0].count)) * 100)}%` }}
                        />
                      </span>
                      <span className="w-8 shrink-0 text-right text-muted-foreground">{op.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-muted-foreground">{t("The registers rest — no passages woven yet.")}</p>
              )}
            </section>

            {/* THE LEDGER'S TRUTH HAS MOVED HOME — the legacy
                CreditTransaction rows are gone with the old economy; the
                purse's own book of movements (CreditLedger, the server's
                law) now lives in the profile's Transactions room, read
                from /api/wallet/ledger. */}

            {/* -------- the owner's own hand (complimentary mode) -------- */}
            {summary.capabilities.owner && <OwnerPanel />}

            {/* -------- security -------- */}
            <section aria-label={t("Security")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Security")}</p>
                <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                  {summary.user.emailVerified ? (
                    <>
                      <BadgeCheck className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
                      {t("Email verified")}
                    </>
                  ) : (
                    <>
                      <BadgeMinus className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
                      {!summary.capabilities.mail ? (
                        t("Email not verified")
                      ) : (
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void resendVerification()}
                            disabled={busy === "verify"}
                            className="focus-glow underline decoration-dotted underline-offset-2 hover:text-foreground disabled:opacity-50"
                          >
                            {t("Resend verification letter")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              closeAccount();
                              useMirror.getState().openAuth("check");
                            }}
                            data-testid="account-verify-now"
                            className="focus-glow rounded-full border hairline px-2.5 py-0.5 text-[11.5px] text-foreground/80 transition-colors hover:border-[rgba(232,217,176,0.5)] hover:text-foreground"
                          >
                            {t("Verify now")}
                          </button>
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder={t("Current password")}
                  autoComplete="current-password"
                  className="focus-glow h-10 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[14px] text-foreground/90 placeholder:text-muted-foreground/60"
                />
                <input
                  type="password"
                  value={nextPw}
                  onChange={(e) => setNextPw(e.target.value)}
                  placeholder={t("New password")}
                  autoComplete="new-password"
                  className="focus-glow h-10 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[14px] text-foreground/90 placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => void changePassword()}
                  disabled={busy === "pw" || nextPw.length < 8}
                  className="focus-glow h-10 rounded-xl border hairline px-4 text-[13.5px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                >
                  {busy === "pw" ? "…" : t("Update password")}
                </button>
              </div>
              {pwMsg && <p className="mt-2 text-[13px] text-muted-foreground">{t(pwMsg)}</p>}
            </section>

            {/* -------- developer keys -------- */}
            <section aria-label={t("API keys")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="mono-label flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                  <KeyRound className="size-3" aria-hidden="true" />
                  {t("API keys")}
                </p>
                <span className="mono-label text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">POST /api/v1/chat</span>
              </div>

              {freshSecret && (
                <div className="mt-3 rounded-xl border border-[var(--cy)]/30 bg-[var(--glass-bg)] p-3">
                  <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--cy)]">
                    <Sparkles className="size-3 shrink-0" aria-hidden="true" />
                    {t("Copy this key now — it will never be shown again.")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-background/40 px-2.5 py-2 text-[12.5px] text-foreground/90" data-testid="fresh-api-secret">
                      {freshSecret}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(freshSecret);
                        setSecretCopied(true);
                      }}
                      className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-lg border hairline text-foreground/85 transition-all hover:border-[var(--hairline-hover)]"
                      aria-label="Copy API key"
                    >
                      {secretCopied ? <Check className="size-3.5 text-[var(--cy)]" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder={t("Name your key")}
                  maxLength={60}
                  className="focus-glow h-9 min-w-0 flex-1 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[13.5px] text-foreground/90 placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => void createKey()}
                  disabled={busy === "key"}
                  className="focus-glow flex h-9 shrink-0 items-center gap-1.5 rounded-xl border hairline px-3 text-[13px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {t("Create key")}
                </button>
              </div>

              {keys.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {keys.map((k) => (
                    <li key={k.id} className="flex items-center gap-2.5 rounded-lg bg-[var(--glass-bg)] px-3 py-2 text-[13px]">
                      <code className="shrink-0 text-[12px] text-muted-foreground">{k.prefix}…</code>
                      <span className="min-w-0 flex-1 truncate text-foreground/85">{k.name}</span>
                      <span className="hidden shrink-0 text-[11.5px] text-muted-foreground sm:block">
                        {k.revokedAt
                          ? t("Revoked")
                          : k.lastUsedAt
                            ? `${t("Last used")} ${fmtDate(k.lastUsedAt)}`
                            : `${t("Created")} ${fmtDate(k.createdAt)}`}
                      </span>
                      {!k.revokedAt && (
                        <button
                          type="button"
                          onClick={() => {
                            setRevokeTarget(k);
                            setRevokePw("");
                          }}
                          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all hover:text-foreground"
                          aria-label={`${t("Revoke")} ${k.name}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2.5 text-[13px] text-muted-foreground">{t("No keys yet — create one to reach the public sky.")}</p>
              )}

              {revokeTarget && (
                <div className="mt-3 rounded-xl border hairline bg-[var(--glass-bg)] p-3">
                  <p className="text-[13px] text-foreground/85">
                    {t("Confirm with your password")} — <span className="text-muted-foreground">{revokeTarget.name}</span>
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="password"
                      value={revokePw}
                      onChange={(e) => setRevokePw(e.target.value)}
                      autoComplete="current-password"
                      className="focus-glow h-9 min-w-0 flex-1 rounded-xl border hairline bg-background/30 px-3 text-[13.5px]"
                    />
                    <button
                      type="button"
                      onClick={() => void revokeKey()}
                      disabled={busy === "revoke" || !revokePw}
                      className="focus-glow h-9 shrink-0 rounded-xl border hairline px-3 text-[13px] text-foreground/90 disabled:opacity-50"
                    >
                      {t("Revoke")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(null)}
                      aria-label={t("Close")}
                      className="focus-glow h-9 shrink-0 rounded-xl px-2 text-[13px] text-muted-foreground"
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* -------- leave -------- */}
            <button
              type="button"
              onClick={() => void signOut()}
              className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border hairline px-4 py-2.5 text-[13.5px] text-muted-foreground transition-all hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {t("Leave the passage")}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  THE OWNER'S OWN HAND — the complimentary mode's controls, visible  */
/*  only when the signed passage is the keeper's own (ADMIN_EMAIL in   */
/*  the vault). Turn the FREE door on and off, choose which packages   */
/*  it serves, set the daily eligibility ceiling, and read the two     */
/*  transaction books side by side — complimentary and paid, never     */
/*  mixed. Every switch is turned server-side; this panel only speaks  */
/*  to /api/admin/complimentary, which answers to the keeper alone.    */
/* ------------------------------------------------------------------ */

const FREE_PACKAGE_OPTIONS = [
  { id: "SEEKER", label: "Seeker" },
  { id: "OBSERVATORY_PRO", label: "Mirror Pro" },
  { id: "topup", label: "A pouch of light" },
  { id: "pack_100", label: "One hundred lights" },
  { id: "pack_250", label: "Two hundred fifty lights" },
  { id: "pack_700", label: "Seven hundred lights" },
] as const;

interface AdminState {
  config: {
    openAccessMode: boolean;
    complimentaryCheckout: boolean;
    credinsEnabled: boolean;
    packages: string[];
    allocations: Record<string, number>;
    dailyLimit: number;
  };
  counts: { type: string; count: number }[];
  transactions: {
    complimentary: { id: string; userId: string; amountCents: number; status: string; description: { package?: string; creditsGranted?: number; originalPackageValue?: string } | null; createdAt: string }[];
    paid: { id: string; type: string; amountCents: number; status: string; createdAt: string }[];
  };
}

function OwnerPanel() {
  const t = useT();
  const [state, setState] = useState<AdminState | null>(null);
  const [packages, setPackages] = useState<string[]>([]);
  const [alloc, setAlloc] = useState<Record<string, string>>({});
  const [dailyLimit, setDailyLimit] = useState("5");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/complimentary");
      if (!res.ok) return;
      const data = (await res.json()) as AdminState;
      setState(data);
      setPackages(data.config.packages);
      setAlloc(Object.fromEntries(Object.entries(data.config.allocations).map(([k, v]) => [k, String(v)])));
      setDailyLimit(String(data.config.dailyLimit));
    } catch {
      /* the panel rests quiet when the vault's hand is absent */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/complimentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setMsg(res.ok ? t("The switches are turned.") : (data?.error ?? t("The switches could not be turned.")));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const saveAllocations = () => {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(alloc)) {
      const n = Number(v);
      if (v.trim() !== "" && Number.isFinite(n) && n >= 0) clean[k] = Math.floor(n);
    }
    void save({ allocations: clean, dailyLimit: Math.max(1, Number(dailyLimit) || 5) });
  };

  if (!state) return null;
  const cfg = state.config;
  const compCount = state.counts.find((c) => c.type === "complimentary")?.count ?? 0;

  return (
    <section
      aria-label={t("The owner's hand — complimentary mode")}
      data-testid="owner-panel"
      className="rounded-xl border border-[color-mix(in_srgb,#a78bfa_35%,transparent)] bg-[color-mix(in_srgb,#a78bfa_5%,var(--glass-bg-soft))] p-4"
    >
      <p className="mono-label flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
        <ShieldCheck className="size-3 text-[#a78bfa]" aria-hidden="true" />
        {t("The owner's hand — complimentary mode")}
      </p>

      <div className="mt-3 space-y-2.5">
        <label className="flex items-center justify-between gap-3 text-[13px] text-foreground/90">
          {t("Complimentary checkout (the FREE door)")}
          <button
            type="button"
            role="switch"
            aria-checked={cfg.complimentaryCheckout}
            disabled={busy}
            data-testid="owner-toggle-complimentary"
            onClick={() => void save({ complimentaryCheckout: !cfg.complimentaryCheckout })}
            className={cn(
              "focus-glow relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50",
              cfg.complimentaryCheckout ? "border-[#a78bfa] bg-[color-mix(in_srgb,#a78bfa_35%,transparent)]" : "hairline bg-[var(--glass-bg)]"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-foreground/80 transition-all",
                cfg.complimentaryCheckout ? "left-[22px]" : "left-0.5"
              )}
              aria-hidden="true"
            />
          </button>
        </label>

        <label className="flex items-center justify-between gap-3 text-[13px] text-foreground/90">
          {t("Open access mode (everything grants freely)")}
          <button
            type="button"
            role="switch"
            aria-checked={cfg.openAccessMode}
            disabled={busy}
            onClick={() => void save({ openAccessMode: !cfg.openAccessMode })}
            className={cn(
              "focus-glow relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50",
              cfg.openAccessMode ? "border-[#a78bfa] bg-[color-mix(in_srgb,#a78bfa_35%,transparent)]" : "hairline bg-[var(--glass-bg)]"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-foreground/80 transition-all",
                cfg.openAccessMode ? "left-[22px]" : "left-0.5"
              )}
              aria-hidden="true"
            />
          </button>
        </label>

        <p className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          {t("CredIns bank gateway (announced)")}
          <span className="mono-label rounded-full border hairline px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]">
            {cfg.credinsEnabled ? "ENABLED" : "OFF"}
          </span>
        </p>

        <div>
          <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Packages the FREE door serves")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {FREE_PACKAGE_OPTIONS.map((p) => {
              const on = packages.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  disabled={busy}
                  onClick={() => setPackages((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]))}
                  className={cn(
                    "focus-glow rounded-full border px-3 py-1 text-[12px] transition-colors disabled:opacity-50",
                    on
                      ? "border-[#a78bfa] text-[#a78bfa]"
                      : "hairline text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(p.label)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {FREE_PACKAGE_OPTIONS.map((p) => (
            <label key={`alloc-${p.id}`} className="min-w-[110px] flex-1">
              <span className="mono-label block text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
                {t(p.label)}
              </span>
              <input
                inputMode="numeric"
                placeholder={t("normal allocation")}
                value={alloc[p.id] ?? ""}
                onChange={(e) => setAlloc((cur) => ({ ...cur, [p.id]: e.target.value.replace(/\D/g, "") }))}
                className="focus-glow mt-1 h-9 w-full rounded-xl border hairline bg-[var(--glass-bg)] px-2.5 text-[13px] text-foreground/90 placeholder:text-muted-foreground/50"
              />
            </label>
          ))}
          <label className="min-w-[110px] flex-1">
            <span className="mono-label block text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("Daily limit per user")}
            </span>
            <input
              inputMode="numeric"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value.replace(/\D/g, ""))}
              className="focus-glow mt-1 h-9 w-full rounded-xl border hairline bg-[var(--glass-bg)] px-2.5 text-[13px] text-foreground/90"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveAllocations}
            disabled={busy}
            data-testid="owner-save-allocations"
            className="focus-glow h-9 rounded-xl border border-[color-mix(in_srgb,#a78bfa_45%,transparent)] px-4 text-[12.5px] text-foreground/90 transition-all hover:bg-[color-mix(in_srgb,#a78bfa_10%,transparent)] disabled:opacity-50"
          >
            {busy ? "…" : t("Save allocations & limits")}
          </button>
          {packages.join(",") !== cfg.packages.join(",") && (
            <button
              type="button"
              onClick={() => void save({ packages })}
              disabled={busy}
              className="focus-glow h-9 rounded-xl border border-[color-mix(in_srgb,#a78bfa_45%,transparent)] px-4 text-[12.5px] text-foreground/90 transition-all hover:bg-[color-mix(in_srgb,#a78bfa_10%,transparent)] disabled:opacity-50"
            >
              {t("Save package selection")}
            </button>
          )}
        </div>
        {msg && <p className="text-[12.5px] text-muted-foreground">{msg}</p>}

        {/* the two books, side by side — complimentary never reads as paid */}
        <div className="grid gap-2 pt-1 sm:grid-cols-2">
          <div className="rounded-xl border hairline bg-[var(--glass-bg)] p-3">
            <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("Complimentary transactions")} · {compCount}
            </p>
            <div className="nice-scroll mt-1.5 max-h-36 space-y-1.5 overflow-y-auto">
              {state.transactions.complimentary.length === 0 && (
                <p className="text-[12px] text-muted-foreground/70">{t("None yet.")}</p>
              )}
              {state.transactions.complimentary.slice(0, 8).map((tx) => (
                <p key={tx.id} className="text-[12px] leading-snug text-muted-foreground">
                  <span className="text-foreground/85">{tx.description?.package ?? "—"}</span>
                  {" · "}
                  {tx.description?.creditsGranted ?? 0} {t("lights")}
                  {" · "}
                  <span className="uppercase">{tx.status}</span>
                  {" · "}
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-xl border hairline bg-[var(--glass-bg)] p-3">
            <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("Paid transactions")}
            </p>
            <div className="nice-scroll mt-1.5 max-h-36 space-y-1.5 overflow-y-auto">
              {state.transactions.paid.length === 0 && (
                <p className="text-[12px] text-muted-foreground/70">{t("None yet.")}</p>
              )}
              {state.transactions.paid.slice(0, 8).map((tx) => (
                <p key={tx.id} className="text-[12px] leading-snug text-muted-foreground">
                  <span className="text-foreground/85">{tx.type}</span>
                  {" · "}
                  {(tx.amountCents / 100).toFixed(2)}
                  {" · "}
                  <span className="uppercase">{tx.status}</span>
                  {" · "}
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

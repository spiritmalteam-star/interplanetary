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
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ModalShell } from "./ModalShell";

/* ------------------------------------------------------------------ */
/*  THE ACCOUNT CHAMBER — plan, credits, usage, ledger, security and   */
/*  the developer keys, all in one honest room. Nothing is pretended:  */
/*  when Stripe or a messenger rests unconfigured, the chamber says    */
/*  so instead of faking a button that cannot work.                    */
/* ------------------------------------------------------------------ */

interface Summary {
  user: { email: string; name: string | null; emailVerified: boolean; createdAt: string | null };
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
  capabilities: { stripe: boolean; stripeWebhook: boolean; mail: boolean; google: boolean; creditsEnforced: boolean };
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

export function AccountModal() {
  const t = useT();
  const accountOpen = useMirror((s) => s.accountOpen);
  const closeAccount = useMirror((s) => s.closeAccount);
  const signOut = useMirror((s) => s.signOut);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

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
      else setSummary(null);
    } catch {
      setSummary(null);
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
  }, [accountOpen, load, loadKeys]);

  if (!accountOpen) return null;

  const plan = summary?.plan;
  const credits = summary?.credits;
  const grant = credits?.monthlyGrant || plan?.monthlyCredits || 1;
  const balance = credits?.balance;
  const usedPct = balance != null ? Math.max(0, Math.min(100, ((grant - balance) / grant) * 100)) : 0;

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
        {loading && !summary ? (
          <div className="py-10 text-center">
            <RefreshCw className="mx-auto size-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : !summary ? (
          <div className="py-10 text-center text-[13px] text-muted-foreground">
            {t("Sign in first — the chamber opens to a named passage.")}
          </div>
        ) : (
          <div className="space-y-4">
            {notice && (
              <div
                role="status"
                className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-4 py-3 text-[12.5px] leading-relaxed text-foreground/85"
              >
                {notice}
              </div>
            )}

            {/* -------- the plan -------- */}
            <section aria-label={t("Plan")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Plan")}</p>
                  <p className="mt-1 text-[16px] font-medium text-foreground/90">
                    {plan?.label ?? "Free"}
                    <span className="ml-2 text-[12px] text-muted-foreground">
                      {plan && plan.priceCents > 0 ? `$${(plan.priceCents / 100).toFixed(0)}/${t("mo")}` : t("Free forever — every world open")}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {summary.capabilities.stripe ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void billingCall({ plan: "PRO" }, "upgrade")}
                        disabled={busy === "upgrade"}
                        className="focus-glow rounded-full border hairline px-3.5 py-1.5 text-[12px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                      >
                        {t("Upgrade")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void portalCall()}
                        disabled={busy === "portal"}
                        className="focus-glow rounded-full border hairline px-3.5 py-1.5 text-[12px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                      >
                        {t("Manage billing")}
                      </button>
                    </>
                  ) : (
                    <span className="mono-label flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      <Gem className="size-3" aria-hidden="true" />
                      Stripe
                    </span>
                  )}
                </div>
              </div>
              {plan?.renewsAt && (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  {t("Renews")}: {fmtDate(plan.renewsAt)}
                </p>
              )}
            </section>

            {/* -------- the credits -------- */}
            <section aria-label={t("Credits")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Credits")}</p>
                  <p className="mt-1 text-[22px] font-semibold tracking-tight text-foreground/95" data-testid="account-credit-balance">
                    {balance != null ? fmtCredits(balance) : "—"}
                    <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">/ {fmtCredits(grant)}</span>
                  </p>
                </div>
                {summary.capabilities.stripe && (
                  <button
                    type="button"
                    onClick={() => void billingCall({ pack: "pack_10k" }, "pack")}
                    disabled={busy === "pack"}
                    className="focus-glow rounded-full border hairline px-3.5 py-1.5 text-[12px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                  >
                    {t("Buy credits")}
                  </button>
                )}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--glass-bg)]" role="progressbar" aria-valuenow={Math.round(usedPct)} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--cy)] via-[var(--mg)] to-[var(--pk)] transition-all duration-700"
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <Gauge className="size-3 shrink-0" aria-hidden="true" />
                {credits?.enforced
                  ? t("Every passage is weighed by the server — never by the browser.")
                  : t("The ledger records everything — nothing is charged while the free law stands.")}
              </p>
            </section>

            {/* -------- the usage -------- */}
            <section aria-label={t("Usage this month")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-center justify-between">
                <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Usage this month")}</p>
                <p className="text-[11.5px] text-muted-foreground">
                  {fmtCredits(summary.usage.events30d)} {t("operations")} · {fmtCredits(summary.usage.credits30d)} {t("credits used")}
                </p>
              </div>
              {summary.usage.byOperation.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {summary.usage.byOperation.slice(0, 5).map((op) => (
                    <li key={op.operation} className="flex items-center gap-2.5 text-[12px]">
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
                <p className="mt-2 text-[12px] text-muted-foreground">{t("The registers rest — no passages woven yet.")}</p>
              )}
            </section>

            {/* -------- the ledger -------- */}
            {summary.transactions.length > 0 && (
              <section aria-label={t("Recent ledger")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
                <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Recent ledger")}</p>
                <ul className="mt-2.5 max-h-36 space-y-1.5 overflow-y-auto nice-scroll">
                  {summary.transactions.map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between gap-3 text-[12px]">
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{tx.description}</span>
                      <span className={`shrink-0 tabular-nums ${tx.amount >= 0 ? "text-[var(--cy)]" : "text-foreground/70"}`}>
                        {tx.amount >= 0 ? "+" : "−"}{fmtCredits(Math.abs(tx.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* -------- security -------- */}
            <section aria-label={t("Security")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">{t("Security")}</p>
                <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
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
                        <button
                          type="button"
                          onClick={() => void resendVerification()}
                          disabled={busy === "verify"}
                          className="focus-glow underline decoration-dotted underline-offset-2 hover:text-foreground disabled:opacity-50"
                        >
                          {t("Resend verification letter")}
                        </button>
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
                  className="focus-glow h-10 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[13px] text-foreground/90 placeholder:text-muted-foreground/60"
                />
                <input
                  type="password"
                  value={nextPw}
                  onChange={(e) => setNextPw(e.target.value)}
                  placeholder={t("New password")}
                  autoComplete="new-password"
                  className="focus-glow h-10 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[13px] text-foreground/90 placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => void changePassword()}
                  disabled={busy === "pw" || nextPw.length < 8}
                  className="focus-glow h-10 rounded-xl border hairline px-4 text-[12.5px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                >
                  {busy === "pw" ? "…" : t("Update password")}
                </button>
              </div>
              {pwMsg && <p className="mt-2 text-[12px] text-muted-foreground">{pwMsg}</p>}
            </section>

            {/* -------- developer keys -------- */}
            <section aria-label={t("API keys")} className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="mono-label flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">
                  <KeyRound className="size-3" aria-hidden="true" />
                  {t("API keys")}
                </p>
                <span className="mono-label text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">POST /api/v1/chat</span>
              </div>

              {freshSecret && (
                <div className="mt-3 rounded-xl border border-[var(--cy)]/30 bg-[var(--glass-bg)] p-3">
                  <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--cy)]">
                    <Sparkles className="size-3 shrink-0" aria-hidden="true" />
                    {t("Copy this key now — it will never be shown again.")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-background/40 px-2.5 py-2 text-[11.5px] text-foreground/90" data-testid="fresh-api-secret">
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
                  className="focus-glow h-9 min-w-0 flex-1 rounded-xl border hairline bg-[var(--glass-bg)] px-3 text-[12.5px] text-foreground/90 placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => void createKey()}
                  disabled={busy === "key"}
                  className="focus-glow flex h-9 shrink-0 items-center gap-1.5 rounded-xl border hairline px-3 text-[12px] text-foreground/90 transition-all hover:border-[var(--hairline-hover)] hover:glow-sm disabled:opacity-50"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {t("Create key")}
                </button>
              </div>

              {keys.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {keys.map((k) => (
                    <li key={k.id} className="flex items-center gap-2.5 rounded-lg bg-[var(--glass-bg)] px-3 py-2 text-[12px]">
                      <code className="shrink-0 text-[11px] text-muted-foreground">{k.prefix}…</code>
                      <span className="min-w-0 flex-1 truncate text-foreground/85">{k.name}</span>
                      <span className="hidden shrink-0 text-[10.5px] text-muted-foreground sm:block">
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
                <p className="mt-2.5 text-[12px] text-muted-foreground">{t("No keys yet — create one to reach the public sky.")}</p>
              )}

              {revokeTarget && (
                <div className="mt-3 rounded-xl border hairline bg-[var(--glass-bg)] p-3">
                  <p className="text-[12px] text-foreground/85">
                    {t("Confirm with your password")} — <span className="text-muted-foreground">{revokeTarget.name}</span>
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="password"
                      value={revokePw}
                      onChange={(e) => setRevokePw(e.target.value)}
                      autoComplete="current-password"
                      className="focus-glow h-9 min-w-0 flex-1 rounded-xl border hairline bg-background/30 px-3 text-[12.5px]"
                    />
                    <button
                      type="button"
                      onClick={() => void revokeKey()}
                      disabled={busy === "revoke" || !revokePw}
                      className="focus-glow h-9 shrink-0 rounded-xl border hairline px-3 text-[12px] text-foreground/90 disabled:opacity-50"
                    >
                      {t("Revoke")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(null)}
                      className="focus-glow h-9 shrink-0 rounded-xl px-2 text-[12px] text-muted-foreground"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* -------- leave -------- */}
            <button
              type="button"
              onClick={() => void signOut()}
              className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border hairline px-4 py-2.5 text-[12.5px] text-muted-foreground transition-all hover:border-[var(--hairline-hover)] hover:text-foreground"
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

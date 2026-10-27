"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  FlaskConical,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  Trash2,
  Vault,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE DEPOSIT DESK — the keeper's well and its sealed cupboard.      */
/*                                                                     */
/*  THE DEPOSIT: the balance every mint pours from, the charge hand    */
/*  (credits enter the well from a stored payment source) and the      */
/*  movement book (last 30, newest first).                             */
/*  PAYMENT SOURCES: added once, stored AES-256-GCM sealed, shown      */
/*  back only as masked hints ("••••1234") — the secrets themselves    */
/*  never leave the server. Activate/pause, test, delete.              */
/*                                                                     */
/*  Lives only inside the fuel desk (the keeper's own room); the       */
/*  server answers 404 to every other hand.                            */
/* ------------------------------------------------------------------ */

interface DepositMovement {
  id: string;
  direction: "in" | "out";
  amount: number;
  sourceName: string | null;
  reference: string | null;
  actorEmail: string | null;
  userId: string | null;
  note: string | null;
  createdAt: string;
}

interface DepositStatus {
  balance: number;
  totalIn: number;
  totalOut: number;
  movements: DepositMovement[];
}

interface SourceRow {
  id: string;
  name: string;
  provider: string;
  active: boolean;
  hint: string;
  lastUsedAt: string | null;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  createdAt: string;
}

const fmt = (n: number) => n.toLocaleString("en-US");

const PROVIDER_LABELS: Record<string, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  manual: "Manual",
  custom: "Custom",
};

/** the credential fields each provider is asked for (custom may add) */
const PROVIDER_FIELDS: Record<string, string[]> = {
  stripe: ["secretKey"],
  paypal: ["clientId", "clientSecret"],
  manual: ["reference"],
  custom: ["key"],
};

const inputCls =
  "focus-glow h-8 rounded-lg border hairline bg-[var(--glass-bg)] px-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50";

const chipBtn =
  "focus-glow flex h-8 items-center gap-1.5 rounded-full border hairline px-3 text-[12px] text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)] disabled:opacity-40";

export function DepositDesk({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useT();
  const [deposit, setDeposit] = useState<DepositStatus | null>(null);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  /* the charge form */
  const [chargeSource, setChargeSource] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeRef, setChargeRef] = useState("");

  /* the add-source form */
  const [adding, setAdding] = useState(false);
  const [srcName, setSrcName] = useState("");
  const [srcProvider, setSrcProvider] = useState("stripe");
  const [srcFields, setSrcFields] = useState<{ key: string; value: string }[]>([
    { key: "secretKey", value: "" },
  ]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/fuel");
      const data = (await res.json().catch(() => null)) as
        | { deposit?: DepositStatus; sources?: SourceRow[] }
        | null;
      if (data?.deposit) setDeposit(data.deposit);
      if (data?.sources) {
        setSources(data.sources);
        setChargeSource((cur) =>
          cur && data.sources?.some((s) => s.id === cur && s.active) ? cur : ""
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  const act = async (
    body: Record<string, unknown>,
    label: string,
    okText?: (data: Record<string, unknown>) => string
  ) => {
    setBusy(label);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (res.ok && data?.ok) {
        if (data.deposit) setDeposit(data.deposit as DepositStatus);
        if (data.source) {
          const row = data.source as SourceRow;
          setSources((cur) => cur.map((s) => (s.id === row.id ? row : s)));
        }
        if (body.action === "source-add" && data.source) {
          setSources((cur) => [data.source as SourceRow, ...cur]);
        }
        if (body.action === "source-delete") {
          setSources((cur) => cur.filter((s) => s.id !== body.sourceId));
        }
        setNotice({ ok: true, text: okText ? okText(data) : t("The well stands.") });
        return true;
      }
      setNotice({
        ok: false,
        text: (data?.error as string) ?? t("The desk stumbled — rest, then try again."),
      });
      return false;
    } catch {
      setNotice({ ok: false, text: t("The desk stumbled — rest, then try again.") });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const activeSources = sources.filter((s) => s.active);

  const chargeTheWell = async () => {
    const amount = Math.floor(Number(chargeAmount));
    if (!chargeSource || !amount) return;
    const done = await act(
      { action: "deposit", sourceId: chargeSource, amount, reference: chargeRef || undefined },
      "charge"
    );
    if (done) {
      setChargeAmount("");
      setChargeRef("");
    }
  };

  const storeSource = async () => {
    const credentials: Record<string, string> = {};
    for (const f of srcFields) {
      const key = f.key.trim();
      if (key && f.value.trim()) credentials[key] = f.value.trim();
    }
    if (!srcName.trim() || Object.keys(credentials).length === 0) return;
    const done = await act(
      { action: "source-add", name: srcName, provider: srcProvider, credentials },
      "add-source"
    );
    if (done) {
      setSrcName("");
      setSrcFields(PROVIDER_FIELDS[srcProvider].map((key) => ({ key, value: "" })));
      setAdding(false);
    }
  };

  const changeProvider = (provider: string) => {
    setSrcProvider(provider);
    setSrcFields(PROVIDER_FIELDS[provider].map((key) => ({ key, value: "" })));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8" aria-busy="true">
        <LoaderCircle className="size-4 animate-spin text-muted-foreground/60" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notice && (
        <div
          role="status"
          className={cn(
            "rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed",
            notice.ok
              ? "border-[color-mix(in_srgb,var(--ok)_35%,transparent)] bg-[color-mix(in_srgb,var(--ok)_7%,var(--background))] text-foreground/90"
              : "border-[color-mix(in_srgb,#f43f5e_32%,transparent)] bg-[color-mix(in_srgb,#f43f5e_6%,var(--background))] text-foreground/90"
          )}
        >
          {notice.text}
        </div>
      )}

      {/* ------------------------ THE DEPOSIT ------------------------ */}
      <section
        aria-label={t("The deposit")}
        className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-4"
        data-testid="deposit-desk"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="mono-label flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <Vault className="size-3.5 text-[var(--lp-gold, #e8d9b0)]" aria-hidden="true" />
            {t("The deposit — the well every credit is poured from")}
          </p>
          <span className="mono-label text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
            {t("in − out = the balance")}
          </span>
        </div>

        {/* the balance cells */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border hairline bg-[var(--glass-bg)] px-3 py-2" data-testid="deposit-balance">
            <p className="font-mono text-[16px] leading-none text-foreground/95">{fmt(deposit?.balance ?? 0)}</p>
            <p className="mono-label mt-1 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">{t("Well balance")}</p>
          </div>
          <div className="rounded-lg border hairline bg-[var(--glass-bg)] px-3 py-2">
            <p className="font-mono text-[16px] leading-none text-[var(--ok)]">+{fmt(deposit?.totalIn ?? 0)}</p>
            <p className="mono-label mt-1 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">{t("Poured in")}</p>
          </div>
          <div className="rounded-lg border hairline bg-[var(--glass-bg)] px-3 py-2">
            <p className="font-mono text-[16px] leading-none text-muted-foreground/85">−{fmt(deposit?.totalOut ?? 0)}</p>
            <p className="mono-label mt-1 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">{t("Minted out")}</p>
          </div>
        </div>

        {/* the charge form */}
        <div className="mt-3 grid gap-2 sm:grid-cols-[1.2fr_0.6fr_1fr_auto]">
          <select
            value={chargeSource}
            onChange={(e) => setChargeSource(e.target.value)}
            aria-label={t("The payment source")}
            data-testid="deposit-source"
            className={cn(inputCls, "w-full")}
          >
            <option value="">{t(activeSources.length ? "Choose a source…" : "No active sources — store one below")}</option>
            {activeSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {PROVIDER_LABELS[s.provider] ?? s.provider}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={chargeAmount}
            onChange={(e) => setChargeAmount(e.target.value)}
            placeholder={t("Lights")}
            aria-label={t("Lights to pour in")}
            data-testid="deposit-amount"
            className={cn(inputCls, "w-full")}
          />
          <input
            type="text"
            value={chargeRef}
            onChange={(e) => setChargeRef(e.target.value)}
            maxLength={200}
            placeholder={t("Reference (a receipt's name)")}
            aria-label={t("Reference")}
            className={cn(inputCls, "w-full")}
          />
          <button
            type="button"
            onClick={() => void chargeTheWell()}
            disabled={busy === "charge" || !chargeSource || !Number(chargeAmount)}
            data-testid="deposit-charge"
            className={cn(chipBtn, "justify-center bg-foreground text-background hover:opacity-85")}
          >
            {busy === "charge" ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-3.5" aria-hidden="true" />
            )}
            {t("Charge the well")}
          </button>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground/70">
          {t(
            "A stripe source records the charge honestly — the self-invoice may follow; manual and custom sources are the keeper's recorded truth."
          )}
        </p>

        {/* the movement book */}
        {deposit && deposit.movements.length > 0 && (
          <div className="mt-3 border-t hairline pt-2.5">
            <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("The well's last movements")}
            </p>
            <ul className="nice-scroll mt-1.5 max-h-48 space-y-1 overflow-y-auto pr-1" data-testid="deposit-movements">
              {deposit.movements.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg bg-[var(--glass-bg)] px-2.5 py-1.5 text-[12px]"
                >
                  <span
                    className={cn(
                      "mono-label w-7 shrink-0 text-center text-[9px] uppercase",
                      m.direction === "in" ? "text-[var(--ok)]" : "text-muted-foreground"
                    )}
                  >
                    {m.direction === "in" ? "+in" : "out"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground/85">
                    {m.sourceName ? `${m.sourceName} · ` : ""}
                    {m.actorEmail ?? m.userId ?? "—"}
                    {m.note ? <span className="text-muted-foreground/75"> — {m.note}</span> : null}
                  </span>
                  <span className="shrink-0 font-mono tabular-nums text-[11.5px] text-muted-foreground">
                    {m.direction === "in" ? "+" : "−"}
                    {fmt(m.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* --------------------- payment sources ----------------------- */}
      <section aria-label={t("Payment sources")} className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="mono-label flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <CreditCard className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {t("Payment sources — sealed at rest")}
          </p>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            data-testid="sources-add-toggle"
            className={cn(chipBtn, "border-dashed")}
            aria-expanded={adding}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t(adding ? "Fold the form" : "Store a source")}
          </button>
        </div>

        {adding && (
          <div className="mt-3 rounded-xl border hairline bg-[var(--glass-bg)] p-3" data-testid="sources-add-form">
            <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
              <input
                type="text"
                value={srcName}
                onChange={(e) => setSrcName(e.target.value)}
                maxLength={80}
                placeholder={t("The source's name (e.g. House Stripe)")}
                aria-label={t("The source's name")}
                className={cn(inputCls, "w-full")}
              />
              <select
                value={srcProvider}
                onChange={(e) => changeProvider(e.target.value)}
                aria-label={t("The provider")}
                className={cn(inputCls, "w-full")}
              >
                {Object.entries(PROVIDER_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 space-y-1.5">
              {srcFields.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={f.key}
                    onChange={(e) =>
                      setSrcFields((cur) => cur.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                    }
                    aria-label={t("Credential name")}
                    placeholder={t("name")}
                    className={cn(inputCls, "w-32 shrink-0 font-mono text-[12px]")}
                  />
                  <input
                    type="password"
                    value={f.value}
                    onChange={(e) =>
                      setSrcFields((cur) => cur.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                    }
                    autoComplete="off"
                    aria-label={t("Credential value — sealed the moment it lands")}
                    placeholder={t("sealed the moment it lands")}
                    className={cn(inputCls, "min-w-0 flex-1 font-mono text-[12px]")}
                  />
                  {srcProvider === "custom" && srcFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSrcFields((cur) => cur.filter((_, j) => j !== i))}
                      aria-label={t("Remove this field")}
                      className="focus-glow flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border hairline text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
              {srcProvider === "custom" && (
                <button
                  type="button"
                  onClick={() => setSrcFields((cur) => [...cur, { key: "", value: "" }])}
                  className={cn(chipBtn, "border-dashed text-[11.5px]")}
                >
                  <Plus className="size-3" aria-hidden="true" />
                  {t("Add a field")}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => void storeSource()}
              disabled={busy === "add-source" || !srcName.trim()}
              data-testid="sources-add-submit"
              className={cn(chipBtn, "mt-2.5 bg-foreground text-background hover:opacity-85")}
            >
              {busy === "add-source" ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Vault className="size-3.5" aria-hidden="true" />
              )}
              {t("Seal and store")}
            </button>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground/70">
              {t(
                "AES-256-GCM at rest — the values are never shown again, never logged, never sent anywhere. Only the masked tail stays visible."
              )}
            </p>
          </div>
        )}

        {/* the sealed list */}
        <div className="mt-3 space-y-1.5" data-testid="sources-list">
          {sources.map((s) => (
            <div key={s.id} className="rounded-lg border hairline bg-[var(--glass-bg)] px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    s.active ? "fuel-live-dot bg-[var(--ok)]" : "bg-muted-foreground/50"
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate text-[13px] text-foreground/90">{s.name}</span>
                <span className="mono-label shrink-0 rounded-full border hairline px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {PROVIDER_LABELS[s.provider] ?? s.provider}
                </span>
                <span className="shrink-0 font-mono text-[12px] text-muted-foreground/80" data-testid={`source-hint-${s.id}`}>
                  {s.hint}
                </span>
                {s.lastTestOk === true && (
                  <span className="mono-label shrink-0 text-[8.5px] uppercase tracking-[0.14em] text-[var(--ok)]">
                    {t("tested")}
                  </span>
                )}
                {s.lastTestOk === false && (
                  <span className="mono-label shrink-0 text-[8.5px] uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--destructive)_75%,var(--foreground))]">
                    {t("failed")}
                  </span>
                )}
                <span className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void act({ action: "source-test", sourceId: s.id }, `test-${s.id}`, (d) => String(d.message ?? ""))}
                    disabled={busy === `test-${s.id}`}
                    aria-label={t("Test the source")}
                    className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all hover:text-foreground disabled:opacity-40"
                  >
                    {busy === `test-${s.id}` ? (
                      <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <FlaskConical className="size-3" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void act({ action: "source-toggle", sourceId: s.id }, `toggle-${s.id}`)}
                    disabled={busy === `toggle-${s.id}`}
                    aria-label={s.active ? t("Pause the source") : t("Wake the source")}
                    className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all hover:text-foreground disabled:opacity-40"
                  >
                    {s.active ? <Pause className="size-3" aria-hidden="true" /> : <Play className="size-3" aria-hidden="true" />}
                  </button>
                  {confirmDelete === s.id ? (
                    <button
                      type="button"
                      onClick={() => void act({ action: "source-delete", sourceId: s.id }, `delete-${s.id}`)}
                      data-testid={`source-delete-confirm-${s.id}`}
                      className="focus-glow h-7 rounded-full border px-2.5 text-[11px] text-[color-mix(in_srgb,var(--destructive)_85%,var(--foreground))] transition-all hover:opacity-85"
                    >
                      {t("Sure?")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(s.id)}
                      aria-label={t("Forget the source")}
                      className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all hover:text-foreground"
                    >
                      <Trash2 className="size-3" aria-hidden="true" />
                    </button>
                  )}
                </span>
              </div>
            </div>
          ))}
          {sources.length === 0 && (
            <p className="px-1 text-[12px] text-muted-foreground/70">
              {t("The cupboard is empty — store the first source and the well can be charged.")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

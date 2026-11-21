"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useMirror, type ToolTabKey } from "@/lib/mirror-store";
import { WORKSPACES } from "@/lib/mirror/workspaces";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE UNIVERSAL MIRROR BRIDGE — one reusable assistant for every     */
/*  page of the book. A small contextual tab stands at the page's      */
/*  own corner; opening it lays down a compact drawer where the        */
/*  Mirror advises on the work at hand.                                */
/*                                                                     */
/*  THE ADVISING LAWS:                                                 */
/*  - Only the necessary context travels: the page hands a typed       */
/*    summary of the work (the circuit, the pattern, the excerpt) —    */
/*    never the visitor's whole session.                               */
/*  - The Mirror advises, never changes: an answer may be CARRIED to   */
/*    the floor (the visitor's own hand sends it in the chat); the     */
/*    workspace itself is never silently altered.                      */
/*  - The bridge's thread is session-breathed: it lives as long as     */
/*    the visit, kept small (the last few exchanges), and is never     */
/*    shipped anywhere on its own.                                     */
/* ------------------------------------------------------------------ */

type BridgeExchange = { q: string; a: string };

function MirrorBridgeImpl({
  workspaceKey,
  buildContext,
}: {
  workspaceKey: ToolTabKey;
  /** the page's own typed context — a compact summary of the work the
      Mirror should see (or null when there is nothing worth carrying) */
  buildContext?: () => string | null;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const composeBridgePrompt = useMirror((s) => s.composeBridgePrompt);
  const meta = WORKSPACES[workspaceKey];

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState<BridgeExchange[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  /* an obsolete ask never outlives the drawer (cancel obsolete fetches) */
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, busy]);

  const ask = useCallback(async () => {
    const question = draft.trim();
    if (!question || busy) return;
    const context = buildContext?.() ?? null;
    const composed = context
      ? `[${t(meta.title)} — ${t("the work at hand")}]\n${context}\n\n${t("Visitor asks")}: ${question}`
      : question;
    setDraft("");
    setBusy(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query: composed,
          mode: meta.bridgeMode,
          language,
          history: thread.slice(-3).map((e) => ({ q: e.q, a: e.a })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { transmission?: string };
      const answer = (data.transmission ?? "").trim();
      if (!answer) throw new Error("empty");
      setThread((p) => [...p.slice(-5), { q: question, a: answer }]);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError(t("The mirror could not answer — try again in a moment."));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }, [buildContext, busy, draft, language, meta.bridgeMode, meta.title, t, thread]);

  const carry = useCallback(
    (text: string) => {
      composeBridgePrompt(text);
      toast(t("Carried to the floor — the chat holds your words."));
      setOpen(false);
    },
    [composeBridgePrompt, t]
  );

  return (
    <>
      {/* THE CONTEXTUAL TAB — the page's own small hand at its corner */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("Ask the Mirror")}
        title={t("Ask the Mirror")}
        data-testid="mirror-bridge-tab"
        className="focus-glow absolute bottom-3 right-3 z-20 flex h-8 items-center gap-1.5 rounded-full border bg-background/95 px-3 text-[11.5px] font-medium shadow-sm transition-colors duration-300 hover:bg-foreground/5"
        style={{
          borderColor:
            "color-mix(in srgb, var(--scope-a,var(--gd)) 38%, transparent)",
          color: "var(--scope-a,var(--gd))",
        }}
      >
        <Sparkles className="size-3.5" aria-hidden="true" />
        {t("Mirror")}
      </button>

      {/* THE COMPACT DRAWER — the advising room, one narrow pane wide */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label={t("Ask the Mirror")}
        data-testid="mirror-bridge-drawer"
        aria-hidden={!open}
        className={cn(
          "absolute inset-y-0 right-0 z-30 flex w-[min(320px,88%)] flex-col border-l bg-background transition-all duration-200",
          open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0"
        )}
        style={{
          borderColor:
            "color-mix(in srgb, var(--scope-a,var(--gd)) 26%, var(--hairline))",
        }}
      >
        <div className="flex h-9 shrink-0 items-center gap-1.5 px-2.5">
          <Sparkles
            className="size-3.5"
            aria-hidden="true"
            style={{ color: "var(--scope-a,var(--gd))" }}
          />
          <span className="mono-label flex-1 text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("The Mirror advises")}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("Close")}
            data-testid="mirror-bridge-close"
            className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <div
          aria-hidden="true"
          className="h-px shrink-0"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent), transparent)",
          }}
        />

        {/* the thread — small, honest, the last few exchanges */}
        <div
          ref={listRef}
          className="nice-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3"
          data-testid="mirror-bridge-thread"
        >
          {thread.length === 0 && !busy ? (
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground/80">
              {t("Ask about the work at hand — the Mirror sees what this room sees, and advises; only your own hand sends anything onward.")}
            </p>
          ) : null}
          {thread.map((e, i) => (
            <div key={i} className="mb-3 flex flex-col gap-1.5">
              <p className="self-end rounded-2xl rounded-br-sm bg-foreground/[0.06] px-3 py-1.5 text-[12.5px] text-foreground/90">
                {e.q}
              </p>
              <div className="flex flex-col gap-1">
                <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/85">
                  {e.a}
                </p>
                <button
                  type="button"
                  onClick={() => carry(e.a)}
                  className="focus-glow self-start rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors duration-300 hover:text-foreground"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                  }}
                >
                  {t("Carry to the floor")}
                </button>
              </div>
            </div>
          ))}
          {busy ? (
            <p
              className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70"
              data-testid="mirror-bridge-busy"
            >
              {t("The Mirror listens…")}
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 text-[12px] text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {/* the ask line — the same quiet round as the house's floor */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
          className="flex shrink-0 items-center gap-1.5 border-t px-2 py-2"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 18%, transparent)",
          }}
        >
          <label htmlFor="mirror-bridge-input" className="sr-only">
            {t("Ask the Mirror")}
          </label>
          <input
            id="mirror-bridge-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("Ask the Mirror…")}
            disabled={busy}
            autoComplete="off"
            data-testid="mirror-bridge-input"
            className="min-w-0 flex-1 rounded-full bg-foreground/[0.04] px-3 py-1.5 text-[12.5px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label={t("Send")}
            data-testid="mirror-bridge-send"
            className="btn-primary focus-glow flex size-7 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Send className="size-3" aria-hidden="true" />
          </button>
        </form>
      </div>
    </>
  );
}

export const MirrorBridge = memo(MirrorBridgeImpl);

"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE PASSAGE — the visitor's door into the laboratory.              */
/*  Email + secret, or the Google passage. The gate form carries the   */
/*  world's own name so the threshold always knows what it opens.      */
/*                                                                     */
/*  Security law: nothing here ever stores the password — only the     */
/*  door (the server) touches it; the answer is a signed httpOnly      */
/*  cookie; the email's existence never leaks through one message.     */
/* ------------------------------------------------------------------ */

const WORLD_COPY: Record<"dreambook" | "quantum" | "evolvemed" | "library", { key: string; line: string }> = {
  dreambook: { key: "Dream Book", line: "The atelier of woven volumes opens with the Crystalline key — sign in, or carve your passage in one breath." },
  quantum: { key: "Quantum World", line: "The quantum narrator receives only those who carry the Crystalline key — sign in, or carve your passage." },
  evolvemed: { key: "Evolve Med", line: "The medical nexus is a keyed facility — the Crystalline key opens it. Sign in, or carve your passage." },
  library: { key: "", line: "Your passage keeps your transmissions in the cosmic library and opens the keyed worlds." },
};

export function AuthModal() {
  const t = useT();
  const authOpen = useMirror((s) => s.authOpen);
  const authMode = useMirror((s) => s.authMode);
  const authWorld = useMirror((s) => s.authWorld);
  const googleConfigured = useMirror((s) => s.googleConfigured);
  const closeAuth = useMirror((s) => s.closeAuth);
  const setMe = useMirror((s) => s.setMe);
  const refreshMe = useMirror((s) => s.refreshMe);

  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authOpen) {
      setTab(authMode === "register" ? "register" : "signin");
      setPassword("");
    }
  }, [authOpen, authMode]);

  if (!authOpen) return null;

  const gate = authMode === "gate";
  const worldCopy = WORLD_COPY[authWorld ?? "library"];

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const endpoint = tab === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          tab === "register" ? { email, password, name } : { email, password }
        ),
      });
      const data = (await res.json().catch(() => null)) as
        | { user?: { email: string; name: string | null; tier: "crystalline" | "light" }; error?: string }
        | null;
      if (!res.ok || !data?.user) {
        toast.error(data?.error ?? t("The passage did not open. Rest, then try again."));
        return;
      }
      setMe(data.user);
      void refreshMe();
      closeAuth();
      toast.success(
        tab === "register"
          ? t("Your passage is carved. The keyed worlds are yours.")
          : t("Welcome back. The keyed worlds remember you.")
      );
      /* a gate that was answered opens its world at once */
      const st = useMirror.getState();
      if (authMode === "gate" && authWorld === "evolvemed") st.openEvolveMed();
      else if (authMode === "gate" && authWorld === "quantum") st.openParticleX();
      else if (authMode === "gate" && authWorld === "dreambook") st.openDreamBook();
      else if (authMode === "gate") st.openLibrary();
    } catch {
      toast.error(t("The passage did not open. Rest, then try again."));
    } finally {
      setBusy(false);
    }
  };

  const google = () => {
    if (googleConfigured) {
      window.location.href = "/api/auth/google";
    } else {
      toast.message(t("The Google passage"), {
        description: t(
          "It opens once the laboratory's vault holds the two Google keys (GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET). Until then, the email passage serves."
        ),
      });
    }
  };

  return (
    <ModalShell
      open={authOpen}
      onOpenChange={(v) => {
        if (!busy) closeAuth();
      }}
      title={gate ? worldCopy.key : tab === "register" ? t("Carve your passage") : t("Enter your passage")}
      description={
        gate
          ? worldCopy.line
          : tab === "register"
            ? t("Twenty transmissions a day, the keyed worlds, and a cosmic library that keeps every word for you.")
            : t("Welcome back. Your cosmic library and the keyed worlds are waiting.")
      }
      widthClass="sm:max-w-[460px]"
    >
      <div className="px-5 pb-5 sm:px-6">
        {/* the two doors */}
        <div className="flex gap-1.5 rounded-full border hairline p-1" role="tablist" aria-label={t("The passage")}>
          {(["signin", "register"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              data-testid={`auth-tab-${k}`}
              className={cn(
                "focus-glow h-8 flex-1 rounded-full text-[13px] font-medium transition-all duration-300",
                tab === k
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {k === "signin" ? t("Sign in") : t("Create passage")}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="mt-4 space-y-3"
        >
          {tab === "register" && (
            <div>
              <label htmlFor="passage-name" className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("A name (or none)")}
              </label>
              <input
                id="passage-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-1.5 h-10 w-full rounded-xl border hairline bg-transparent px-3 text-[14px] text-foreground focus:border-[var(--hairline-active)] focus:outline-none"
              />
            </div>
          )}
          <div>
            <label htmlFor="passage-email" className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Email")}
            </label>
            <input
              id="passage-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              data-testid="passage-email"
              className="mt-1.5 h-10 w-full rounded-xl border hairline bg-transparent px-3 text-[14px] text-foreground focus:border-[var(--hairline-active)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="passage-password" className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Secret phrase")}
            </label>
            <input
              id="passage-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === "register" ? "new-password" : "current-password"}
              data-testid="passage-password"
              className="mt-1.5 h-10 w-full rounded-xl border hairline bg-transparent px-3 text-[14px] text-foreground focus:border-[var(--hairline-active)] focus:outline-none"
            />
            {tab === "register" && (
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {t("Eight characters or more. The laboratory never sees it — only its echo, hashed beyond reading.")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            data-testid="passage-submit"
            className="focus-glow flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-[13.5px] font-medium text-background transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Mail className="size-4" aria-hidden="true" />
            )}
            {tab === "register" ? t("Carve the passage") : t("Open the passage")}
          </button>
        </form>

        {/* the Google passage */}
        <div className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--hairline)]" aria-hidden="true" />
          <span className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">
            {t("or")}
          </span>
          <span className="h-px flex-1 bg-[var(--hairline)]" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={google}
          data-testid="passage-google"
          className="focus-glow mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border hairline text-[13.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)]"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
          </svg>
          {t("Continue with Google")}
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  The Light passage — lifts the daily threshold of the Crystalline   */
/*  key. A quiet attunement of the portal; no coin is asked here.      */
/* ------------------------------------------------------------------ */

export function LightModal() {
  const t = useT();
  const lightOpen = useMirror((s) => s.lightOpen);
  const me = useMirror((s) => s.me);
  const usage = useMirror((s) => s.usage);
  const closeLight = useMirror((s) => s.closeLight);
  const setMe = useMirror((s) => s.setMe);
  const refreshMe = useMirror((s) => s.refreshMe);
  const openAuth = useMirror((s) => s.openAuth);
  const [busy, setBusy] = useState(false);

  if (!lightOpen) return null;

  const attune = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/upgrade", { method: "POST" });
      const data = (await res.json().catch(() => null)) as
        | { user?: { email: string; name: string | null; tier: "crystalline" | "light" }; error?: string }
        | null;
      if (!res.ok || !data?.user) {
        toast.error(data?.error ?? t("The Light could not be attuned. Rest, then try again."));
        return;
      }
      setMe(data.user);
      void refreshMe();
      closeLight();
      toast.success(t("The Light passage is attuned — your transmissions are boundless now."));
    } catch {
      toast.error(t("The Light could not be attuned. Rest, then try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      open={lightOpen}
      onOpenChange={(v) => {
        if (!busy) closeLight();
      }}
      title={t("The Light passage")}
      description={
        me?.tier === "light"
          ? t("You already walk in the Light — today's transmissions are boundless.")
          : t("The Crystalline key carries twenty transmissions a day. The Light passage lifts the count entirely — every world, every transmission, without end.")
      }
      widthClass="sm:max-w-[470px]"
    >
      <div className="px-5 pb-5 sm:px-6">
        {!me ? (
          <button
            type="button"
            onClick={() => {
              closeLight();
              openAuth("register");
            }}
            data-testid="light-signin"
            className="focus-glow flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-[13.5px] font-medium text-background transition-all duration-300 hover:-translate-y-px"
          >
            {t("Sign in to attune the Light")}
          </button>
        ) : me.tier === "light" ? (
          <div className="flex items-center justify-center gap-2 py-2" data-testid="light-active">
            <Sparkles className="size-4 text-[var(--cy)]" aria-hidden="true" />
            <span className="text-[14px] text-foreground/85">{t("Boundless — go gently.")}</span>
          </div>
        ) : (
          <>
            {usage && (
              <p className="mb-3 text-center font-serif text-[14px] italic text-muted-foreground" data-testid="light-usage">
                {t("Today: {used} of {limit} transmissions", { used: usage.used, limit: usage.limit ?? "∞" })}
              </p>
            )}
            <button
              type="button"
              onClick={() => void attune()}
              disabled={busy}
              data-testid="light-attune"
              className="focus-glow flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-[13.5px] font-medium text-background transition-all duration-300 hover:-translate-y-px disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {t("Attune the Light")}
            </button>
            <p className="mt-2.5 text-center text-[12px] leading-relaxed text-muted-foreground">
              {t("Given freely, kept gently — the portal asks no coin for its light.")}
            </p>
          </>
        )}
      </div>
    </ModalShell>
  );
}

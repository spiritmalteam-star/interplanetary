"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Lock, Mail, UserRound } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ModalShell } from "./ModalShell";
import { bypassIntoPro, useHoldBypass, HoldVeil } from "@/lib/hold-bypass";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE PASSAGE — the visitor's door into the laboratory.              */
/*  Everything in the laboratory is free: the passage exists only so   */
/*  the cosmic library can keep its one owner's words across devices.  */
/*                                                                     */
/*  Security law: nothing here ever stores the password — only the     */
/*  door (the server) touches it; the answer is a signed httpOnly      */
/*  cookie; the email's existence never leaks through one message.     */
/*                                                                     */
/*  THE PROFESSIONAL DOOR — a quiet branded head, two clear tabs,      */
/*  guided fields with their own icons, a guarded secret phrase with   */
/*  its show/hide hand, and the house's promises spoken plainly.       */
/* ------------------------------------------------------------------ */

export function AuthModal() {
  const t = useT();
  const authOpen = useMirror((s) => s.authOpen);
  const authMode = useMirror((s) => s.authMode);
  const googleConfigured = useMirror((s) => s.googleConfigured);
  const closeAuth = useMirror((s) => s.closeAuth);
  const setMe = useMirror((s) => s.setMe);
  const refreshMe = useMirror((s) => s.refreshMe);

  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  /* THE SECRET HAND — a four-second hold anywhere on the passage's
     door carves a wanderer passage and walks straight in: no email,
     no secret phrase, no waiting. */
  const hold = useHoldBypass(() =>
    bypassIntoPro().then((ok) => {
      if (ok) closeAuth();
    })
  );

  useEffect(() => {
    if (authOpen) {
      setTab(authMode === "register" ? "register" : "signin");
      setPassword("");
      setShowPw(false);
    }
  }, [authOpen, authMode]);

  if (!authOpen) return null;

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
          ? t("Your passage is carved — your cosmic library travels with you now.")
          : t("Welcome back — your cosmic library remembers you.")
      );
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

  const fieldShell =
    "mt-1.5 flex h-11 w-full items-center gap-2.5 rounded-xl border hairline bg-[var(--glass-bg)] px-3 transition-colors duration-300 focus-within:border-[var(--hairline-active)]";
  const fieldInput =
    "min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none";

  return (
    <ModalShell
      open={authOpen}
      onOpenChange={(v) => {
        if (!busy) closeAuth();
      }}
      title={tab === "register" ? t("Carve your passage") : t("Enter your passage")}
      description={
        tab === "register"
          ? t("The passage simply keeps your cosmic library — every transmission, every book — with you, on every device.")
          : t("Welcome back. Your cosmic library is waiting, exactly where you left it.")
      }
      widthClass="sm:max-w-[460px]"
    >
      <div className="px-5 pb-6 sm:px-6" {...hold.bind}>
        <HoldVeil holding={hold.holding} pct={hold.pct} label="Hold four seconds — the door opens by itself…" />
        {/* the branded head — the house's own seal above its door */}
        <div className="mb-4 flex items-center justify-center gap-2.5" data-testid="auth-brand">
          <Image
            src="/images/ai/mark-dark.png"
            alt=""
            width={30}
            height={30}
            className="hidden size-[30px] rounded-full opacity-90 dark:block"
          />
          <Image
            src="/images/ai/mark-light.png"
            alt=""
            width={30}
            height={30}
            className="size-[30px] rounded-full opacity-90 dark:hidden"
          />
          <span className="font-[family-name:Cinzel] text-[13px] tracking-[0.22em] text-foreground/85">
            reflectme.space
          </span>
        </div>

        {/* the two doors */}
        <div className="flex gap-1.5 rounded-full border hairline bg-[var(--glass-bg)] p-1" role="tablist" aria-label={t("The passage")}>
          {(["signin", "register"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              data-testid={`auth-tab-${k}`}
              className={cn(
                "focus-glow h-9 flex-1 rounded-full text-[13px] font-medium transition-all duration-300",
                tab === k
                  ? "bg-foreground text-background shadow-[0_2px_10px_-6px_rgba(0,0,0,0.6)]"
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
          className="mt-5 space-y-3.5"
        >
          {tab === "register" && (
            <div>
              <label htmlFor="passage-name" className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("A name (or none)")}
              </label>
              <div className={fieldShell}>
                <UserRound className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                <input
                  id="passage-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={fieldInput}
                />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="passage-email" className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Email")}
            </label>
            <div className={fieldShell}>
              <Mail className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
              <input
                id="passage-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@somewhere.earth"
                data-testid="passage-email"
                className={fieldInput}
              />
            </div>
          </div>
          <div>
            <label htmlFor="passage-password" className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Secret phrase")}
            </label>
            <div className={cn(fieldShell, "pr-1.5")}>
              <Lock className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
              <input
                id="passage-password"
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === "register" ? "new-password" : "current-password"}
                placeholder="••••••••"
                data-testid="passage-password"
                className={fieldInput}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? t("Hide the secret phrase") : t("Show the secret phrase")}
                aria-pressed={showPw}
                data-testid="passage-pw-toggle"
                className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {showPw ? (
                  <EyeOff className="size-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="size-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
            {tab === "register" && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                {t("Eight characters or more. The laboratory never sees it — only its echo, hashed beyond reading.")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            data-testid="passage-submit"
            className="focus-glow flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-[13.5px] font-medium text-background transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Mail className="size-4" aria-hidden="true" />
            )}
            {tab === "register" ? t("Carve the passage") : t("Open the passage")}
          </button>
        </form>

        {/* the register side's quiet promises */}
        {tab === "register" && (
          <ul className="mt-4 space-y-1.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3.5 py-3" data-testid="auth-promises">
            {[
              "Every transmission kept in your cosmic library — on every device",
              "Your settings travel with your passage",
              "Everything you make stays yours",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
                <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rotate-45 bg-[#e8d9b0]" />
                <span>{t(line)}</span>
              </li>
            ))}
          </ul>
        )}

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
          className="focus-glow mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border hairline text-[13.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)] hover:bg-[var(--glass-bg)]"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
          </svg>
          {t("Continue with Google")}
        </button>

        {/* the secret hand's own whisper — one quiet line at the foot */}
        <p className="mt-3 text-center text-[10.5px] italic leading-relaxed text-muted-foreground/70">
          {t("In a hurry? Rest your finger here for four seconds — a wanderer's passage opens by itself.")}
        </p>
      </div>
    </ModalShell>
  );
}

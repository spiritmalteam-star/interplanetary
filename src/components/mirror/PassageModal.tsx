"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Mail, UserRound } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ModalShell } from "./ModalShell";
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
/*  its show/hide hand, the house's promises spoken plainly — and the  */
/*  RETURN DOOR: a forgotten secret phrase travels out as a letter,    */
/*  and the letter's own key (?reset=…) opens the room where the       */
/*  passage is carved anew. The verification letter's answer           */
/*  (?verified=…) is spoken here as a gentle word too.                 */
/* ------------------------------------------------------------------ */

type DoorView = "signin" | "register" | "forgot" | "reset";

export function AuthModal() {
  const t = useT();
  const authOpen = useMirror((s) => s.authOpen);
  const authMode = useMirror((s) => s.authMode);
  const googleConfigured = useMirror((s) => s.googleConfigured);
  const closeAuth = useMirror((s) => s.closeAuth);
  const setMe = useMirror((s) => s.setMe);
  const refreshMe = useMirror((s) => s.refreshMe);

  const [view, setView] = useState<DoorView>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  /* the return door's own keeping */
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [doorNote, setDoorNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (authOpen) {
      /* THE LETTER'S PRIORITY — when the visitor arrived holding a
         reset key, the door is already standing in the carve-anew
         room; the opening hand never drags it back to sign-in. */
      if (view === "reset" && resetToken) return;
      setView(authMode === "register" ? "register" : "signin");
      setPassword("");
      setShowPw(false);
      setDoorNote(null);
    }
  }, [authOpen, authMode]);

  /* THE LETTER'S RETURN — when the visitor arrives holding a reset
     key (?reset=…), the door opens straight into the room where the
     passage is carved anew; the verification letter's answer
     (?verified=…) is spoken once and the address left clean. */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const reset = params.get("reset");
      const verified = params.get("verified");
      if (reset && reset.length >= 20 && reset.length <= 200) {
        setResetToken(reset);
        setView("reset");
        setDoorNote(null);
        useMirror.getState().openAuth("signin");
      } else if (verified) {
        toast.success(
          verified === "1"
            ? t("Your email now belongs to your passage — the library keeps you on every device.")
            : t("That key has already rested or was never carved. You can ask for a fresh letter anytime.")
        );
      }
      if (reset || verified) {
        params.delete("reset");
        params.delete("verified");
        const rest = params.toString();
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${rest ? `?${rest}` : ""}`
        );
      }
    } catch {
      /* the address stays as it is — the door still serves */
    }
  }, []);

  if (!authOpen) return null;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setDoorNote(null);
    try {
      if (view === "forgot") {
        const res = await fetch("/api/auth/password/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = (await res.json().catch(() => null)) as
          | { message?: string; configured?: boolean; error?: string }
          | null;
        setDoorNote({
          ok: true,
          text: t(
            data?.message ??
              "If a passage holds that email, a letter of return is on its way (or rests in the server log when no messenger is configured)."
          ),
        });
        return;
      }
      if (view === "reset") {
        const res = await fetch("/api/auth/password/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password }),
        });
        const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
        if (!res.ok) {
          setDoorNote({ ok: false, text: data?.error ?? t("The passage did not open. Rest, then try again.") });
          return;
        }
        setResetToken(null);
        setPassword("");
        setView("signin");
        setDoorNote({ ok: true, text: t(data?.message ?? "The passage is carved anew. Sign in with your new secret.") });
        return;
      }
      const endpoint = view === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          view === "register" ? { email, password, name } : { email, password }
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
        view === "register"
          ? t("Your passage is carved — your cosmic library travels with you now.")
          : t("Welcome back — your cosmic library remembers you.")
      );
    } catch {
      if (view !== "forgot" && view !== "reset") {
        toast.error(t("The passage did not open. Rest, then try again."));
      } else {
        setDoorNote({ ok: false, text: t("The passage did not open. Rest, then try again.") });
      }
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
    "min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none";

  const head =
    view === "register"
      ? { title: t("Carve your passage"), description: t("The passage simply keeps your cosmic library — every transmission, every book — with you, on every device.") }
      : view === "forgot"
        ? { title: t("The letter of return"), description: t("Name the passage's email — a key to carve it anew travels out to you alone.") }
        : view === "reset"
          ? { title: t("Carve the passage anew"), description: t("The letter's key opened this room. Choose a new secret phrase — then sign in with it as always.") }
          : { title: t("Enter your passage"), description: t("Welcome back. Your cosmic library is waiting, exactly where you left it.") };

  const canSubmit =
    view === "forgot"
      ? Boolean(email.trim())
      : view === "reset"
        ? password.length >= 8 && Boolean(resetToken)
        : Boolean(email.trim()) && Boolean(password);

  return (
    <ModalShell
      open={authOpen}
      onOpenChange={(v) => {
        if (!busy) closeAuth();
      }}
      title={head.title}
      description={head.description}
      widthClass="sm:max-w-[460px]"
    >
      <div className="relative isolate px-5 pb-6 sm:px-6">
        {/* THE LIGHT LANGUAGE AT THE DOOR — two grand seals resting in
            the passage's quiet corners, printing as bronze ink on the
            daylight glass and glowing silver in the crystal night;
            they never take a touch and never cover a word. */}
        <Image
          src="/sigils/sigil_05.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          loading="lazy"
          width={300}
          height={300}
          className="pointer-events-none absolute -top-12 -right-10 -z-10 size-[150px] select-none lp-sigil-img opacity-[0.17] [transform:rotate(14deg)]"
        />
        <Image
          src="/sigils/intricate_02.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          loading="lazy"
          width={340}
          height={340}
          className="pointer-events-none absolute -bottom-14 -left-12 -z-10 size-[170px] select-none lp-sigil-img opacity-[0.15] [transform:rotate(-9deg)]"
        />
        {/* the branded head — the house's own seal above its door,
            wearing the gold, with the two kind colors braided beneath */}
        <div className="mb-3 flex items-center justify-center gap-2.5" data-testid="auth-brand">
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
          <span className="font-[family-name:Cinzel] text-[14px] tracking-[0.22em] text-[var(--lp-gold)]">
            reflectme.space
          </span>
        </div>
        <span
          aria-hidden="true"
          className="mx-auto mb-4 block h-px w-[74%] bg-[linear-gradient(90deg,transparent_0%,var(--lp-violet)_26%,var(--lp-feather)_52%,var(--lp-gold)_78%,transparent_100%)] opacity-60"
        />

        {/* the two doors — hidden while the return door serves */}
        {(view === "signin" || view === "register") && (
          <div className="flex gap-1.5 rounded-full border hairline bg-[var(--glass-bg)] p-1" role="tablist" aria-label={t("The passage")}>
            {(["signin", "register"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={view === k}
                onClick={() => setView(k)}
                data-testid={`auth-tab-${k}`}
                className={cn(
                  "focus-glow h-9 flex-1 rounded-full border text-[14px] font-medium transition-all duration-300",
                  view === k
                    ? "border-[rgba(232,217,176,0.55)] bg-[linear-gradient(180deg,rgba(232,217,176,0.26),rgba(232,217,176,0.1))] text-[var(--lp-gold)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {k === "signin" ? t("Sign in") : t("Create passage")}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="mt-5 space-y-3.5"
        >
          {view === "register" && (
            <div>
              <label htmlFor="passage-name" className="mono-label text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
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
          {view !== "reset" && (
            <div>
              <label htmlFor="passage-email" className="mono-label text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
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
          )}
          {(view === "signin" || view === "register" || view === "reset") && (
            <div>
              <label htmlFor="passage-password" className="mono-label text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
                {view === "reset" ? t("The new secret phrase") : t("Secret phrase")}
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
                  autoComplete={view === "signin" ? "current-password" : "new-password"}
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
              {view !== "signin" && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {t("Eight characters or more. The laboratory never sees it — only its echo, hashed beyond reading.")}
                </p>
              )}
              {view === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setView("forgot");
                    setPassword("");
                    setDoorNote(null);
                  }}
                  data-testid="passage-forgot"
                  className="focus-glow mt-1.5 text-[13px] text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
                >
                  {t("Forgot the secret phrase?")}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !canSubmit}
            data-testid="passage-submit"
            className="focus-glow flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,var(--lp-gold),var(--lp-gold-soft))] text-[15px] font-medium tracking-[0.02em] text-[var(--lp-veil-solid)] shadow-[0_12px_30px_-14px_rgba(154,120,30,0.6),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-300 hover:-translate-y-px hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : view === "forgot" ? (
              <Mail className="size-4" aria-hidden="true" />
            ) : view === "reset" ? (
              <KeyRound className="size-4" aria-hidden="true" />
            ) : (
              <Mail className="size-4" aria-hidden="true" />
            )}
            {view === "register"
              ? t("Carve the passage")
              : view === "forgot"
                ? t("Send the letter of return")
                : view === "reset"
                  ? t("Carve the passage anew")
                  : t("Open the passage")}
          </button>
        </form>

        {doorNote && (
          <div
            role="status"
            data-testid="passage-note"
            className={cn(
              "mt-3 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[13.5px] leading-relaxed",
              doorNote.ok
                ? "border-[color-mix(in_srgb,#8fc9a8_35%,transparent)] bg-[color-mix(in_srgb,#8fc9a8_7%,var(--background))] text-foreground/90"
                : "border-[color-mix(in_srgb,#f43f5e_32%,transparent)] bg-[color-mix(in_srgb,#f43f5e_6%,var(--background))] text-foreground/90"
            )}
          >
            {doorNote.ok ? <Check className="mt-0.5 size-3.5 shrink-0 text-[#8fc9a8]" aria-hidden="true" /> : null}
            <span>{doorNote.text}</span>
          </div>
        )}

        {/* the return door's way back */}
        {(view === "forgot" || view === "reset") && (
          <button
            type="button"
            onClick={() => {
              setView("signin");
              setPassword("");
              setDoorNote(null);
            }}
            data-testid="passage-back-signin"
            className="focus-glow mt-3 w-full text-center text-[13px] text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
          >
            {t("Back to the passage")}
          </button>
        )}

        {/* the register side's quiet promises */}
        {view === "register" && (
          <ul className="mt-4 space-y-1.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3.5 py-3" data-testid="auth-promises">
            {[
              "Every transmission kept in your cosmic library — on every device",
              "Your settings travel with your passage",
              "Everything you make stays yours",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
                <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rotate-45 bg-[#e8d9b0]" />
                <span>{t(line)}</span>
              </li>
            ))}
          </ul>
        )}

        {/* the Google passage — resting while the return door serves */}
        {(view === "signin" || view === "register") && (
          <>
            <div className="mt-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--lp-edge))]" aria-hidden="true" />
              <span className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                {t("or")}
              </span>
              <span className="h-px flex-1 bg-[linear-gradient(90deg,var(--lp-edge),transparent)]" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={google}
              data-testid="passage-google"
              className="focus-glow mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] text-[14.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[rgba(232,217,176,0.5)] hover:bg-[var(--glass-bg)]"
            >
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
              </svg>
              {t("Continue with Google")}
            </button>
          </>
        )}
      </div>
    </ModalShell>
  );
}

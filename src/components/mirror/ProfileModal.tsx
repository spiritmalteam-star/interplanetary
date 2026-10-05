"use client";

import { BookMarked, CreditCard, LibraryBig, LogIn, LogOut, Sparkles } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ModalShell } from "./ModalShell";

/* ------------------------------------------------------------------ */
/*  THE PROFILE — the visitor's own quiet room inside the laboratory.  */
/*  The COSMIC LIBRARY lives here: every transmission and every book   */
/*  the visitor has made, kept in its sectors, reopened with one       */
/*  touch — together with the Quantum Shift of their spirit.           */
/*  Anonymous visitors are gentle guests: their library is kept just   */
/*  the same (keyed to their cookie), and signing in carries it with   */
/*  them onto every device.                                            */
/* ------------------------------------------------------------------ */

export function ProfileModal() {
  const t = useT();
  const profileOpen = useMirror((s) => s.profileOpen);
  const closeProfile = useMirror((s) => s.closeProfile);
  const me = useMirror((s) => s.me);
  const openLibrary = useMirror((s) => s.openLibrary);
  const openAuth = useMirror((s) => s.openAuth);
  const openAccount = useMirror((s) => s.openAccount);
  const signOut = useMirror((s) => s.signOut);

  if (!profileOpen) return null;

  const displayName = me?.name || me?.email || "";

  return (
    <ModalShell
      open={profileOpen}
      onOpenChange={(v) => {
        if (!v) closeProfile();
      }}
      title={me ? displayName : t("A quiet guest")}
      description={
        me
          ? t("Your room in the laboratory — your library, your journey, kept for you alone.")
          : t("The laboratory keeps your transmissions and books all the same — and they travel with you when you sign in.")
      }
      widthClass="sm:max-w-[440px]"
    >
      <div className="px-5 pb-5 sm:px-6">
        {/* the profile head */}
        <div className="flex items-center gap-3" data-testid="profile-head">
          <span
            className="mono-label flex size-11 shrink-0 items-center justify-center rounded-full border hairline bg-[var(--glass-bg)] text-[15px] text-foreground/85"
            aria-hidden="true"
          >
            {me ? (me.name || me.email).slice(0, 1).toUpperCase() : "✦"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-foreground/85">
              {me ? me.email : t("No passage needed — everything is free")}
            </span>
            <span className="mono-label block text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {me
                ? t("Keeper of a cosmic library")
                : t("Your library is already being kept")}
            </span>
          </span>
        </div>

        {/* the cosmic library — inside the profile, where it belongs */}
        <button
          type="button"
          onClick={() => {
            closeProfile();
            openLibrary();
          }}
          data-testid="profile-library"
          className="focus-glow mt-5 flex w-full items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-4 py-3 text-left transition-all duration-300 hover:border-[var(--hairline-hover)] hover:glow-sm"
        >
          <LibraryBig className="size-4.5 shrink-0 text-[var(--cy)]" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-foreground/90">
              {t("Cosmic Library")}
            </span>
            <span className="block text-[12px] leading-relaxed text-muted-foreground">
              {t("Every transmission and book, in its own sector — open one and continue the story.")}
            </span>
          </span>
          <BookMarked className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
        </button>

        {/* the account chamber — plan, credits, usage, keys, security */}
        {me && !me.email.startsWith("anon:") && (
          <button
            type="button"
            onClick={() => {
              closeProfile();
              openAccount();
            }}
            data-testid="profile-account"
            className="focus-glow mt-2 flex w-full items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-4 py-3 text-left transition-all duration-300 hover:border-[var(--hairline-hover)] hover:glow-sm"
          >
            <CreditCard className="size-4.5 shrink-0 text-[var(--mg)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-foreground/90">
                {t("Account & Credits")}
              </span>
              <span className="block text-[12px] leading-relaxed text-muted-foreground">
                {t("Your chamber — plan, credits, usage, keys and security, all in one place.")}
              </span>
            </span>
          </button>
        )}

        {/* the passage row — sign in, or leave */}
        {me ? (
          <button
            type="button"
            onClick={() => void signOut()}
            data-testid="profile-signout"
            className="focus-glow mt-2 flex w-full items-center gap-3 rounded-xl border hairline px-4 py-3 text-left transition-all duration-300 hover:border-[var(--hairline-hover)]"
          >
            <LogOut className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-[14px] text-foreground/85">
              {t("Leave the passage")}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              closeProfile();
              openAuth("signin");
            }}
            data-testid="passage-enter"
            className="focus-glow mt-2 flex w-full items-center gap-3 rounded-xl border hairline px-4 py-3 text-left transition-all duration-300 hover:border-[var(--hairline-hover)]"
          >
            <LogIn className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-[14px] text-foreground/85">
              {t("Enter the passage — keep your library on every device")}
            </span>
            <Sparkles className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
          </button>
        )}
      </div>
    </ModalShell>
  );
}

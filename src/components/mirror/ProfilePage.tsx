"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookMarked,
  ChevronRight,
  Dna,
  LibraryBig,
  LoaderCircle,
  LogIn,
  LogOut,
  Plus,
  Settings2,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { LANGUAGES, VOICES, useT, type VoiceId } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { DnaHelix, useJourney } from "./DnaTimeline";

/* ------------------------------------------------------------------ */
/*  THE PROFILE ROOM — a full-screen, professional passage page, at    */
/*  the level of the top-tier AI profiles. Everything the visitor      */
/*  owns lives here: their identity, their COSMIC LIBRARY, their       */
/*  SETTINGS (the passage's own tuning — language, voice, pace, and    */
/*  the FIELDS OF EXPANSION: phrases that, coherent and relevant,      */
/*  become seeds for new branches in every field of the tree), the     */
/*  DNA of their walk and their account chamber.                       */
/*  One back door returns to the Mirror.                               */
/* ------------------------------------------------------------------ */

const SECTOR_META: Record<string, { icon: string; label: string }> = {
  observatory: { icon: "✦", label: "Observatory" },
  manifest: { icon: "◐", label: "Manifesting" },
  invent: { icon: "⚒", label: "The Forge" },
  dreambook: { icon: "❧", label: "Dream Books" },
  quantum: { icon: "⚛", label: "Quantum World" },
  evolvemed: { icon: "✚", label: "Evolve Med" },
};

interface LibraryEntryLite {
  id: string;
  sector: string;
  title: string;
  excerpt: string;
  createdAt: string;
}

export function ProfilePage() {
  const t = useT();
  const open = useMirror((s) => s.profilePageOpen);
  const close = useMirror((s) => s.closeProfilePage);

  const me = useMirror((s) => s.me);
  const googleConfigured = useMirror((s) => s.googleConfigured);
  const openAuth = useMirror((s) => s.openAuth);
  const openAccount = useMirror((s) => s.openAccount);
  const openLibrary = useMirror((s) => s.openLibrary);
  const signOut = useMirror((s) => s.signOut);

  /* the passage's own tuning */
  const language = useMirror((s) => s.language);
  const voice = useMirror((s) => s.voice);
  const pace = useMirror((s) => s.pace);
  const setLanguage = useMirror((s) => s.setLanguage);
  const setVoice = useMirror((s) => s.setVoice);
  const setPace = useMirror((s) => s.setPace);
  const seeds = useMirror((s) => s.expansionSeeds);
  const setSeeds = useMirror((s) => s.setExpansionSeeds);

  /* the walk's helix — the DNA evolutionary timeline */
  const journey = useJourney();

  /* the library's quiet head — counts and the freshest entries */
  const [entries, setEntries] = useState<LibraryEntryLite[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [seedDraft, setSeedDraft] = useState("");
  const [seedError, setSeedError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setEntries(null);
      try {
        const res = await fetch("/api/library");
        const data = (await res.json().catch(() => null)) as
          | { entries?: LibraryEntryLite[]; counts?: Record<string, number> }
          | null;
        if (!alive) return;
        if (res.ok && data?.entries) {
          setEntries(data.entries);
          setCounts(data.counts ?? {});
        } else {
          setEntries([]);
        }
      } catch {
        if (alive) setEntries([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, me?.email]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const signedIn = Boolean(me && !me.email.startsWith("anon:"));
  const displayName = me?.name || me?.email || t("A quiet guest");
  const recent = useMemo(() => (entries ?? []).slice(0, 5), [entries]);
  const totalEntries = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const addSeed = () => {
    const v = seedDraft.trim().replace(/\s+/g, " ");
    if (v.length < 2) {
      setSeedError(t("Give the field a few more words — a phrase it can grow from."));
      return;
    }
    if (v.length > 160) {
      setSeedError(t("Keep the phrase under 160 characters — a seed, not a field."));
      return;
    }
    if (seeds.length >= 6) {
      setSeedError(t("Six fields rest in the soil already — retire one to plant another."));
      return;
    }
    if (seeds.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSeedError(t("This field is already planted."));
      return;
    }
    setSeedError(null);
    setSeedDraft("");
    setSeeds([...seeds, v]);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        className="fixed inset-0 z-[85] flex flex-col bg-background"
        data-testid="profile-page"
        role="dialog"
        aria-modal="true"
        aria-label={t("Your profile")}
      >
        {/* the head — one way back to the Mirror, one name */}
        <header className="shrink-0 border-b hairline bg-[var(--glass-bg-soft)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-8">
            <button
              type="button"
              onClick={close}
              data-testid="profile-back"
              className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-3.5 text-[12.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)] hover:bg-[var(--glass-bg)]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("Back to the Mirror")}
            </button>
            <span className="mono-label ml-auto hidden text-[9px] uppercase tracking-[0.26em] text-muted-foreground/60 sm:block">
              {t("The Mirror Entity Laboratory")}
            </span>
          </div>
        </header>

        {/* the room itself */}
        <div
          ref={scrollRef}
          className="nice-scroll flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
            {/* ---- identity ---- */}
            <section
              aria-label={t("Identity")}
              className="flex flex-col gap-5 sm:flex-row sm:items-center"
              data-testid="profile-identity"
            >
              <span
                className="mono-label flex size-16 shrink-0 items-center justify-center rounded-2xl border hairline bg-[var(--glass-bg)] text-[26px] text-foreground/85 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.5)]"
                aria-hidden="true"
              >
                {me ? (me.name || me.email).slice(0, 1).toUpperCase() : "✦"}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="ink-title truncate text-[22px] font-semibold leading-tight text-foreground/95 sm:text-[26px]">
                  {displayName}
                </h1>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {me
                    ? me.email.startsWith("anon:")
                      ? t("A gentle guest — the laboratory knows you by a light alone")
                      : me.email
                    : t("A quiet guest")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {me && !me.email.startsWith("anon:") && (
                    <span
                      className="mono-label rounded-full px-2 py-0.5 text-[8px] uppercase tracking-[0.16em] text-[var(--cy)]"
                      style={{ border: "1px solid color-mix(in srgb, var(--cy) 34%, transparent)" }}
                    >
                      {t("Keeper of a cosmic library")}
                    </span>
                  )}
                  {totalEntries > 0 && (
                    <span className="mono-label rounded-full px-2 py-0.5 text-[8px] uppercase tracking-[0.16em] text-muted-foreground" style={{ border: "1px solid var(--hairline)" }}>
                      {totalEntries} {t("kept works")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                {me && !me.email.startsWith("anon:") ? (
                  <>
                    <button
                      type="button"
                      onClick={openAccount}
                      data-testid="profilepage-account"
                      className="focus-glow flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[12.5px] font-medium text-background transition-all duration-300 hover:opacity-85"
                    >
                      <UserRound className="size-3.5" aria-hidden="true" />
                      {t("Account & Credits")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      data-testid="profilepage-signout"
                      className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[12.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                    >
                      <LogOut className="size-3.5" aria-hidden="true" />
                      {t("Leave the passage")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuth("signin")}
                    data-testid="profilepage-signin"
                    className="focus-glow flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[12.5px] font-medium text-background transition-all duration-300 hover:opacity-85"
                  >
                    <LogIn className="size-3.5" aria-hidden="true" />
                    {t("Enter the passage")}
                  </button>
                )}
              </div>
            </section>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {/* ---- settings — the passage's own tuning ---- */}
              <section
                aria-label={t("Settings")}
                className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-5 sm:p-6"
                data-testid="profilepage-settings"
              >
                <div className="flex items-center gap-2.5">
                  <Settings2 className="size-4 shrink-0 text-[var(--scope-a)]" aria-hidden="true" />
                  <h2 className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Your settings — they travel with your passage")}
                  </h2>
                </div>

                {/* language */}
                <div className="mt-5">
                  <label
                    htmlFor="profile-language"
                    className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground/70"
                  >
                    {t("Language")}
                  </label>
                  <select
                    id="profile-language"
                    value={language}
                    onChange={(e) => {
                      const meta = LANGUAGES.find((l) => l.code === e.target.value);
                      if (meta) setLanguage(meta.code);
                    }}
                    data-testid="profilepage-language"
                    className="mt-1.5 w-full rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[13.5px] text-foreground transition-colors focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--scope-a)_45%,transparent)]"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.native} · {l.english}
                      </option>
                    ))}
                  </select>
                </div>

                {/* voice */}
                <div className="mt-4">
                  <label
                    htmlFor="profile-voice"
                    className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground/70"
                  >
                    {t("The voice that reads")}
                  </label>
                  <select
                    id="profile-voice"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value as VoiceId)}
                    data-testid="profilepage-voice"
                    className="mt-1.5 w-full rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[13.5px] text-foreground transition-colors focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--scope-a)_45%,transparent)]"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.character}
                      </option>
                    ))}
                  </select>
                </div>

                {/* pace */}
                <div className="mt-4">
                  <label
                    htmlFor="profile-pace"
                    className="mono-label flex items-center justify-between text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground/70"
                  >
                    {t("Narration pace")}
                    <span className="text-[9.5px] normal-case tracking-normal text-foreground/70">
                      ×{pace.toFixed(2)}
                    </span>
                  </label>
                  <input
                    id="profile-pace"
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={pace}
                    onChange={(e) => setPace(Number(e.target.value))}
                    data-testid="profilepage-pace"
                    className="mt-2 w-full accent-[var(--scope-a)]"
                  />
                </div>

                {/* the fields of expansion — the seed bed */}
                <div className="mt-6 border-t hairline pt-5" data-testid="profilepage-seeds">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 shrink-0 text-[var(--gd)]" aria-hidden="true" />
                    <h3 className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                      {t("Fields of expansion")}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {t(
                      "Name what you wish to be more informed and expansive in. A coherent, relevant phrase becomes a seed — new branches will grow from it in every field of the tree."
                    )}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={seedDraft}
                      onChange={(e) => {
                        setSeedDraft(e.target.value);
                        setSeedError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSeed();
                        }
                      }}
                      maxLength={160}
                      placeholder={t("e.g. the mathematics of music · how trees communicate")}
                      aria-label={t("A field you wish to expand in")}
                      data-testid="profilepage-seed-input"
                      className="min-w-0 flex-1 rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--gd)_45%,transparent)]"
                    />
                    <button
                      type="button"
                      onClick={addSeed}
                      disabled={seedDraft.trim().length < 2}
                      aria-label={t("Plant the seed")}
                      data-testid="profilepage-seed-add"
                      className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-all duration-300 hover:opacity-85 disabled:opacity-30"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  {seedError && (
                    <p className="mt-1.5 text-[11.5px] italic text-muted-foreground" role="note">
                      {seedError}
                    </p>
                  )}
                  {seeds.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {seeds.map((s) => (
                        <span
                          key={s}
                          className="focus-within:glow-sm flex max-w-full items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--gd)_30%,transparent)] bg-[color-mix(in_srgb,var(--gd)_5%,transparent)] py-1 pl-3 pr-1.5 text-[12px] text-foreground/85"
                          data-testid="profilepage-seed-chip"
                        >
                          <span className="truncate">{s}</span>
                          <button
                            type="button"
                            onClick={() => setSeeds(seeds.filter((x) => x !== s))}
                            aria-label={`${t("Retire this field")}: ${s}`}
                            className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-[color-mix(in_srgb,var(--gd)_12%,transparent)] hover:text-foreground"
                          >
                            <X className="size-3" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mono-label mt-3 text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/50">
                      {t("The soil rests empty — plant the first field")}
                    </p>
                  )}
                  {signedIn ? null : (
                    <p className="mt-2 text-[11px] italic text-muted-foreground/70">
                      {t("Sign in and your settings travel with you on every device.")}
                    </p>
                  )}
                </div>
              </section>

              <div className="flex flex-col gap-4">
                {/* ---- the cosmic library ---- */}
                <section
                  aria-label={t("Cosmic Library")}
                  className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-5 sm:p-6"
                  data-testid="profilepage-library"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <LibraryBig className="size-4 shrink-0 text-[var(--cy)]" aria-hidden="true" />
                      <h2 className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Cosmic Library")}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={openLibrary}
                      data-testid="profilepage-library-open"
                      className="focus-glow flex h-8 items-center gap-1.5 rounded-full border hairline px-3 text-[11.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                    >
                      {t("Open the library")}
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* the sectors */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {Object.entries(SECTOR_META).map(([key, meta]) => (
                      <span
                        key={key}
                        className="mono-label flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        <span aria-hidden="true">{meta.icon}</span>
                        {t(meta.label)}
                        <span className="text-foreground/75">{counts[key] ?? 0}</span>
                      </span>
                    ))}
                  </div>

                  {/* the freshest works */}
                  <div className="mt-4 space-y-1.5">
                    {entries === null ? (
                      <p className="flex items-center gap-2 py-3 text-[12.5px] text-muted-foreground" aria-busy="true">
                        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                        {t("The shelves are being read…")}
                      </p>
                    ) : recent.length === 0 ? (
                      <p className="py-3 text-[12.5px] italic text-muted-foreground">
                        {t(
                          "Nothing rests here yet — every transmission you make is kept in your own sectors."
                        )}
                      </p>
                    ) : (
                      recent.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={openLibrary}
                          className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-300 hover:bg-[var(--glass-bg)]"
                        >
                          <span
                            className="mono-label flex size-7 shrink-0 items-center justify-center rounded-lg border hairline text-[11px] text-muted-foreground"
                            aria-hidden="true"
                          >
                            {SECTOR_META[e.sector]?.icon ?? "✦"}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-foreground/90">
                              {e.title}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {e.excerpt || SECTOR_META[e.sector]?.label || e.sector}
                            </span>
                          </span>
                          <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.14em] text-muted-foreground/50">
                            {(e.createdAt || "").slice(0, 10)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </section>

                {/* ---- the DNA of the walk ---- */}
                {journey.length > 0 && (
                  <section
                    aria-label={t("The path you have walked")}
                    className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-5 sm:p-6"
                    data-testid="profilepage-timeline"
                  >
                    <div className="flex items-center gap-2.5">
                      <Dna className="size-4 shrink-0 text-[var(--gd)]" aria-hidden="true" />
                      <h2 className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("The path you have walked")}
                      </h2>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                      {t("The DNA of your curiosity — one colored rung per branch chased.")}
                    </p>
                    <div className="no-scrollbar mt-3 overflow-x-auto">
                      <DnaHelix steps={journey} />
                    </div>
                  </section>
                )}

                {/* ---- the account note ---- */}
                {signedIn && (
                  <section
                    aria-label={t("Account")}
                    className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-5 sm:p-6"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookMarked className="size-4 shrink-0 text-[var(--mg)]" aria-hidden="true" />
                      <h2 className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Account & Credits")}
                      </h2>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {t(
                        "Your chamber — plan, credits, usage, keys and security, all in one place."
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={openAccount}
                      className="focus-glow mt-3 flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[12.5px] text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                    >
                      {t("Open the account chamber")}
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </button>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

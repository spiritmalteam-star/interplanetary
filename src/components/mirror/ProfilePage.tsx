"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookMarked,
  ChevronRight,
  CreditCard,
  Dna,
  Gem,
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
import { ExpansionMirrorPanel } from "./ExpansionMirror";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE PROFILE ROOM — rebuilt in the manner of the frontier: a slim   */
/*  header, a quiet navigation rail on the left, one focused panel of  */
/*  content on the right. Everything the visitor owns lives here —     */
/*  their identity, their SETTINGS (the passage's own tuning), the     */
/*  FIELDS OF EXPANSION, their COSMIC LIBRARY, the DNA of their walk   */
/*  and their account chamber. One back door returns to the Mirror.    */
/*                                                                     */
/*  THE LAYERING LAW: every door that opens another room (the account  */
/*  chamber, the passage, the library) closes THIS room first — the    */
/*  profile page rests above the dialogs, so a door opened from here   */
/*  would otherwise swing open behind its own wall.                    */
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

interface AccountSummaryLite {
  plan: { label: string; monthlyCredits: number };
  credits: { balance: number | null };
  usage: { events30d: number; credits30d: number };
  libraryCount: number;
}

type SectionId = "profile" | "settings" | "seeds" | "library" | "dna" | "account";

export function ProfilePage() {
  const t = useT();
  const open = useMirror((s) => s.profilePageOpen);
  const close = useMirror((s) => s.closeProfilePage);

  const me = useMirror((s) => s.me);
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

  /* the room's own state */
  const [section, setSection] = useState<SectionId>("profile");
  const [entries, setEntries] = useState<LibraryEntryLite[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<AccountSummaryLite | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [seedDraft, setSeedDraft] = useState("");
  const [seedError, setSeedError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const signedIn = Boolean(me && !me.email.startsWith("anon:"));

  /* the library's quiet head — counts and the freshest entries */
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setSection("profile");
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

  /* the account chamber's honest head — read once, lazily, only for
     a signed keeper who opens the account section */
  useEffect(() => {
    if (!open || !signedIn || section !== "account" || summary || summaryLoading)
      return;
    let alive = true;
    setSummaryLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/account/summary");
        const data = (await res.json().catch(() => null)) as
          | (AccountSummaryLite & { user?: unknown })
          | null;
        if (!alive) return;
        if (res.ok && data && data.plan) setSummary(data);
      } catch {
        /* the chamber keeps its silence — the teaser simply rests */
      } finally {
        if (alive) setSummaryLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, signedIn, section, summary, summaryLoading]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* THE LAYERING LAW — the profile page rests above the dialogs, so
     every door out of this room closes the room first. */
  const exitTo = (after: () => void) => {
    close();
    after();
  };

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

  /* ---------------- the navigation ---------------- */
  const navItems: {
    id: SectionId;
    label: string;
    icon: typeof UserRound;
    available: boolean;
    testId: string;
  }[] = [
    {
      id: "profile",
      label: "Your profile",
      icon: UserRound,
      available: true,
      testId: "profile-nav-profile",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings2,
      available: true,
      testId: "profile-nav-settings",
    },
    {
      id: "seeds",
      label: "Fields of expansion",
      icon: Sparkles,
      available: true,
      testId: "profile-nav-seeds",
    },
    {
      id: "library",
      label: "Cosmic Library",
      icon: LibraryBig,
      available: true,
      testId: "profile-nav-library",
    },
    {
      id: "dna",
      label: "The path you have walked",
      icon: Dna,
      available: journey.length > 0,
      testId: "profile-nav-dna",
    },
    {
      id: "account",
      label: "Account & Credits",
      icon: BookMarked,
      available: true,
      testId: "profile-nav-account",
    },
  ];

  const NavButton = ({
    item,
    active,
    onClick,
  }: {
    item: (typeof navItems)[number];
    active: boolean;
    onClick: () => void;
  }) => {
    const Icon = item.icon;
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid={item.testId}
        aria-current={active ? "page" : undefined}
        className={cn(
          "focus-glow flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-all duration-300",
          active
            ? "bg-[var(--glass-bg)] font-medium text-foreground shadow-[0_1px_0_0_var(--hairline)]"
            : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] hover:text-foreground"
        )}
      >
        <Icon
          className={cn("size-4 shrink-0", active ? "text-[var(--scope-a)]" : "")}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
        <ChevronRight
          className={cn("size-3.5 shrink-0 transition-opacity", active ? "opacity-60" : "opacity-0")}
          aria-hidden="true"
        />
      </button>
    );
  };

  /* a section's heading — title, its quiet description */
  const SectionHead = ({
    title,
    desc,
    testId,
  }: {
    title: string;
    desc?: string;
    testId?: string;
  }) => (
    <div className="mb-5">
      <h2
        data-testid={testId}
        className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-foreground"
      >
        {title}
      </h2>
      {desc && (
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
          {desc}
        </p>
      )}
    </div>
  );

  const panel = "rounded-2xl border hairline bg-[var(--glass-bg-soft)]";

  /* ---------------- one section's content ---------------- */
  const renderSection = () => {
    switch (section) {
      case "profile":
        return (
          <div data-testid="profile-identity">
            <SectionHead
              title={t("Your profile")}
              desc={
                me
                  ? me.email.startsWith("anon:")
                    ? t("A gentle guest — the laboratory knows you by a light alone")
                    : me.email
                  : t("A quiet guest")
              }
            />
            <section aria-label={t("Identity")} className={cn(panel, "p-5 sm:p-6")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span
                  className="mono-label flex size-16 shrink-0 items-center justify-center rounded-2xl border hairline bg-[var(--glass-bg)] text-[26px] text-foreground/85 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.5)]"
                  aria-hidden="true"
                >
                  {me ? (me.name || me.email).slice(0, 1).toUpperCase() : "✦"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="ink-title truncate text-[20px] font-semibold leading-tight text-foreground/95">
                    {displayName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {signedIn && (
                      <span
                        className="mono-label rounded-full px-2 py-0.5 text-[8px] uppercase tracking-[0.16em] text-[var(--cy)]"
                        style={{ border: "1px solid color-mix(in srgb, var(--cy) 34%, transparent)" }}
                      >
                        {t("Keeper of a cosmic library")}
                      </span>
                    )}
                    {totalEntries > 0 && (
                      <span
                        className="mono-label rounded-full px-2 py-0.5 text-[8px] uppercase tracking-[0.16em] text-muted-foreground"
                        style={{ border: "1px solid var(--hairline)" }}
                      >
                        {totalEntries} {t("kept works")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  {signedIn ? (
                    <>
                      <button
                        type="button"
                        onClick={() => exitTo(openAccount)}
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
                      onClick={() => exitTo(() => openAuth("signin"))}
                      data-testid="profilepage-signin"
                      className="focus-glow flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[12.5px] font-medium text-background transition-all duration-300 hover:opacity-85"
                    >
                      <LogIn className="size-3.5" aria-hidden="true" />
                      {t("Enter the passage")}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* the sectors — the library at a glance */}
            <div className="mt-6">
              <p className="mono-label mb-2.5 text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Cosmic Library")}
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {Object.entries(SECTOR_META).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSection("library")}
                    className="focus-glow group flex items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3.5 py-3 text-left transition-all duration-300 hover:border-[var(--hairline-hover)]"
                  >
                    <span
                      className="mono-label flex size-8 shrink-0 items-center justify-center rounded-lg border hairline text-[13px] text-muted-foreground"
                      aria-hidden="true"
                    >
                      {meta.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium text-foreground/85">
                        {t(meta.label)}
                      </span>
                      <span className="mono-label block text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
                        {counts[key] ?? 0} {t("kept works")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {!signedIn && (
              <p className="mt-4 text-[12px] italic text-muted-foreground/80">
                {t("Sign in and your settings travel with you on every device.")}
              </p>
            )}
          </div>
        );

      case "settings":
        return (
          <div data-testid="profilepage-settings">
            <SectionHead
              title={t("Settings")}
              desc={t("Your settings — they travel with your passage")}
            />
            <section aria-label={t("Settings")} className={cn(panel, "divide-y hairline")}>
              {/* language */}
              <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <label
                  htmlFor="profile-language"
                  className="text-[13.5px] font-medium text-foreground/90"
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
                  className="w-full rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[13.5px] text-foreground transition-colors focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--scope-a)_45%,transparent)] sm:w-[280px]"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native} · {l.english}
                    </option>
                  ))}
                </select>
              </div>
              {/* voice */}
              <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <label
                  htmlFor="profile-voice"
                  className="text-[13.5px] font-medium text-foreground/90"
                >
                  {t("The voice that reads")}
                </label>
                <select
                  id="profile-voice"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as VoiceId)}
                  data-testid="profilepage-voice"
                  className="w-full rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[13.5px] text-foreground transition-colors focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--scope-a)_45%,transparent)] sm:w-[280px]"
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.character}
                    </option>
                  ))}
                </select>
              </div>
              {/* pace */}
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <label
                  htmlFor="profile-pace"
                  className="text-[13.5px] font-medium text-foreground/90"
                >
                  {t("Narration pace")}
                </label>
                <div className="flex w-full items-center gap-3 sm:w-[280px]">
                  <input
                    id="profile-pace"
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={pace}
                    onChange={(e) => setPace(Number(e.target.value))}
                    data-testid="profilepage-pace"
                    className="w-full accent-[var(--scope-a)]"
                  />
                  <span className="mono-label w-12 shrink-0 text-right text-[9.5px] text-muted-foreground">
                    ×{pace.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>
            {!signedIn && (
              <p className="mt-4 text-[12px] italic text-muted-foreground/80">
                {t("Sign in and your settings travel with you on every device.")}
              </p>
            )}
          </div>
        );

      case "seeds":
        return (
          <div data-testid="profilepage-seeds">
            <SectionHead
              title={t("Fields of expansion")}
              desc={t(
                "Name what you wish to be more informed and expansive in. A coherent, relevant phrase becomes a seed — new branches will grow from it in every field of the tree."
              )}
            />
            <section className={cn(panel, "p-5 sm:p-6")}>
              <div className="flex items-center gap-2">
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
              {!signedIn && (
                <p className="mt-3 text-[11px] italic text-muted-foreground/70">
                  {t("Sign in and your settings travel with you on every device.")}
                </p>
              )}
            </section>
          </div>
        );

      case "library":
        return (
          <div data-testid="profilepage-library">
            <SectionHead
              title={t("Cosmic Library")}
              desc={t(
                "Nothing rests here yet — every transmission you make is kept in your own sectors."
              )}
            />
            <section className={cn(panel, "p-5 sm:p-6")}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
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
                <button
                  type="button"
                  onClick={() => exitTo(openLibrary)}
                  data-testid="profilepage-library-open"
                  className="focus-glow flex h-8 shrink-0 items-center gap-1.5 rounded-full border hairline px-3 text-[11.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                >
                  {t("Open the library")}
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 space-y-1.5 border-t hairline pt-4">
                {entries === null ? (
                  <p
                    className="flex items-center gap-2 py-3 text-[12.5px] text-muted-foreground"
                    aria-busy="true"
                  >
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
                      onClick={() => exitTo(openLibrary)}
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
          </div>
        );

      case "dna":
        return (
          <div data-testid="profilepage-timeline">
            <SectionHead
              title={t("The path you have walked")}
              desc={t("The DNA of your curiosity — one colored rung per branch chased.")}
            />
            <section className={cn(panel, "p-5 sm:p-6")}>
              <div className="no-scrollbar overflow-x-auto">
                <DnaHelix steps={journey} />
              </div>
            </section>
            <SectionHead
              title={t("Your expansion mirror")}
              desc={t(
                "The algorithm that studies your continuations and reflects your progression back to you."
              )}
            />
            <ExpansionMirrorPanel />
          </div>
        );

      case "account":
        return (
          <div>
            <SectionHead
              title={t("Account & Credits")}
              desc={t(
                "Your chamber — plan, credits, usage, keys and security, all in one place."
              )}
            />
            <section className={cn(panel, "p-5 sm:p-6")}>
              {summaryLoading ? (
                <p
                  className="flex items-center gap-2 py-3 text-[12.5px] text-muted-foreground"
                  aria-busy="true"
                >
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                  {t("The shelves are being read…")}
                </p>
              ) : summary ? (
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  {[
                    {
                      icon: Gem,
                      value: summary.credits.balance != null
                        ? summary.credits.balance.toLocaleString("en-US")
                        : "—",
                      label: t("Credits"),
                      hint: summary.plan.label,
                    },
                    {
                      icon: CreditCard,
                      value: `${summary.usage.events30d}`,
                      label: t("Usage this month"),
                      hint: t("operations"),
                    },
                    {
                      icon: LibraryBig,
                      value: `${summary.libraryCount}`,
                      label: t("Cosmic Library"),
                      hint: t("kept works"),
                    },
                    {
                      icon: Sparkles,
                      value: `${seeds.length}`,
                      label: t("Fields of expansion"),
                      hint: "/ 6",
                    },
                  ].map((tile, i) => {
                    const Icon = tile.icon;
                    return (
                      <div
                        key={i}
                        className="rounded-xl border hairline bg-[var(--glass-bg)] px-3.5 py-3"
                      >
                        <Icon
                          className="size-3.5 text-[var(--cy)]"
                          aria-hidden="true"
                        />
                        <p className="mt-2 truncate text-[17px] font-semibold leading-none text-foreground/95">
                          {tile.value}
                        </p>
                        <p className="mt-1.5 truncate text-[11.5px] text-muted-foreground">
                          {tile.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-3 text-[12.5px] italic text-muted-foreground">
                  {t(
                    "Your chamber — plan, credits, usage, keys and security, all in one place."
                  )}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t hairline pt-4">
                <button
                  type="button"
                  onClick={() => exitTo(openAccount)}
                  className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[12.5px] text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                >
                  {t("Open the account chamber")}
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </button>
                {signedIn && (
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[12.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                  >
                    <LogOut className="size-3.5" aria-hidden="true" />
                    {t("Leave the passage")}
                  </button>
                )}
              </div>
            </section>
          </div>
        );
    }
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
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-8">
            <button
              type="button"
              onClick={close}
              data-testid="profile-back"
              className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-3.5 text-[12.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)] hover:bg-[var(--glass-bg)]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("Back to the Mirror")}</span>
              <span className="sm:hidden">{t("Back")}</span>
            </button>
            <span className="mono-label ml-auto hidden text-[9px] uppercase tracking-[0.26em] text-muted-foreground/60 sm:block">
              {t("The Mirror Entity Digital Chamber")}
            </span>
          </div>
        </header>

        {/* the room — a rail of doors on the left, one held panel on the right */}
        <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 gap-0 px-0 sm:px-8">
          {/* the rail — desktop */}
          <nav
            aria-label={t("Your profile")}
            className="hidden w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r hairline py-6 pr-4 md:flex nice-scroll"
          >
            {navItems
              .filter((n) => n.available)
              .map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={section === item.id}
                  onClick={() => setSection(item.id)}
                />
              ))}
          </nav>

          {/* the panel */}
          <div ref={scrollRef} className="nice-scroll min-w-0 flex-1 overflow-y-auto">
            {/* the rail — mobile: a horizontal strip of doors */}
            <nav
              aria-label={t("Your profile")}
              className="no-scrollbar flex gap-1.5 overflow-x-auto border-b hairline px-4 py-3 md:hidden"
            >
              {navItems
                .filter((n) => n.available)
                .map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSection(item.id)}
                      data-testid={item.testId}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "focus-glow flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-all duration-300",
                        active
                          ? "border-transparent bg-foreground font-medium text-background"
                          : "hairline text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="whitespace-nowrap">{t(item.label)}</span>
                    </button>
                  );
                })}
            </nav>

            <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
              {renderSection()}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

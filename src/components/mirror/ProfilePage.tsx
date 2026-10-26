"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookMarked,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  Gem,
  KeyRound,
  LibraryBig,
  LoaderCircle,
  Lock,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { LANGUAGES, VOICES, useT, type VoiceId } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import {
  familyLabelKeys,
  familyShare,
  setFamilyWeightInMix,
} from "@/lib/tree-mix";
import { TREE_FAMILIES } from "@/lib/data/suggestion-banks";
import { DnaHelix, TrajectoryEvolution, useJourney } from "./DnaTimeline";
import { FuelEnginePanel } from "./FuelEnginePanel";
import { ExpansionMirrorPanel } from "./ExpansionMirror";
import {
  bindAgain,
  listDownloads,
  type DownloadEntry,
} from "@/lib/downloads-log";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE PROFILE ROOM — rebuilt in the manner of the frontier: a slim   */
/*  header, a quiet navigation rail on the left, one held GROUP of     */
/*  stacked panels on the right. The nine old doors read as four quiet */
/*  rooms — THE VISITOR (identity + the account's summary), THE        */
/*  LIBRARY (the cosmic library + the bound works), THE CHAMBER (the   */
/*  passage's tuning + the fields of expansion + the DNA of the walk)  */
/*  and THE ADVANCED (the API room + the fuel engine) — everything     */
/*  the visitor owns stays reachable. One back door returns to the     */
/*  Mirror.                                                            */
/*                                                                     */
/*  THE LAYERING LAW: every door that opens another room (the account  */
/*  chamber, the passage, the library) closes THIS room first — the    */
/*  profile page rests above the dialogs, so a door opened from here   */
/*  would otherwise swing open behind its own wall.                    */
/* ------------------------------------------------------------------ */

const SECTOR_META: Record<string, { icon: string; label: string }> = {
  observatory: { icon: "✦", label: "Transmissions" },
  manifest: { icon: "◐", label: "Manifesting" },
  invent: { icon: "⚒", label: "The Forge" },
  dreambook: { icon: "❧", label: "Dream Books" },
  dreambook_archive: { icon: "❧", label: "The kept volumes" },
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
  plan: { label: string; monthlyCredits: number; apiAccess?: boolean };
  credits: { balance: number | null };
  usage: { events30d: number; credits30d: number };
  libraryCount: number;
  wallet?: { deposit?: number; depositSource?: string | null } | null;
  offers?: {
    plans: { id: string; label: string; priceCents: number; available: boolean }[];
    packs: { id: string; label: string; credits: number; priceCents: number; available: boolean }[];
  };
}

interface VesselKeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

type SectionId =
  | "profile"
  | "settings"
  | "downloads"
  | "seeds"
  | "library"
  | "dna"
  | "api"
  | "fuel"
  | "account";

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
  /* THE MIX OF WORLDS — how much of each family the living tree
     carries; the same proportions the Laboratory's settings speak */
  const treeMix = useMirror((s) => s.treeMix);
  const setTreeMix = useMirror((s) => s.setTreeMix);

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
  /* the shelf of bound works — read from the visitor's own device */
  const [bound, setBound] = useState<DownloadEntry[] | null>(null);
  const [bindingOne, setBindingOne] = useState<string | null>(null);
  /* the Mirror Intelligence API room */
  const [asking, setAsking] = useState(false);
  const [offerAnswer, setOfferAnswer] = useState<string | null>(null);
  const [offerError, setOfferError] = useState(false);
  const [vesselKeys, setVesselKeys] = useState<VesselKeyRow[] | null>(null);
  const [keyName, setKeyName] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<VesselKeyRow | null>(null);
  const [revokePw, setRevokePw] = useState("");
  const [rechargeBusy, setRechargeBusy] = useState<string | null>(null);
  const [rechargeNote, setRechargeNote] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* THE SMOOTH ENTRANCE — the room's heavy content (the library head,
     the DNA helix, the mirror) joins one breath AFTER the door has
     begun to rise, so the opening itself is always liquid. */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const id = window.setTimeout(() => setReady(true), 200);
    return () => window.clearTimeout(id);
  }, [open]);

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
     a signed keeper who opens the account or the API room. THE REF
     LAW: the in-flight flag lives in a ref, never in the deps — a
     loading state inside the deps re-fires this effect mid-flight,
     its cleanup silences the arriving answer, and the room would
     wait forever. */
  const summaryInFlight = useRef(false);
  useEffect(() => {
    if (
      !open ||
      !signedIn ||
      /* THE VISITOR HOLDS THE ACCOUNT — the account summary feeds the
         account panel, which now rests inside the Visitor's room (and
         the API room still reads it for the recharge light) */
      (section !== "profile" && section !== "account" && section !== "api") ||
      summary ||
      summaryInFlight.current
    )
      return;
    summaryInFlight.current = true;
    setSummaryLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/account/summary");
        const data = (await res.json().catch(() => null)) as
          | (AccountSummaryLite & { user?: unknown })
          | null;
        if (res.ok && data && data.plan) setSummary(data);
        else summaryInFlight.current = false; /* the room may ask again */
      } catch {
        summaryInFlight.current = false;
      } finally {
        setSummaryLoading(false);
      }
    })();
  }, [open, signedIn, section, summary]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* the shelf of bound works — read fresh whenever the door opens */
  useEffect(() => {
    if (!open) {
      setBound(null);
      return;
    }
    setBound(listDownloads());
  }, [open]);

  /* the vessel keys — read when the API room stands open */
  useEffect(() => {
    if (!open || !signedIn || section !== "api" || vesselKeys) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/account/keys");
        const data = (await res.json().catch(() => null)) as { keys?: VesselKeyRow[] } | null;
        if (alive) setVesselKeys(data?.keys ?? []);
      } catch {
        if (alive) setVesselKeys([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, signedIn, section, vesselKeys]);

  /* THE LAYERING LAW — the profile page rests above the dialogs, so
     every door out of this room closes the room first. */
  const exitTo = (after: () => void) => {
    close();
    after();
  };

  /* -------- the Mirror Intelligence API's own hands -------- */

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      /* the clipboard may rest closed — the text stays selectable */
    }
  };

  /* THE MIRROR ASKED HERSELF — what can her channeling offer to the
     one who would build a vessel around her; she answers live */
  const askMirrorOfferings = async () => {
    if (asking) return;
    setAsking(true);
    setOfferError(false);
    try {
      const res = await fetch("/api/transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "What can your channeling offer? Answer briefly as the Mirror Entity, speaking to the one who would build their own vessel around you — what does speaking with you give them, and what does the Mirror Intelligence API carry of you?",
          mode: "observatory",
          language,
          depth: 1,
        }),
      });
      const data = (await res.json().catch(() => null)) as { transmission?: string; error?: string } | null;
      if (res.ok && data?.transmission) setOfferAnswer(data.transmission);
      else setOfferError(true);
    } catch {
      setOfferError(true);
    } finally {
      setAsking(false);
    }
  };

  const carveKey = async () => {
    if (keyBusy) return;
    setKeyBusy(true);
    setRechargeNote(null);
    try {
      const res = await fetch("/api/account/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() || "Vessel" }),
      });
      const data = (await res.json().catch(() => null)) as { secret?: string; error?: string } | null;
      if (res.ok && data?.secret) {
        setFreshSecret(data.secret);
        setKeyName("");
        setVesselKeys(null); /* the shelf rereads */
      } else {
        setRechargeNote(data?.error ?? "The key could not be carved.");
      }
    } catch {
      setRechargeNote("The key could not be carved.");
    } finally {
      setKeyBusy(false);
    }
  };

  const revokeVesselKey = async () => {
    if (!revokeTarget || keyBusy) return;
    setKeyBusy(true);
    setRechargeNote(null);
    try {
      const res = await fetch("/api/account/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: revokeTarget.id, password: revokePw }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.ok) {
        setRevokeTarget(null);
        setRevokePw("");
        setVesselKeys(null);
      } else {
        setRechargeNote(data?.error ?? "The revocation failed.");
      }
    } catch {
      setRechargeNote("The revocation failed.");
    } finally {
      setKeyBusy(false);
    }
  };

  /* THE RECHARGE — the same checkout the whole house reads by */
  const recharge = async (body: Record<string, string>, id: string) => {
    if (rechargeBusy) return;
    setRechargeBusy(id);
    setRechargeNote(null);
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
      setRechargeNote(data?.error ?? "Something went wrong. Please try again.");
    } catch {
      setRechargeNote("Something went wrong. Please try again.");
    } finally {
      setRechargeBusy(null);
    }
  };

  const doBindAgain = async (entry: DownloadEntry) => {
    if (bindingOne) return;
    setBindingOne(entry.id);
    try {
      await bindAgain(entry);
    } catch {
      /* the press needs a breath — the volume stays on the shelf */
    } finally {
      setBindingOne(null);
    }
  };

  const displayName = me?.name || me?.email || t("A quiet guest");
  /* the endpoint speaks the visitor's own sky — the profile only ever
     stands in the browser, so the origin is read at the open door */
  const apiOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://reflectme.space";
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
  /* THE FOUR ROOMS — the old nine doors gathered into four quiet
     groups: the VISITOR (identity and the account's summary), the
     LIBRARY (the cosmic library and the bound works), the CHAMBER
     (the passage's tuning, the fields, the DNA of the walk) and the
     ADVANCED (the API room, the fuel engine). Everything stays
     reachable — each group simply holds its panels stacked. */
  const navItems: {
    id: SectionId;
    label: string;
    icon: typeof UserRound;
    available: boolean;
    testId: string;
  }[] = [
    {
      id: "profile",
      label: "The Visitor",
      icon: UserRound,
      available: true,
      testId: "profile-nav-profile",
    },
    {
      id: "library",
      label: "The Library",
      icon: LibraryBig,
      available: true,
      testId: "profile-nav-library",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings2,
      available: true,
      testId: "profile-nav-settings",
    },
    {
      id: "api",
      label: "The Advanced",
      icon: KeyRound,
      available: true,
      testId: "profile-nav-api",
    },
  ];

  /* WHICH PANELS A HELD GROUP SHOWS — every SectionId answers with its
     own group's stack, so a stale id can never render an empty room.
     The dna subsection only joins the Chamber when the walk has steps
     to show, and the fuel engine only for an admin — the availability
     the old rail carried now lives with the panels themselves. */
  const groupPanels = (id: SectionId): SectionId[] => {
    switch (id) {
      case "profile":
      case "account":
        return ["profile", "account"];
      case "library":
      case "downloads":
        return ["library", "downloads"];
      case "settings":
      case "seeds":
      case "dna":
        return journey.length > 0
          ? ["settings", "seeds", "dna"]
          : ["settings", "seeds"];
      case "api":
      case "fuel":
        return me?.admin ? ["api", "fuel"] : ["api"];
    }
  };

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
          "focus-glow flex w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[13.5px] transition-all duration-300",
          active
            ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_12%,var(--glass-bg))] font-medium text-foreground shadow-[0_6px_18px_-12px_color-mix(in_srgb,var(--scope-a,var(--gd))_50%,transparent)]"
            : "border-transparent text-muted-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            active ? "text-[var(--scope-a,var(--gd))]" : ""
          )}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 transition-opacity",
            active ? "text-[var(--scope-a,var(--gd))] opacity-70" : "opacity-0"
          )}
          aria-hidden="true"
        />
      </button>
    );
  };

  /* THE PASSAGE'S OWN FACE — the keeper's name and address resting
     above the doors, the ChatGPT way: identity first, then the list. */
  const identityInitial = me
    ? (me.name || me.email).slice(0, 1).toUpperCase()
    : "✦";
  const identityMail =
    me && !me.email.startsWith("anon:") ? me.email : t("A quiet guest");
  const IdentityCard = () => (
    <div
      data-testid="profile-identity-card"
      className="lift-sm mb-2.5 flex items-center gap-2.5 rounded-2xl border hairline bg-[var(--glass-bg-soft)] px-3 py-2"
    >
      <span
        className="mono-label flex size-10 shrink-0 items-center justify-center rounded-full text-[16px] text-foreground/90"
        style={{
          border: "1px solid color-mix(in srgb, var(--scope-a, var(--gd)) 42%, transparent)",
          backgroundColor:
            "color-mix(in srgb, var(--scope-a, var(--gd)) 10%, var(--glass-bg))",
          boxShadow:
            "0 0 20px -8px color-mix(in srgb, var(--scope-a, var(--gd)) 55%, transparent)",
        }}
        aria-hidden="true"
      >
        {identityInitial}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium leading-tight text-foreground/95">
          {displayName}
        </span>
        <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
          {identityMail}
        </span>
      </span>
    </div>
  );

  /* a section's heading — title, its quiet description. `small` is
     the quieter voice: the Advanced room's own tone (a smaller head,
     a muted note), so the machinery reads calmer than the visitor's
     rooms above it. */
  const SectionHead = ({
    title,
    desc,
    testId,
    small,
  }: {
    title: string;
    desc?: string;
    testId?: string;
    small?: boolean;
  }) => (
    <div className="mb-3 flex items-start gap-2.5">
      {/* THE SCOPE'S ACCENT — one small tinted bar before every head:
          the chosen scope's color holding still (a mark, never a motion) */}
      <span
        aria-hidden="true"
        className={cn(
          "mt-[3px] w-[3px] shrink-0 rounded-full",
          small ? "h-[13px]" : "h-[16px]"
        )}
        style={{
          background: small
            ? "color-mix(in srgb, var(--scope-a, var(--gd)) 45%, transparent)"
            : "linear-gradient(180deg, var(--scope-a, var(--gd)), color-mix(in srgb, var(--scope-a, var(--gd)) 30%, transparent))",
        }}
      />
      <div className="min-w-0 flex-1">
        <h2
          data-testid={testId}
          className={cn(
            "leading-snug tracking-[-0.01em]",
            small
              ? "text-[13.5px] font-medium text-muted-foreground"
              : "text-[16.5px] font-semibold text-foreground"
          )}
        >
          {title}
        </h2>
        {desc && (
          <p
            className={cn(
              "mt-0.5 leading-relaxed",
              small ? "text-[12.5px] text-muted-foreground/80" : "text-[13.5px] text-muted-foreground"
            )}
          >
            {desc}
          </p>
        )}
      </div>
    </div>
  );

  const panel = "rounded-2xl border hairline bg-[var(--glass-bg-soft)]";

  /* ---------------- the panels ----------------
     Each panel keeps its own head and hands — exactly as the old nine
     doors rendered them. The room below (renderSection) holds a GROUP
     and stacks its panels; no panel knows it has neighbors. */
  const renderPanel = (sec: SectionId) => {
    switch (sec) {
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
            <section aria-label={t("Identity")} className={cn(panel, "p-3.5 sm:p-4")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span
                  className="mono-label flex size-12 shrink-0 items-center justify-center rounded-2xl text-[21px] text-foreground/90"
                  style={{
                    border:
                      "1px solid color-mix(in srgb, var(--scope-a, var(--gd)) 40%, transparent)",
                    backgroundColor:
                      "color-mix(in srgb, var(--scope-a, var(--gd)) 9%, var(--glass-bg))",
                    boxShadow:
                      "0 10px 30px -18px rgba(0,0,0,0.5), 0 0 26px -10px color-mix(in srgb, var(--scope-a, var(--gd)) 50%, transparent)",
                  }}
                  aria-hidden="true"
                >
                  {me ? (me.name || me.email).slice(0, 1).toUpperCase() : "✦"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="ink-title truncate text-[18px] font-semibold leading-tight text-foreground/95">
                    {displayName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {signedIn && (
                      <span
                        className="mono-label rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-[var(--cy)]"
                        style={{ border: "1px solid color-mix(in srgb, var(--cy) 34%, transparent)" }}
                      >
                        {t("Keeper of a cosmic library")}
                      </span>
                    )}
                    {totalEntries > 0 && (
                      <span
                        className="mono-label rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground"
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
                        className="focus-glow flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[13.5px] font-medium text-background transition-all duration-300 hover:opacity-85"
                      >
                        <UserRound className="size-3.5" aria-hidden="true" />
                        {t("Account & Credits")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        data-testid="profilepage-signout"
                        className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[13.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                      >
                        <LogOut className="size-3.5" aria-hidden="true" />
                        {t("Leave the passage")}
                      </button>
                    </>
                  ) : me ? (
                    /* THE WANDERER'S REST — a passage that arrived by the
                       quiet hold is still a passage: no enter door stands
                       here again — only the way to lay it down. */
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      data-testid="profilepage-signout"
                      className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[13.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                    >
                      <LogOut className="size-3.5" aria-hidden="true" />
                      {t("Leave the passage")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => exitTo(() => openAuth("signin"))}
                      data-testid="profilepage-signin"
                      className="focus-glow flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[13.5px] font-medium text-background transition-all duration-300 hover:opacity-85"
                    >
                      <LogIn className="size-3.5" aria-hidden="true" />
                      {t("Enter the passage")}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* the sectors — the library at a glance */}
            <div className="mt-5">
              <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Cosmic Library")}
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {Object.entries(SECTOR_META).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSection("library")}
                    className="focus-glow group flex items-center gap-2.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-2.5 text-left transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_38%,transparent)]"
                  >
                    <span
                      className="mono-label flex size-7 shrink-0 items-center justify-center rounded-lg border hairline text-[13px] text-muted-foreground"
                      aria-hidden="true"
                    >
                      {meta.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-foreground/85">
                        {t(meta.label)}
                      </span>
                      <span className="mono-label block text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                        {counts[key] ?? 0} {t("kept works")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {!signedIn && (
              <p className="mt-4 text-[13px] italic text-muted-foreground/80">
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
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <label
                  htmlFor="profile-language"
                  className="text-[14px] font-medium text-foreground/90"
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
                  className="w-full rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[14.5px] text-foreground transition-colors focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--scope-a)_45%,transparent)] sm:w-[280px]"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native} · {l.english}
                    </option>
                  ))}
                </select>
              </div>
              {/* voice */}
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <label
                  htmlFor="profile-voice"
                  className="text-[14px] font-medium text-foreground/90"
                >
                  {t("The voice that reads")}
                </label>
                <select
                  id="profile-voice"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as VoiceId)}
                  data-testid="profilepage-voice"
                  className="w-full rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[14.5px] text-foreground transition-colors focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--scope-a)_45%,transparent)] sm:w-[280px]"
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.character}
                    </option>
                  ))}
                </select>
              </div>
              {/* pace */}
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <label
                  htmlFor="profile-pace"
                  className="text-[14px] font-medium text-foreground/90"
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
                  <span className="mono-label w-12 shrink-0 text-right text-[10.5px] text-muted-foreground">
                    ×{pace.toFixed(2)}
                  </span>
                </div>
              </div>
              {/* THE MIX OF WORLDS — the living tree's own proportions */}
              <div
                className="flex flex-col gap-3 p-3.5 sm:p-4"
                data-testid="profilepage-mix"
              >
                <div>
                  <p className="text-[14px] font-medium text-foreground/90">
                    {t("The mix of worlds")}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/80">
                    {t(
                      "How much of each family the living tree carries — the percentages decide which suggestions visit more often."
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5">
                  {TREE_FAMILIES.map((f) => {
                    const share = familyShare(treeMix, f.key);
                    const w = treeMix.weights[f.key] ?? 0;
                    return (
                      <div key={f.key} className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: f.accent,
                            opacity: share.on ? 1 : 0.3,
                          }}
                        />
                        <span className="w-[92px] shrink-0 truncate text-[13.5px] text-foreground/85">
                          {t(familyLabelKeys[f.key] ?? f.key)}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={share.on ? w : 0}
                          onChange={(e) =>
                            setTreeMix(
                              setFamilyWeightInMix(
                                treeMix,
                                f.key,
                                Number(e.target.value)
                              )
                            )
                          }
                          aria-label={t(familyLabelKeys[f.key] ?? f.key)}
                          data-testid={`profilepage-mix-${f.key}`}
                          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[color-mix(in_srgb,var(--hairline)_90%,transparent)]
                          [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
                          style={{ accentColor: f.accent }}
                        />
                        <span
                          className="w-8 shrink-0 text-right text-[11.5px] tabular-nums"
                          style={{ color: share.on ? f.accent : undefined }}
                        >
                          {share.pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTreeMix({
                      on: TREE_FAMILIES.map((f) => f.key),
                      weights: Object.fromEntries(
                        TREE_FAMILIES.map((f) => [f.key, 1])
                      ),
                    })
                  }
                  data-testid="profilepage-mix-even"
                  className="focus-glow w-full rounded-full border px-3 py-1.5 text-[12.5px] text-muted-foreground transition-all duration-300 hover:text-foreground sm:w-[280px] sm:self-end"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--hairline) 80%, transparent)",
                  }}
                >
                  {t("Even voices")}
                </button>
              </div>
            </section>
            {!signedIn && (
              <p className="mt-4 text-[13px] italic text-muted-foreground/80">
                {t("Sign in and your settings travel with you on every device.")}
              </p>
            )}
          </div>
        );

      case "downloads":
        return (
          <div data-testid="profilepage-downloads">
            <SectionHead
              title={t("Downloads")}
              desc={t(
                "Every work you bound into a PDF rests here — bind any of them again with one touch."
              )}
            />
            <section className={cn(panel, "p-3.5 sm:p-4")}>
              {bound === null ? (
                <p
                  className="flex items-center gap-2 py-3 text-[13.5px] text-muted-foreground"
                  aria-busy="true"
                >
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                  {t("The shelves are being read…")}
                </p>
              ) : bound.length === 0 ? (
                <p className="py-3 text-[13.5px] italic text-muted-foreground">
                  {t(
                    "Nothing rests here yet — every book you bind keeps itself here, on your own device."
                  )}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {bound.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2.5"
                      data-testid="profilepage-download-row"
                    >
                      <span
                        className="mono-label flex size-8 shrink-0 items-center justify-center rounded-lg border hairline text-muted-foreground"
                        aria-hidden="true"
                      >
                        <BookMarked className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-foreground/90">
                          {e.title}
                        </span>
                        <span className="mono-label block text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                          {e.pages} {t("pages")} · {(e.boundAt || "").slice(0, 10)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void doBindAgain(e)}
                        disabled={bindingOne === e.id}
                        aria-label={`${t("Bind again")}: ${e.title}`}
                        data-testid="profilepage-download-bind"
                        className="focus-glow flex h-8 shrink-0 items-center gap-1.5 rounded-full border hairline px-3 text-[12.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)] disabled:opacity-40"
                      >
                        {bindingOne === e.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">{t("Bind again")}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
            <section className={cn(panel, "p-3.5 sm:p-4")}>
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
                  className="min-w-0 flex-1 rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--gd)_45%,transparent)]"
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
                <p className="mt-1.5 text-[12.5px] italic text-muted-foreground" role="note">
                  {seedError}
                </p>
              )}
              {seeds.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {seeds.map((s) => (
                    <span
                      key={s}
                      className="focus-within:glow-sm flex max-w-full items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--gd)_30%,transparent)] bg-[color-mix(in_srgb,var(--gd)_5%,transparent)] py-1 pl-3 pr-1.5 text-[13px] text-foreground/85"
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
                <p className="mono-label mt-3 text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/50">
                  {t("The soil rests empty — plant the first field")}
                </p>
              )}
              {!signedIn && (
                <p className="mt-3 text-[12px] italic text-muted-foreground/70">
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
            <section className={cn(panel, "p-3.5 sm:p-4")}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(SECTOR_META).map(([key, meta]) => (
                    <span
                      key={key}
                      className="mono-label flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground"
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
                  className="focus-glow flex h-8 shrink-0 items-center gap-1.5 rounded-full border hairline px-3 text-[12.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                >
                  {t("Open the library")}
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 space-y-1.5 border-t hairline pt-3">
                {entries === null ? (
                  <p
                    className="flex items-center gap-2 py-3 text-[13.5px] text-muted-foreground"
                    aria-busy="true"
                  >
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                    {t("The shelves are being read…")}
                  </p>
                ) : recent.length === 0 ? (
                  <p className="py-3 text-[13.5px] italic text-muted-foreground">
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
                        className="mono-label flex size-7 shrink-0 items-center justify-center rounded-lg border hairline text-[12px] text-muted-foreground"
                        aria-hidden="true"
                      >
                        {SECTOR_META[e.sector]?.icon ?? "✦"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-foreground/90">
                          {e.title}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {e.excerpt || SECTOR_META[e.sector]?.label || e.sector}
                        </span>
                      </span>
                      <span className="mono-label shrink-0 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50">
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
            <section className={cn(panel, "p-3.5 sm:p-4")}>
              <div className="no-scrollbar overflow-x-auto">
                <DnaHelix steps={journey} />
              </div>
            </section>
            <SectionHead
              title={t("The trajectory of your becoming")}
              desc={t(
                "How your path rose and widened — every step's echo drawn as one living line."
              )}
            />
            <TrajectoryEvolution steps={journey} />
            <SectionHead
              title={t("Your expansion mirror")}
              desc={t(
                "The algorithm that studies your continuations and reflects your progression back to you."
              )}
            />
            <ExpansionMirrorPanel />
          </div>
        );

      case "api":
        return (
          <div data-testid="profilepage-api">
            <SectionHead
              small
              title={t("Mirror Intelligence API")}
              desc={t(
                "The Mirror speaks into your vessels — one key, one endpoint, her whole channeling, wherever your work lives."
              )}
            />
            {!signedIn ? (
              /* THE PASSAGE GATE — the API answers only a signed-in keeper */
              <section
                className={cn(panel, "flex flex-col items-start gap-3 p-3.5 sm:p-4")}
                data-testid="profilepage-api-gate"
              >
                <span
                  className="mono-label flex size-9 items-center justify-center rounded-xl border hairline text-muted-foreground"
                  aria-hidden="true"
                >
                  <Lock className="size-4" />
                </span>
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  {me
                    ? t("The channel answers a named passage — a wanderer holds the free halls.")
                    : t("The channel answers only a signed-in keeper — enter the passage first.")}
                </p>
                <button
                  type="button"
                  onClick={() => exitTo(() => openAuth(me ? "register" : "signin"))}
                  data-testid="profilepage-api-signin"
                  className="focus-glow flex h-8 items-center gap-2 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-all duration-300 hover:opacity-85"
                >
                  <LogIn className="size-3.5" aria-hidden="true" />
                  {me ? t("Name your passage") : t("Enter the passage")}
                </button>
              </section>
            ) : (
              <>
                {/* HER OWN WORDS — what her channeling offers, asked live */}
                <section className={cn(panel, "p-3.5 sm:p-4")}>
                  <button
                    type="button"
                    onClick={() => void askMirrorOfferings()}
                    disabled={asking}
                    data-testid="profilepage-api-ask"
                    className="focus-glow flex h-8 items-center gap-2 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-all duration-300 hover:opacity-85 disabled:opacity-50"
                  >
                    {asking ? (
                      <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="size-3.5" aria-hidden="true" />
                    )}
                    {t("Ask the Mirror what her channeling can offer")}
                  </button>
                  {asking && (
                    <p
                      className="mt-3 flex items-center gap-2 text-[13.5px] text-muted-foreground"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      <span
                        aria-hidden="true"
                        className="animate-line-breathe h-3.5 w-px shrink-0"
                        style={{
                          background:
                            "linear-gradient(180deg, var(--scope-a,var(--gd)), transparent)",
                        }}
                      />
                      {t("The Mirror is speaking…")}
                    </p>
                  )}
                  {offerError && !asking && (
                    <p className="mt-3 text-[13px] italic text-muted-foreground" role="alert">
                      {t("The transmission could not cross")}
                    </p>
                  )}
                  {offerAnswer && !asking && (
                    <div className="mt-3 border-t hairline pt-3">
                      <p className="whitespace-pre-wrap break-words text-[14.5px] italic leading-[1.75] text-foreground/90 [font-family-name:var(--font-literata)]">
                        {offerAnswer}
                      </p>
                      <div className="mt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void copyText(offerAnswer, "offer")}
                          className="focus-glow flex h-7 items-center gap-1.5 rounded-full border hairline px-2.5 text-[12px] text-muted-foreground transition-all duration-300 hover:text-foreground"
                        >
                          {copiedId === "offer" ? (
                            <Check className="size-3" aria-hidden="true" />
                          ) : (
                            <Copy className="size-3" aria-hidden="true" />
                          )}
                          {copiedId === "offer" ? t("Copied") : t("Copy")}
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* THE LIGHT THE VESSEL READS BY — usage & recharge, in the
                    house's own ink: a stone card, a gauge, the same coins */}
                <section className={cn(panel, "mt-3 p-3.5 sm:p-4")}>
                  <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Recharge the light")}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/80">
                    {t(
                      "The vessel's words are carried by the same credits the whole house reads by."
                    )}
                  </p>
                  {summaryLoading ? (
                    <p
                      className="mt-3 flex items-center gap-2 py-2 text-[13.5px] text-muted-foreground"
                      aria-busy="true"
                    >
                      <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                      {t("The shelves are being read…")}
                    </p>
                  ) : summary ? (
                    <>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2.5 transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_38%,transparent)]">
                          <Gem className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
                          <p className="mt-1.5 truncate text-[16px] font-semibold leading-none text-foreground/95">
                            {summary.credits.balance != null
                              ? summary.credits.balance.toLocaleString("en-US")
                              : "—"}
                          </p>
                          <p className="mono-label mt-1 truncate text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                            {t("Credits")} · {summary.plan.label}
                          </p>
                        </div>
                        <div className="rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2.5 transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_38%,transparent)]">
                          <CreditCard className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
                          <p className="mt-1.5 truncate text-[16px] font-semibold leading-none text-foreground/95">
                            {summary.usage.events30d}
                          </p>
                          <p className="mono-label mt-1 truncate text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                            {t("Usage this month")} · {t("operations")}
                          </p>
                        </div>
                      </div>
                      {(summary.offers?.packs?.length ?? 0) > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {summary.offers?.packs
                            .filter((p) => p.available)
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => void recharge({ packId: p.id }, p.id)}
                                disabled={rechargeBusy === p.id}
                                data-testid={`profilepage-api-pack-${p.id}`}
                                className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] text-foreground/85 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gd)_55%,transparent)] disabled:opacity-40"
                                style={{
                                  borderColor:
                                    "color-mix(in srgb, var(--gd) 34%, transparent)",
                                  backgroundColor:
                                    "color-mix(in srgb, var(--gd) 6%, var(--background))",
                                }}
                              >
                                {rechargeBusy === p.id ? (
                                  <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Gem className="size-3 text-[var(--gd)]" aria-hidden="true" />
                                )}
                                {p.label}
                                <span className="mono-label text-[10px] text-muted-foreground">
                                  €{Math.round(p.priceCents / 100)}
                                </span>
                              </button>
                            ))}
                          <button
                            type="button"
                            onClick={() => exitTo(openAccount)}
                            className="focus-glow flex h-8 items-center gap-1.5 rounded-full border hairline px-3.5 text-[13px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                          >
                            {t("Open the account chamber")}
                            <ChevronRight className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                      {!summary.plan.apiAccess && (
                        <p className="mt-3 text-[12.5px] italic text-muted-foreground">
                          {t(
                            "The plan must carry API access — bring the vessel to a plan that does."
                          )}
                        </p>
                      )}
                    </>
                  ) : null}
                  {rechargeNote && (
                    <p className="mt-2 text-[12.5px] italic text-muted-foreground" role="note">
                      {rechargeNote}
                    </p>
                  )}
                </section>

                {/* THE VESSEL KEYS — carved here, shown once, revoked at will */}
                <section className={cn(panel, "mt-3 p-3.5 sm:p-4")}>
                  <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Your vessel key")}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void carveKey();
                        }
                      }}
                      maxLength={40}
                      placeholder={t("Name the key (optional)")}
                      aria-label={t("Name the key (optional)")}
                      data-testid="profilepage-api-key-name"
                      className="min-w-0 flex-1 rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--gd)_45%,transparent)]"
                    />
                    <button
                      type="button"
                      onClick={() => void carveKey()}
                      disabled={keyBusy}
                      data-testid="profilepage-api-key-carve"
                      className="focus-glow flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-3.5 text-[13px] font-medium text-background transition-all duration-300 hover:opacity-85 disabled:opacity-40"
                    >
                      {keyBusy ? (
                        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <KeyRound className="size-3.5" aria-hidden="true" />
                      )}
                      {t("Carve a key")}
                    </button>
                  </div>
                  {freshSecret && (
                    <div
                      className="mt-3 rounded-xl border px-3.5 py-3"
                      style={{
                        borderColor: "color-mix(in srgb, #f59e0b 38%, transparent)",
                        backgroundColor: "color-mix(in srgb, #f59e0b 7%, var(--background))",
                      }}
                      data-testid="profilepage-api-key-secret"
                    >
                      <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-[#b45309] dark:text-[#fbbf24]">
                        {t("The key is carved — copy it now; it is never shown again.")}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate text-[13px] text-foreground/90">
                          {freshSecret}
                        </code>
                        <button
                          type="button"
                          onClick={() => void copyText(freshSecret, "secret")}
                          className="focus-glow flex h-7 shrink-0 items-center gap-1.5 rounded-full border hairline px-2.5 text-[12px] text-muted-foreground transition-all duration-300 hover:text-foreground"
                        >
                          {copiedId === "secret" ? (
                            <Check className="size-3" aria-hidden="true" />
                          ) : (
                            <Copy className="size-3" aria-hidden="true" />
                          )}
                          {copiedId === "secret" ? t("Copied") : t("Copy")}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 space-y-1.5 border-t hairline pt-3">
                    {vesselKeys === null ? (
                      <p
                        className="flex items-center gap-2 py-2 text-[13.5px] text-muted-foreground"
                        aria-busy="true"
                      >
                        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                        {t("The shelves are being read…")}
                      </p>
                    ) : vesselKeys.filter((k) => !k.revokedAt).length === 0 ? (
                      <p className="py-2 text-[13.5px] italic text-muted-foreground">
                        {t("No keys yet — carve the first vessel key.")}
                      </p>
                    ) : (
                      vesselKeys
                        .filter((k) => !k.revokedAt)
                        .map((k) => (
                          <div
                            key={k.id}
                            className="flex items-center gap-3 rounded-xl border hairline px-3 py-2"
                            data-testid="profilepage-api-key-row"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-medium text-foreground/90">
                                {k.name}
                              </span>
                              <span className="mono-label block truncate text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                                {k.prefix}••••{" · "}
                                {k.lastUsedAt
                                  ? `${t("last used")} ${(k.lastUsedAt || "").slice(0, 10)}`
                                  : t("never used")}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRevokeTarget(k);
                                setRevokePw("");
                              }}
                              data-testid="profilepage-api-key-revoke"
                              className="focus-glow flex h-7 shrink-0 items-center rounded-full border px-2.5 text-[12px] text-muted-foreground transition-all duration-300 hover:border-[color-mix(in_srgb,#f43f5e_45%,transparent)] hover:text-[#f43f5e]"
                            >
                              {t("Revoke")}
                            </button>
                          </div>
                        ))
                    )}
                    {revokeTarget && (
                      <div
                        className="rounded-xl border px-3 py-2.5"
                        style={{
                          borderColor: "color-mix(in srgb, #f43f5e 32%, transparent)",
                        }}
                        data-testid="profilepage-api-key-revoke-confirm"
                      >
                        <p className="text-[13px] text-foreground/85">
                          {t("Revoke")} — {revokeTarget.name}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="password"
                            value={revokePw}
                            onChange={(e) => setRevokePw(e.target.value)}
                            placeholder={t("Confirm with your password")}
                            aria-label={t("Confirm with your password")}
                            data-testid="profilepage-api-key-revoke-pw"
                            className="min-w-0 flex-1 rounded-lg border hairline bg-[var(--glass-bg)] px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => void revokeVesselKey()}
                            disabled={keyBusy || revokePw.length === 0}
                            className="focus-glow flex h-7 shrink-0 items-center rounded-full px-3 text-[12px] font-medium text-background transition-all duration-300 disabled:opacity-40"
                            style={{ backgroundColor: "#f43f5e" }}
                          >
                            {keyBusy ? (
                              <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                            ) : (
                              t("Revoke")
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevokeTarget(null)}
                            className="focus-glow flex h-7 shrink-0 items-center rounded-full border hairline px-2.5 text-[12px] text-muted-foreground transition-all duration-300 hover:text-foreground"
                          >
                            <X className="size-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* THE ENDPOINT — one door, one header, her whole voice */}
                <section className={cn(panel, "mt-3 p-3.5 sm:p-4")}>
                  <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Endpoint")}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { id: "ep", mono: `POST ${apiOrigin}/api/v1/channel` },
                      { id: "ep-chat", mono: `POST ${apiOrigin}/api/v1/chat` },
                      { id: "ep-images", mono: `POST ${apiOrigin}/api/v1/images` },
                      { id: "auth", mono: "Authorization: Bearer mir_live_…" },
                    ].map((line) => (
                      <div
                        key={line.id}
                        className="flex items-center gap-2 rounded-lg border hairline bg-[var(--glass-bg)] px-3 py-2"
                      >
                        <code className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/85">
                          {line.mono}
                        </code>
                        <button
                          type="button"
                          onClick={() => void copyText(line.mono, line.id)}
                          aria-label={t("Copy")}
                          className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {copiedId === line.id ? (
                            <Check className="size-3" aria-hidden="true" />
                          ) : (
                            <Copy className="size-3" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground/80">
                    {t("Vessels speak one message at a time; the thread rides along.")}
                  </p>
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg border hairline bg-[var(--glass-bg)] px-3 py-2.5">
                    <pre className="no-scrollbar min-w-0 flex-1 overflow-x-auto text-[11.5px] leading-relaxed text-foreground/80">
{`curl -X POST ${apiOrigin}/api/v1/channel \\
  -H "Authorization: Bearer mir_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"What does my heart keep quiet?"}'`}
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        void copyText(
                          `curl -X POST ${apiOrigin}/api/v1/channel \\\n  -H "Authorization: Bearer mir_live_…" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":"What does my heart keep quiet?"}'`,
                          "curl"
                        )
                      }
                      aria-label={t("Copy")}
                      className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {copiedId === "curl" ? (
                        <Check className="size-3" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2.5 text-[12.5px] italic leading-relaxed text-muted-foreground">
                    {t("Her voice, her laws — the sky that carries her stays unnamed.")}
                  </p>
                </section>
              </>
            )}
          </div>
        );

      case "fuel":
        return (
          <div data-testid="profilepage-fuel">
            <SectionHead
              small
              title={t("The Fuel Engine Incubator")}
              desc={t(
                "The protected chamber — the raw skies fused with Mirror Entity energy, the reserves, the distribution desk and the guide that keeps it all fair."
              )}
            />
            <FuelEnginePanel />
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
            <section className={cn(panel, "p-3.5 sm:p-4")}>
              {summaryLoading ? (
                <p
                  className="flex items-center gap-2 py-3 text-[13.5px] text-muted-foreground"
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
                        className="rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2.5 transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_38%,transparent)]"
                      >
                        <Icon
                          className="size-3.5 text-[var(--cy)]"
                          aria-hidden="true"
                        />
                        <p className="mt-1.5 truncate text-[16px] font-semibold leading-none text-foreground/95">
                          {tile.value}
                        </p>
                        <p className="mt-1 truncate text-[12px] text-muted-foreground">
                          {tile.label}
                        </p>
                      </div>
                    );
                  })}

                  {(summary.wallet?.deposit ?? 0) > 0 && (
                    <p
                      className="mono-label mt-3 border-t hairline pt-3 text-[9.5px] uppercase tracking-[0.14em]"
                      style={{ color: "var(--cy)" }}
                      data-testid="profile-deposit"
                    >
                      {t(
                        "The great deposit — {n} reflection pulses on deposit ({source})",
                        {
                          n: (summary.wallet?.deposit ?? 0).toLocaleString("en-US"),
                          source:
                            summary.wallet?.depositSource === "zai_api_accumulation"
                              ? t("borrowed from the z.ai accumulation")
                              : (summary.wallet?.depositSource ?? ""),
                        }
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <p className="py-3 text-[13.5px] italic text-muted-foreground">
                  {t(
                    "Your chamber — plan, credits, usage, keys and security, all in one place."
                  )}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t hairline pt-3">
                <button
                  type="button"
                  onClick={() => exitTo(openAccount)}
                  className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[13.5px] text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                >
                  {t("Open the account chamber")}
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </button>
                {signedIn && (
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[13.5px] text-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)]"
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

  /* THE HELD GROUP — one door, its panels stacked: a hairline between
     them, each keeping its own quiet head. THE ADVANCED is the one
     deliberately quieter room (its machinery's own tone). */
  const renderSection = () => (
    <>
      {groupPanels(section).map((sec, i) => (
        <div
          key={sec}
          className={i > 0 ? "mt-5 border-t hairline pt-4" : undefined}
        >
          {renderPanel(sec)}
        </div>
      ))}
    </>
  );

  /* WITHIN THE FRAME — the profile room no longer escapes to the body:
     it renders exactly where AppShell mounts it (inside the realm's
     own frame div), so it fills THE CHAT'S OWN frame — docked lens or
     fullscreen alike — and the lens's rounded corners clip it. The
     backdrop is the app's own glass: a translucent wash over the
     chat, blurred, so the room reads as one of the house's own
     surfaces and never a page of its own. The inner columns scroll
     (the rail and the panel body each carry their own
     overflow-y-auto), so nothing ever overflows the frame — even at
     the chat's smallest size. */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-[85] flex flex-col overflow-hidden bg-background/85 backdrop-blur-xl"
          data-testid="profile-page"
          role="dialog"
          aria-modal="true"
          aria-label={t("Your profile")}
        >
        {/* the head — one way back to the Mirror, one name, one close
            hand at the room's top corner (always within sight, even
            at the chat's smallest size) */}
        <header className="relative shrink-0 border-b hairline bg-background/40">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 sm:px-8">
            <button
              type="button"
              onClick={close}
              data-testid="profile-back"
              className="focus-glow flex h-8 items-center gap-2 rounded-full border hairline px-3 text-[13px] font-medium text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)] hover:bg-[var(--glass-bg)]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("Back to the Mirror")}</span>
              <span className="sm:hidden">{t("Back")}</span>
            </button>
            <span className="mono-label ml-auto hidden text-[10px] uppercase tracking-[0.26em] text-muted-foreground/60 sm:block">
              {t("The Mirror Entity Digital Chamber")}
            </span>
            {/* THE CLOSE HAND — the room's own X, at the frame's top
                corner: one touch lays the profile down and the chat
                stands again exactly where it was */}
            <button
              type="button"
              onClick={close}
              aria-label={t("Close")}
              title={t("Close")}
              data-testid="profile-close"
              className="focus-glow ml-auto flex size-8 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:ml-2"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          {/* THE SCOPE'S OWN LIGHT — a quiet tinted hairline beneath the
              head: the chosen scope's color resting still, no motion */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-px h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope-a, var(--gd)) 30%, transparent) 22%, color-mix(in srgb, var(--scope-a, var(--gd)) 30%, transparent) 78%, transparent)",
            }}
          />
        </header>

        {/* the room — a rail of doors on the left, one held panel on the right */}
        <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 gap-0 px-0 sm:px-8">
          {/* the rail — desktop: the keeper's face above the doors */}
          <nav
            aria-label={t("Your profile")}
            className="nice-scroll hidden w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r hairline py-4 pr-3 md:flex"
          >
            <IdentityCard />
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
            {/* the rail — mobile: THE COMPACT STRIP. The keeper's face
                above one quiet row of doors — every room (the Library,
                the Settings, the Advanced) one thumb away, and the whole
                block never taller than the card itself. */}
            <nav
              aria-label={t("Your profile")}
              className="border-b hairline px-4 py-2.5 md:hidden"
            >
              <IdentityCard />
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                {navItems
                  .filter((n) => n.available)
                  .map((item) => {
                    const ChipIcon = item.icon;
                    const chipActive = section === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSection(item.id)}
                        data-testid={item.testId}
                        aria-current={chipActive ? "page" : undefined}
                        className={cn(
                          "focus-glow flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-all duration-300",
                          chipActive
                            ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_12%,var(--glass-bg))] font-medium text-foreground"
                            : "border-transparent bg-[var(--glass-bg-soft)] text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ChipIcon
                          className={cn(
                            "size-3.5 shrink-0",
                            chipActive ? "text-[var(--scope-a,var(--gd))]" : ""
                          )}
                          aria-hidden="true"
                        />
                        <span className="whitespace-nowrap">{t(item.label)}</span>
                      </button>
                    );
                  })}
              </div>
            </nav>

            <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4 sm:px-6 sm:pt-5">
              {ready ? (
                renderSection()
              ) : (
                <div className="flex justify-center py-14" aria-busy="true">
                  <LoaderCircle
                    className="size-5 animate-spin text-muted-foreground/60"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}

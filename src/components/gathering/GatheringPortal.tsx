"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  CalendarClock,
  CircleQuestionMark,
  Compass,
  FlaskConical,
  Flame,
  LayoutGrid,
  Library,
  MessagesSquare,
  Play,
  ScrollText,
  Settings2,
  Sparkles,
  UserRound,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";
import {
  type CircleCard,
  type GatheringPost,
  type MeState,
  netFetch,
} from "./shared";
import MirrorAssistant from "./MirrorAssistant";
import FirstVisitSheet from "./FirstVisitSheet";

/* THE LAZY STREETS — every room of the network is lifted in only when
   its own street is walked: the portal's first breath carries the
   crown, the rail and the visitor's arrival alone, and no visitor
   downloads the fifteen rooms' ~15,000 lines until they open that
   door. Each chunk rides once and stays; the walk between rooms stays
   fluid. (ssr:false — the hall itself is client-born.) */
function SectionLoading() {
  return (
    <div
      role="status"
      aria-label="The room is arriving"
      className="flex h-full items-center justify-center"
    >
      <span
        aria-hidden="true"
        className="gp-pearl flex size-10 items-center justify-center rounded-[14px] border border-white/90"
        style={{
          background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px -3px rgba(122,103,70,0.4)",
        }}
      >
        <motion.span
          className="block size-3.5 rounded-[6px] border border-[#cbb98d] bg-[linear-gradient(150deg,#fefcf6,#e8dcbd)]"
          animate={{ opacity: [1, 0.45, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
    </div>
  );
}

const lazyRoom = <P extends { active: boolean }>(
  loader: () => Promise<{ default: ComponentType<P> }>
) => dynamic(loader, { ssr: false, loading: () => <SectionLoading /> });

const FeedSection = dynamic(() => import("./FeedSection"), { ssr: false, loading: () => <SectionLoading /> });
const DiscoverSection = lazyRoom(() => import("./DiscoverSection"));
const CirclesSection = lazyRoom(() => import("./CirclesSection"));
const EncountersSection = lazyRoom(() => import("./EncountersSection"));
const MessagesSection = lazyRoom(() => import("./MessagesSection"));
const CollaborateSection = dynamic(() => import("./CollaborateSection"), { ssr: false, loading: () => <SectionLoading /> });
const LibrarySection = dynamic(() => import("./LibrarySection"), { ssr: false, loading: () => <SectionLoading /> });
const QuestionsSection = lazyRoom(() => import("./QuestionsSection"));
const LaboratorySection = lazyRoom(() => import("./LaboratorySection"));
const IntentionsSection = lazyRoom(() => import("./IntentionsSection"));
const LiveSection = lazyRoom(() => import("./LiveSection"));
const SavedSection = lazyRoom(() => import("./SavedSection"));
const MySpaceSection = dynamic(() => import("./MySpaceSection"), { ssr: false, loading: () => <SectionLoading /> });
const SettingsSection = dynamic(() => import("./SettingsSection"), { ssr: false, loading: () => <SectionLoading /> });
const GuidelinesSection = lazyRoom(() => import("./GuidelinesSection"));
/* THE MIRROR LABORATORY — the hall's unified field, its own street */
const MirrorLaboratory = dynamic(() => import("./MirrorLaboratory"), {
  ssr: false,
  loading: () => <SectionLoading />,
});
/* THE POSSIBILITIES REALM — the middle street: every work the house
   has published, one full screen at a time, walked like a story */
const PossibilitiesRealm = dynamic(() => import("./PossibilitiesRealm"), {
  ssr: false,
  loading: () => <SectionLoading />,
});
/* the overlays and the radio bar ride on their own doors too */
const ProfileSheet = dynamic(() => import("./ProfileSheet"), { ssr: false });
const NotificationsSheet = dynamic(() => import("./NotificationsSheet"), { ssr: false });
const RegionAtlas = dynamic(() => import("./RegionAtlas"), { ssr: false });
const PublishPickerSheet = dynamic(() => import("./PublishPickerSheet"), { ssr: false });
const GatheringRadio = dynamic(
  () => import("./GatheringRadio").then((m) => ({ default: m.GatheringRadio })),
  { ssr: false }
);

/* ------------------------------------------------------------------ */
/*  THE GATHERING'S PORTAL — the independent social heart of the       */
/*  house. The threshold's top-left sigil raises a completely          */
/*  separate space with its own structure, its own light, its own      */
/*  manners:                                                           */
/*                                                                     */
/*    THE PULSE — the living community stream, four currents:          */
/*      for you, following, latest, discoveries;                       */
/*    DISCOVER — six destinations: for you, people, creations,         */
/*      circles, projects, knowledge; M.E. listens here;               */
/*    LIVING QUESTIONS — questions that grow like trees;               */
/*    RESONANCE CIRCLES — communities to join, or to found;            */
/*    THE LABORATORY — hypotheses tested together, evidence over votes;*/
/*    CREATION COMMONS — the collective archive of finished work;      */
/*    COLLECTIVE INTENTIONS — shared goals with real steps;            */
/*    GATHER LIVE — scheduled conversations in real time;              */
/*    WORKSHOPS — the weaving rooms of shared projects;                */
/*    CONNECTIONS — meaningful introductions, consent always;          */
/*    MESSAGES — private and group conversations;                      */
/*    SAVED — the visitor's own quiet shelf;                           */
/*    MY SPACE — the introduction, the counts, the offerings;          */
/*    SETTINGS — the bell's manners, the visibility, the walls;        */
/*    GUIDELINES — the trust this place runs on.                       */
/*                                                                     */
/*  THE RAIL AND THE BOTTOM — on wide desks the rooms read through a   */
/*  quiet left rail; in the palm the five primary streets ride the     */
/*  bottom and the crown's grid hand opens every room.                 */
/*                                                                     */
/*  CREATION LIVES IN THE HOUSE'S ROOMS — ArtX, Music, Book, HyperX,   */
/*  a transmission's own line. The Gathering publishes finished work,  */
/*  it does not make it: there is no create street, no second studio.  */
/*                                                                     */
/*  THE HALL'S OWN WEATHER — two faces of one house: porcelain in the  */
/*  daylight (milk-white, cream, three-dimensional), the site's own    */
/*  lit-crystal dark at night. The gathering drinks the same tokens    */
/*  the whole Reflect Me house drinks, so dark mode here is dark mode  */
/*  everywhere. No second palette, no switch, no constellation — the   */
/*  flicker left with it.                                              */
/* ------------------------------------------------------------------ */

type Section =
  | "gathering"
  | "mirror"
  | "discover"
  | "possibilities"
  | "questions"
  | "circles"
  | "laboratory"
  | "library"
  | "collaborate"
  | "intentions"
  | "live"
  | "encounters"
  | "messages"
  | "saved"
  | "myspace"
  | "settings"
  | "guidelines";

type RoomDef = { key: Section; label: string; icon: LucideIcon };

const ROOMS: Record<Section, RoomDef> = {
  gathering: { key: "gathering", label: "The Pulse", icon: Waypoints },
  mirror: { key: "mirror", label: "Mirror Laboratory", icon: Sparkles },
  discover: { key: "discover", label: "Discover", icon: Compass },
  possibilities: { key: "possibilities", label: "Possibilities", icon: Play },
  questions: { key: "questions", label: "Living Questions", icon: CircleQuestionMark },
  circles: { key: "circles", label: "Resonance Circles", icon: Users },
  laboratory: { key: "laboratory", label: "The Laboratory", icon: FlaskConical },
  library: { key: "library", label: "Creation Commons", icon: Library },
  collaborate: { key: "collaborate", label: "Workshops", icon: LayoutGrid },
  intentions: { key: "intentions", label: "Collective Intentions", icon: Flame },
  live: { key: "live", label: "Gather Live", icon: CalendarClock },
  encounters: { key: "encounters", label: "Connections", icon: Sparkles },
  messages: { key: "messages", label: "Messages", icon: MessagesSquare },
  saved: { key: "saved", label: "Saved", icon: Bookmark },
  myspace: { key: "myspace", label: "My Space", icon: UserRound },
  settings: { key: "settings", label: "Settings", icon: Settings2 },
  guidelines: { key: "guidelines", label: "Guidelines", icon: ScrollText },
};

/* the rail reads in quiet groups — the possibilities realm stands
   beside the pulse, discover and connect lead the walk, and every
   other room keeps its door */
const RAIL_GROUPS: Array<{ label: string; rooms: Section[] }> = [
  { label: "the pulse", rooms: ["gathering", "possibilities"] },
  { label: "the laboratory", rooms: ["mirror"] },
  { label: "discover", rooms: ["discover", "questions", "laboratory"] },
  { label: "together", rooms: ["circles", "intentions", "live", "collaborate"] },
  { label: "creations", rooms: ["library"] },
  { label: "connect", rooms: ["encounters", "messages"] },
  { label: "you", rooms: ["saved", "myspace", "settings", "guidelines"] },
];

/* THE FIVE STREETS — the palm's whole navigation. No top buttons: the
   crown stays a quiet name, and every function lives on one of the
   five streets. The middle street is the possibilities realm — the
   house's works walked one full screen at a time, story-true. */
const BOTTOM_ROOMS: Section[] = ["gathering", "discover", "possibilities", "messages", "myspace"];

const SECTION_IDS = Object.keys(ROOMS) as Section[];

function isSection(v: string | null): v is Section {
  return typeof v === "string" && (SECTION_IDS as string[]).includes(v);
}

/* ================================================================== */
/*  THE HALL'S VARS — porcelain by day; at night the hall's own vars   */
/*  are poured again from the site's own dark tokens, so every room    */
/*  below reads true in both weathers without touching its classes.    */
/* ================================================================== */

const GATH_STYLE = `
/* --- the daylight law: porcelain vars (the original hall) --- */
.gath-hall {
  --gath: #8a6f46;
  --gath-strong: #a16207;
  --gath-ink: #3d3428;
  --gath-ink-2: #5c5344;
  --gath-ink-3: #a2947c;
  --gath-soft: #8a6f46;
  --gath-card: #fffdf8;
  --gath-edge: rgba(214, 197, 164, 0.55);
  --gath-edge-active: rgba(178, 158, 122, 0.85);
  --gath-glow-a: rgba(253, 250, 242, 0.9);
  --gath-glow-b: rgba(244, 233, 210, 0.75);
  --gath-glow-c: rgba(238, 226, 200, 0.6);
  --gath-sheet: linear-gradient(168deg, #fffdf8 0%, #faf5e8 60%, #f4ecda 100%);
  --gath-ok: #5f7a52;
  --gath-warn: #b45309;
  --gath-amber: #a16207;
  --gath-teal: #0d9488;
  --gath-lav: #7c5cad;
}

/* --- THE SOLID GROUND LAW (daylight) — every section, every panel,
       every publishing surface stands opaque: no veil, no glass, no
       translucency anywhere the visitor reads or writes. The hall's
       own sky carries all the depth; the walls simply stand. --- */
.gath-hall .gp-card {
  background: #fffdf8;
}
.gath-hall .gp-glass {
  background: #fffdf8;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.gath-hall .bg-white\\/45,
.gath-hall .bg-white\\/50,
.gath-hall .bg-white\\/55,
.gath-hall .bg-white\\/60,
.gath-hall .bg-white\\/70,
.gath-hall .bg-white\\/80 {
  background-color: #fffdf8;
}
.gath-hall .bg-white {
  background-color: #ffffff;
}
.gath-hall input,
.gath-hall textarea,
.gath-hall select {
  background-color: #ffffff;
}

/* --- the night law: the hall drinks the site's own dark tokens --- */
.dark .gath-hall {
  --gath: #a9c3e2;
  --gath-strong: #cfe0f2;
  --gath-ink: #eef4fb;
  --gath-ink-2: #d7e2f0;
  --gath-ink-3: #b6c4d8;
  --gath-soft: #cfe0f2;
  --gath-card: #243459;
  --gath-edge: rgba(168, 203, 255, 0.14);
  --gath-edge-active: rgba(140, 190, 255, 0.45);
  --gath-glow-a: rgba(140, 190, 255, 0.13);
  --gath-glow-b: rgba(96, 148, 224, 0.10);
  --gath-glow-c: rgba(168, 203, 255, 0.08);
  --gath-sheet: linear-gradient(168deg, #243459 0%, #203054 55%, #1c2b4a 100%);
  --gath-ok: #86c9a8;
  --gath-warn: #f0b263;
  --gath-amber: #e8b954;
  --gath-teal: #6fc7bd;
  --gath-lav: #a5b8ea;
}

/* --- the night sky — the site's own crystal ground, opaque, still --- */
.dark .gath-hall .gp-sky {
  background:
    radial-gradient(120% 90% at 12% 0%, rgba(140, 190, 255, 0.09) 0%, rgba(140, 190, 255, 0) 55%),
    radial-gradient(90% 70% at 88% 12%, rgba(96, 148, 224, 0.07) 0%, rgba(96, 148, 224, 0) 60%),
    linear-gradient(168deg, #1c2b4a 0%, #1a2744 52%, #182341 100%);
}

/* --- the night garments: SOLID crystal cards, no blur, no flicker --- */
.dark .gath-hall .gp-card {
  background: var(--gath-card);
  border: 1px solid var(--gath-edge);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 18px 42px -20px rgba(0, 0, 0, 0.5);
}
.dark .gath-hall .gp-card-hover:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 24px 52px -22px rgba(0, 0, 0, 0.56);
}
.dark .gath-hall .gp-glass {
  background: var(--gath-card);
  border-color: var(--gath-edge);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 16px 40px -20px rgba(0, 0, 0, 0.45);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.dark .gath-hall .gp-seg {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 10px 24px -14px rgba(0, 0, 0, 0.4);
}
.dark .gath-hall .gp-seg-thumb {
  background: color-mix(in srgb, var(--gath) 22%, var(--gath-card));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 2px 8px -2px rgba(0, 0, 0, 0.4);
}
.dark .gath-hall .gp-scroll { scrollbar-color: var(--gath-edge) transparent; }
.dark .gath-hall .gp-scroll::-webkit-scrollbar-thumb { background: var(--gath-edge); }

/* --- the night ink law: every porcelain word re-inks to crystal --- */
.dark .gath-hall .text-\\[\\#3d3428\\] { color: var(--gath-ink); }
.dark .gath-hall .text-\\[\\#4c4436\\],
.dark .gath-hall .text-\\[\\#5c5344\\],
.dark .gath-hall .text-\\[\\#7c715f\\] { color: var(--gath-ink-2); }
.dark .gath-hall .text-\\[\\#a2947c\\],
.dark .gath-hall .text-\\[\\#8a7c64\\],
.dark .gath-hall .text-\\[\\#b3a68d\\],
.dark .gath-hall .text-\\[\\#b0a184\\],
.dark .gath-hall .text-\\[\\#bfb398\\] { color: var(--gath-ink-3); }
.dark .gath-hall .text-\\[\\#8a6f46\\] { color: var(--gath-soft); }
.dark .gath-hall .text-\\[\\#a16207\\] { color: var(--gath-amber); }
.dark .gath-hall .text-\\[\\#b45309\\],
.dark .gath-hall .text-\\[\\#9a4f21\\],
.dark .gath-hall .text-\\[\\#b3542f\\] { color: var(--gath-warn); }
.dark .gath-hall .text-\\[\\#5f7a52\\] { color: var(--gath-ok); }
.dark .gath-hall .text-\\[\\#7c5cad\\] { color: var(--gath-lav); }
.dark .gath-hall .text-\\[\\#cbb98d\\] { color: var(--gath-strong); }
.dark .gath-hall .text-\\[\\#0f766e\\],
.dark .gath-hall .text-\\[\\#0d9488\\] { color: var(--gath-teal); }
.dark .gath-hall .placeholder\\:text-\\[\\#b3a68d\\]::placeholder,
.dark .gath-hall .placeholder\\:text-\\[\\#bfb398\\]::placeholder { color: var(--gath-ink-3); }
.dark .gath-hall .hover\\:text-\\[\\#3d3428\\]:hover,
.dark .gath-hall .hover\\:text-\\[\\#7c715f\\]:hover { color: var(--gath-ink); }
.dark .gath-hall .hover\\:text-\\[\\#8a6f46\\]:hover { color: var(--gath-strong); }
.dark .gath-hall .hover\\:text-\\[\\#b45309\\]:hover { color: var(--gath-warn); }

/* --- the night hairline law: edges drink the crystal, never shout --- */
.dark .gath-hall .border-\\[\\#e4d9bd\\],
.dark .gath-hall .border-\\[\\#e8dfc9\\],
.dark .gath-hall .border-\\[\\#eadfc4\\],
.dark .gath-hall .border-\\[\\#eee5d0\\],
.dark .gath-hall .border-\\[\\#eadfca\\],
.dark .gath-hall .border-\\[\\#eadfca\\]\\/60,
.dark .gath-hall .border-\\[\\#eadfca\\]\\/70,
.dark .gath-hall .border-white\\/75,
.dark .gath-hall .border-white\\/80,
.dark .gath-hall .border-white\\/85,
.dark .gath-hall .border-white\\/90 { border-color: var(--gath-edge); }
.dark .gath-hall .border-white\\/95 { border-color: var(--gath-edge-active); }
.dark .gath-hall .border-\\[\\#cbb98d\\],
.dark .gath-hall .border-\\[\\#cbb98d\\]\\/50,
.dark .gath-hall .border-\\[\\#d3c39c\\],
.dark .gath-hall .border-\\[\\#d9c99a\\]\\/60,
.dark .gath-hall .border-\\[\\#d9c99a\\]\\/50 { border-color: var(--gath-edge-active); }
.dark .gath-hall .hover\\:border-\\[\\#d3c39c\\]:hover { border-color: var(--gath-edge-active); }
.dark .gath-hall .border-\\[\\#d8e5d0\\],
.dark .gath-hall .border-\\[\\#c7d8c0\\] { border-color: color-mix(in srgb, var(--gath-ok) 40%, transparent); }
.dark .gath-hall .border-\\[\\#7c5cad\\]\\/25,
.dark .gath-hall .border-\\[\\#7c5cad\\]\\/40 { border-color: color-mix(in srgb, var(--gath-lav) 38%, transparent); }
.dark .gath-hall .border-\\[\\#a16207\\]\\/40,
.dark .gath-hall .border-\\[\\#a16207\\]\\/45 { border-color: color-mix(in srgb, var(--gath-amber) 45%, transparent); }
.dark .gath-hall .border-\\[\\#b45309\\]\\/30,
.dark .gath-hall .border-\\[\\#b45309\\]\\/45 { border-color: color-mix(in srgb, var(--gath-warn) 45%, transparent); }
.dark .gath-hall .border-\\[\\#0d9488\\]\\/40,
.dark .gath-hall .border-\\[\\#0d9488\\]\\/50 { border-color: color-mix(in srgb, var(--gath-teal) 45%, transparent); }

/* --- the night surface law: SOLID crystal — no veil, no blur,
       no translucency anywhere the visitor reads or writes --- */
.dark .gath-hall .bg-white\\/45,
.dark .gath-hall .bg-white\\/50,
.dark .gath-hall .bg-white\\/55,
.dark .gath-hall .bg-white\\/60,
.dark .gath-hall .bg-white\\/70,
.dark .gath-hall .bg-white\\/80 { background-color: var(--gath-card); }
.dark .gath-hall .bg-white { background-color: var(--gath-card); }
.dark .gath-hall .bg-\\[\\#faf5e6\\] { background-color: color-mix(in srgb, var(--gath-amber) 12%, var(--gath-card)); }
.dark .gath-hall .bg-\\[\\#fdf1e7\\] { background-color: color-mix(in srgb, var(--gath-amber) 14%, var(--gath-card)); }
.dark .gath-hall .bg-\\[\\#f2f7ee\\],
.dark .gath-hall .bg-\\[\\#eef5ea\\] { background-color: color-mix(in srgb, var(--gath-ok) 13%, var(--gath-card)); }
.dark .gath-hall .bg-\\[\\#7c5cad\\]\\/10 { background-color: color-mix(in srgb, var(--gath-lav) 16%, transparent); }
.dark .gath-hall .bg-\\[\\#e4d9bd\\] { background-color: color-mix(in srgb, var(--gath-strong) 40%, transparent); }
.dark .gath-hall .bg-\\[\\#3d3428\\]\\/25,
.dark .gath-hall .bg-\\[\\#2b2416\\]\\/45,
.dark .gath-hall .bg-\\[rgba\\(46\\,38\\,24\\,0\\.32\\)\\] { background-color: rgba(9, 14, 26, 0.55); }
.dark .gath-hall input,
.dark .gath-hall textarea,
.dark .gath-hall select {
  background-color: color-mix(in srgb, var(--gath-card) 88%, #10192e);
}

/* --- the pearl law: the hall's little ivory pieces (maker marks,
       the offering hand, the search hand) keep their warm ink on
       cream, whatever the night wears around them --- */
.dark .gath-hall .gp-pearl,
.dark .gath-hall .gp-pearl * { color: #8a6f46; }
`;

export default function GatheringPortal() {
  const t = useT();
  /* the deep link's own room — ?section= names a street on arrival */
  const [section, setSection] = useState<Section>(() => {
    if (typeof window !== "undefined") {
      const named = new URLSearchParams(window.location.search).get("section");
      if (isSection(named)) return named;
    }
    return "gathering";
  });
  const sectionRef = useRef<Section>(section);
  const [me, setMe] = useState<MeState | null>(null);
  const [circles, setCircles] = useState<CircleCard[]>([]);
  const [unread, setUnread] = useState(0);
  const [overlay, setOverlay] = useState<
    "none" | "profile" | "notifications" | "atlas"
  >("none");
  /* the first visit — one welcome, kept in the visitor's own browser */
  const [firstVisit, setFirstVisit] = useState(false);
  /* carried between rooms — the weave and library hands of the stream */
  const [weaveSeed, setWeaveSeed] = useState<GatheringPost | null>(null);
  const [librarySeed, setLibrarySeed] = useState<GatheringPost | null>(null);
  /* the atlas' own breath — every intention spoken at the map asks the
     stream to read itself again, so the hall and the map agree */
  const [atlasSignal, setAtlasSignal] = useState(0);

  /* the compose intent — the create sheet's labeled doors carry a
     beginning into the hall: the section arrives first, then the
     composer unfolds on top of it (never a dead end). The counter
     makes every knock distinct, even the same door twice. A seed
     (from the Mirror Laboratory) lays a beginning into the fields. */
  const [composeIntent, setComposeIntent] = useState<{
    kind: string;
    n: number;
    seed?: { title?: string; body?: string; tags?: string };
  } | null>(null);
  const composeNRef = useRef(0);

  /* the laboratory bench's own seed — a draft carried from the Mirror
     Laboratory opens a real bench form pre-filled, the visitor's hand
     still does the opening and the hanging */
  const [benchSeed, setBenchSeed] = useState<{
    title: string;
    question: string;
    hypothesis: string;
    method: string;
    n: number;
  } | null>(null);
  const benchSeedNRef = useRef(0);

  /* the publication picker — the hall's only creation-adjacent door, */
  /* and it creates nothing: it carries finished works in */
  const [pickerOpen, setPickerOpen] = useState(false);

  /* the radio's own hand — one small music button in the crown; the
     bar mounts only while it stands, so folding it rests the sound */
  const [radioOpen, setRadioOpen] = useState(false);

  const closePortal = useCallback(() => {
    useMirror.getState().closeGatheringPortal();
  }, []);

  const goSection = useCallback((next: Section) => {
    setSection(next);
    sectionRef.current = next;
    setOverlay("none");
    if (typeof window !== "undefined") {
      const url =
        next === "gathering"
          ? "/?room=gathering"
          : `/?room=gathering&section=${next}`;
      window.history.replaceState(null, "", url);
      document.title = `The Gathering · ${ROOMS[next].label} · ReflectMe`;
    }
  }, []);

  /* the portal's first breath: who the visitor is, which circles keep
     their doors open for them — and whether a deep link names a room */
  useEffect(() => {
    void (async () => {
      try {
        const [m, c] = await Promise.all([
          netFetch<{ me: MeState }>("/api/network/me"),
          netFetch<{ circles: CircleCard[] }>("/api/network/circles?mine=1&take=40"),
        ]);
        setMe(m.me);
        setCircles(c.circles);
      } catch {
        /* the rooms still open — identity arrives on the next breath */
      }
    })();
    if (typeof window !== "undefined") {
      document.title =
        section === "gathering"
          ? "The Gathering · ReflectMe"
          : `The Gathering · ${ROOMS[section].label} · ReflectMe`;
      if (!window.localStorage.getItem("gathering-intro-v1")) {
        const id = window.setTimeout(() => setFirstVisit(true), 900);
        return () => window.clearTimeout(id);
      }
    }
  }, []);

  /* the bell breathes quietly */
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = await netFetch<{ unread: number }>("/api/network/notifications");
        if (alive) setUnread(data.unread);
        const m = await netFetch<{ me: MeState }>("/api/network/me");
        if (alive) setMe((prev) => (prev ? { ...prev, counts: m.me.counts } : prev));
      } catch {
        /* a missed breath is followed by the next one */
      }
    };
    const id = window.setInterval(tick, 15000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  /* the escape hand — folds the topmost sheet first, then the portal */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (firstVisit) return;
      if (overlay === "none") closePortal();
      else setOverlay("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay, firstVisit, closePortal]);

  const firstVisitDone = useCallback(() => {
    setFirstVisit(false);
    try {
      window.localStorage.setItem("gathering-intro-v1", "seen");
    } catch {
      /* a closed storage only means the welcome may return */
    }
  }, []);

  if (typeof document === "undefined") return null;

  const railButton = (room: RoomDef) => {
    const RIcon = room.icon;
    const on = section === room.key;
    return (
      <button
        key={room.key}
        type="button"
        onClick={() => goSection(room.key)}
        aria-current={on ? "page" : undefined}
        data-testid={`gath-rail-${room.key}`}
        className={cn(
          "focus-glow flex w-full items-center gap-2.5 rounded-[14px] border px-3 py-2 text-[12.5px] font-semibold transition-all duration-300",
          on
            ? "border-[#d3c39c] bg-white/80 text-[#5c5344] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_10px_-6px_rgba(122,103,70,0.35)]"
            : "border-transparent text-[#7c715f] hover:bg-white/50 hover:text-[#3d3428]"
        )}
      >
        <RIcon className={cn("size-4 shrink-0", on ? "text-[#a16207]" : "text-[#a2947c]")} aria-hidden="true" />
        <span className="truncate">{t(room.label)}</span>
      </button>
    );
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label={t("The Gathering")}
      data-testid="gathering-portal"
      className="gath-hall fixed inset-0 z-[90] overflow-hidden"
    >
      <style>{GATH_STYLE}</style>

      {/* ---------- the hall's own sky (porcelain by day, crystal at night) ---------- */}
      <div aria-hidden="true" className="gp-sky absolute inset-0">
        <div
          className="gp-drift absolute -top-32 left-[8%] h-[420px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--gath-glow-a), transparent)" }}
        />
        <div
          className="gp-drift-slow absolute bottom-[-140px] right-[-80px] h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--gath-glow-b), transparent)" }}
        />
        <div
          className="gp-drift absolute left-[-120px] top-1/2 h-[380px] w-[380px] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--gath-glow-c), transparent)" }}
        />
      </div>

      {/* ---------- THE LEFT RAIL — every room of the network, on wide desks ---------- */}
      <aside
        aria-label={t("The Gathering rooms")}
        className="gp-glass absolute bottom-0 left-0 top-0 z-20 hidden w-[248px] flex-col border-r border-[#e4d9bd]/60 lg:flex"
      >
        <div className="flex items-center gap-2.5 px-5 pb-3 pt-5">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-white/90"
            style={{
              background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px -3px rgba(122,103,70,0.4)",
            }}
          >
            <span className="block size-4 rounded-[5px] border border-[#cbb98d] bg-[linear-gradient(150deg,#fefcf6,#e8dcbd)]" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-cinzel)] text-[14px] font-semibold tracking-wide text-[#3d3428]">
              {t("The Gathering")}
            </p>
            <p className="mono-label text-[8px] uppercase tracking-[0.26em] text-[#a2947c]">
              {t("explore with mirror")}
            </p>
          </div>
        </div>

        <nav aria-label={t("The Gathering rooms")} className="gp-scroll flex-1 overflow-y-auto px-3 pb-6">
          {RAIL_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mono-label px-3 pb-1.5 pt-2 text-[8.5px] uppercase tracking-[0.24em] text-[#a2947c]">
                {t(group.label)}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.rooms.map((key) => railButton(ROOMS[key]))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* ---------- the crown — a quiet name and nothing else ----------
          THE CLEAN SOCIAL LAW: the top of the hall carries no buttons
          at all. The house's name and the room's name stand alone; every
          function lives on the five streets at the foot (and on wide
          desks, in the left rail). The way back to the threshold rides
          above the hall as the landing's own small hand. */}
      <header className="gp-glass absolute inset-x-0 top-0 z-10 border-x-0 border-t-0 lg:left-[248px]">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-center gap-2.5 px-3 sm:h-16 sm:px-6">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-[12px] border border-white/90"
            style={{
              background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px -3px rgba(122,103,70,0.4)",
            }}
          >
            <span className="block size-3.5 rounded-[5px] border border-[#cbb98d] bg-[linear-gradient(150deg,#fefcf6,#e8dcbd)]" />
          </span>
          <div className="min-w-0 text-center">
            <p className="truncate font-[family-name:var(--font-cinzel)] text-[14px] font-semibold tracking-wide text-[#3d3428] sm:text-[15px]">
              {t(section === "gathering" ? "The Gathering" : ROOMS[section].label)}
            </p>
            <p className="mono-label hidden text-[8px] uppercase tracking-[0.26em] text-[#a2947c] sm:block">
              {t("the network of becoming")}
            </p>
          </div>
        </div>
      </header>

      {/* ---------- the rooms ---------- */}
      <div className="absolute inset-0 overflow-hidden pb-16 pt-[58px] sm:pt-[70px] lg:pb-0 lg:pl-[248px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={overlay !== "none" ? overlay : section}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {overlay === "profile" ? (
              <ProfileSheet me={me} onSaved={setMe} onClose={() => setOverlay("none")} />
            ) : overlay === "notifications" ? (
              <NotificationsSheet onCount={setUnread} onClose={() => setOverlay("none")} />
            ) : overlay === "atlas" ? (
              <RegionAtlas
                onPosted={() => setAtlasSignal((n) => n + 1)}
                onClose={() => setOverlay("none")}
              />
            ) : section === "gathering" ? (
              <FeedSection
                active
                circles={circles}
                refreshSignal={atlasSignal}
                composeIntent={composeIntent}
                onComposeConsumed={() => setComposeIntent(null)}
                onMeetSomeone={() => goSection("encounters")}
                onPublishWork={() => setPickerOpen(true)}
                onWeaveFrom={(post) => {
                  setWeaveSeed(post);
                  goSection("collaborate");
                }}
                onLibraryFrom={(post) => {
                  setLibrarySeed(post);
                  goSection("library");
                }}
                onGrown={(where) => goSection(where)}
              />
            ) : section === "mirror" ? (
              <MirrorLaboratory
                active
                onComposeIntent={(seed) => {
                  composeNRef.current += 1;
                  const { kind, title, body, tags } = seed;
                  setComposeIntent({
                    kind,
                    n: composeNRef.current,
                    ...(title || body || tags ? { seed: { title, body, tags } } : {}),
                  });
                  goSection("gathering");
                }}
                onBenchSeed={(seed) => {
                  benchSeedNRef.current += 1;
                  setBenchSeed({ ...seed, n: benchSeedNRef.current });
                  goSection("laboratory");
                }}
                onNavigate={(next) => goSection(isSection(next) ? next : "discover")}
              />
            ) : section === "discover" ? (
              <DiscoverSection
                active
                onOpenMessages={() => goSection("messages")}
                onOpenAtlas={() => setOverlay("atlas")}
                onOpenRoom={(next) => goSection(isSection(next) ? next : "discover")}
              />
            ) : section === "possibilities" ? (
              <PossibilitiesRealm
                active
                onNavigate={(next) => goSection(isSection(next) ? next : "gathering")}
              />
            ) : section === "questions" ? (
              <QuestionsSection active />
            ) : section === "circles" ? (
              <CirclesSection active />
            ) : section === "laboratory" ? (
              <LaboratorySection
                active
                benchSeed={benchSeed}
                onBenchSeedConsumed={() => setBenchSeed(null)}
              />
            ) : section === "intentions" ? (
              <IntentionsSection active />
            ) : section === "live" ? (
              <LiveSection active />
            ) : section === "encounters" ? (
              <EncountersSection active onOpenMessages={() => goSection("messages")} />
            ) : section === "messages" ? (
              <MessagesSection active />
            ) : section === "collaborate" ? (
              <CollaborateSection
                active
                seedPost={weaveSeed}
                onSeedConsumed={() => setWeaveSeed(null)}
              />
            ) : section === "library" ? (
              <LibrarySection
                active
                fromPost={librarySeed}
                onSeedConsumed={() => setLibrarySeed(null)}
              />
            ) : section === "saved" ? (
              <SavedSection active />
            ) : section === "myspace" ? (
              <MySpaceSection
                active
                me={me}
                unread={unread}
                onEditProfile={() => setOverlay("profile")}
                onOpenNotifications={() => setOverlay("notifications")}
                onOpenSaved={() => goSection("saved")}
                onOpenSettings={() => goSection("settings")}
                onOpenGuidelines={() => goSection("guidelines")}
                onOpenLibrary={() => goSection("library")}
                onPublishWork={() => setPickerOpen(true)}
                onToggleRadio={() => setRadioOpen((v) => !v)}
                radioOpen={radioOpen}
                onReturnHome={closePortal}
              />
            ) : section === "settings" ? (
              <SettingsSection active me={me} onSaved={setMe} />
            ) : (
              <GuidelinesSection active />
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* ---------- the palm's own streets — five streets, the whole
          hall in one hand. The middle street is the possibilities
          realm: the house's works walked one full screen at a time.
          The bell's ring rides with My Space; the create hands live
          inside the rooms where making happens. ---------- */}
      <nav
        aria-label={t("The Gathering")}
        className="gp-glass absolute inset-x-0 bottom-0 z-30 border-x-0 border-b-0 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 lg:hidden"
        data-testid="gathering-bottom-nav"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
          {BOTTOM_ROOMS.map((key) => {
            const room = ROOMS[key];
            const BIcon = room.icon;
            const on = section === key && overlay === "none";
            const middle = key === "possibilities";
            return (
              <button
                key={key}
                type="button"
                onClick={() => goSection(key)}
                aria-current={on ? "page" : undefined}
                data-testid={`gath-bottom-${key}`}
                className="focus-glow relative flex min-w-[56px] flex-col items-center gap-0.5 rounded-[14px] px-2 py-1.5"
              >
                {middle ? (
                  /* THE MIDDLE STREET — the realm's own raised pearl:
                      a small standing stage the thumb finds at rest */
                  <span
                    aria-hidden="true"
                    className={cn(
                      "-mt-5 flex size-11 items-center justify-center rounded-[16px] border transition-all duration-300",
                      on
                        ? "border-[#cbb98d] shadow-[0_10px_22px_-10px_rgba(122,103,70,0.65)]"
                        : "border-[#e4d9bd] shadow-[0_8px_18px_-10px_rgba(122,103,70,0.45)]"
                    )}
                    style={{
                      background:
                        "linear-gradient(160deg,#fffdf8 0%,#f2e7cd 55%,#e8dcbd 100%)",
                    }}
                  >
                    <Play
                      className={cn(
                        "size-5",
                        on ? "text-[#8a6f46]" : "text-[#a2947c]"
                      )}
                      aria-hidden="true"
                    />
                  </span>
                ) : (
                  <BIcon
                    className={cn("size-5", on ? "text-[#a16207]" : "text-[#a2947c]")}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "whitespace-nowrap text-[9.5px] font-semibold",
                    on ? "text-[#5c5344]" : "text-[#a2947c]"
                  )}
                >
                  {t(key === "messages" ? "Inbox" : key === "gathering" ? "Pulse" : room.label)}
                </span>
                {key === "messages" && unread > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-0.5 size-2 rounded-full bg-[#a16207]"
                  />
                )}
                {key === "myspace" && unread > 0 && (
                  <span
                    aria-hidden="true"
                    data-testid="gath-myspace-unread"
                    className="absolute right-1 top-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#a16207] text-[8px] font-bold text-white"
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
                {on && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 h-1 w-8 rounded-full bg-[#cbb98d]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* the radio rides the hall's foot while it stands — lifted above
          the palm's own streets on small screens */}
      {radioOpen && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[64px] z-30 lg:bottom-0">
          <GatheringRadio onClose={() => setRadioOpen(false)} />
        </div>
      )}

      {/* M.E. listens in every room — it suggests, never acts */}
      <MirrorAssistant section={section} me={me} radioOpen={radioOpen} />

      {/* the first welcome — once, honestly, never again */}
      <FirstVisitSheet
        open={firstVisit}
        onChoose={(a) => {
          firstVisitDone();
          if (a === "discover") goSection("discover");
          else if (a === "circles") goSection("circles");
          else goSection("gathering");
        }}
        onClose={firstVisitDone}
      />

      {/* the picker stands above everything — it is not a room, it is a hand */}
      <PublishPickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </motion.div>,
    document.body
  );
}

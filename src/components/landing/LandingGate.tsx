"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useMirror, LANDING_SCOPES } from "@/lib/mirror-store";
import { SCOPE_META } from "@/lib/mirror/workspaces";
import { cn } from "@/lib/utils";
import LandingPage from "./LandingPage";

/* ------------------------------------------------------------------ */
/*  THE THRESHOLD'S GATE.                                              */
/*                                                                     */
/*  There is only ONE portal in this house. The chamber itself — the   */
/*  whole living application — stands docked inside the landing page   */
/*  as the miniature portal: the real realm, live and working, without */
/*  its suggestion wall. The expand hand opens nothing and carries     */
/*  nothing — the very same portal simply grows to fill the screen,    */
/*  every word of the conversation already inside it, and the minimize */
/*  hand folds it back into its slot.                                  */
/*                                                                     */
/*  THE GLASS IN THE FLOW — the docked lens no longer floats above the */
/*  page carried by scroll handlers: it stands INSIDE its slot in the  */
/*  page's own flow, so the native scroll carries it — zero JavaScript */
/*  per scroll breath, zero lag, and the glass can never drift, freeze */
/*  or leave a dead area behind (the old fixed-lens anchoring is gone).*/
/*  Expand and minimize cross the crystal tunnel — the tunnel's light  */
/*  covers the swap completely, the chamber never re-mounts and never  */
/*  loses a word.                                                      */
/*                                                                     */
/*  THE WHOLE MIRROR — the docked chamber is never cropped again: it   */
/*  lays out at the window's own size (its own --app-h), so the crown, */
/*  the quiet floor and the whisper line all stand inside the window — */
/*  nothing cut in the middle. The window itself stands smaller in     */
/*  height and a touch wider than before. Expand and minimize cross    */
/*  the crystal tunnel — the chamber re-fits behind the tunnel's light,*/
/*  the conversation never losing a breath.                            */
/* ------------------------------------------------------------------ */

type Phase = "landing" | "opening" | "through";

type ChamberModule = {
  default: ComponentType<{
    bare?: boolean;
    onExpand?: () => void;
    onMinimize?: () => void;
  }>;
};

/* THE INSTANT FLOOR — the chamber's chunk is prefetched only once the
   landing has had its first breath: after the window's load, at idle
   (or ~1.5s at the latest) — never during the hero's own race, and
   never for a data-saver visitor. One shared promise is kept in the
   module variable; the gate's effect only RECEIVES the floor, and a
   visitor who enters before the prefetch even started lays it through
   their own hand (the enter door starts the import on demand). */
let chamberChunk: Promise<ChamberModule> | null = null;
const floorWaiters = new Set<(chunk: Promise<ChamberModule>) => void>();

/* THE SHARED RIDE — one import, started once: whoever asks first (the
   idle prefetch below, or the visitor's own enter hand) lays the
   floor, and every waiter receives the very same promise. */
function ensureChamberChunk(): Promise<ChamberModule> {
  if (!chamberChunk) {
    chamberChunk = import("@/components/mirror/AppShell");
    for (const receive of floorWaiters) receive(chamberChunk);
    floorWaiters.clear();
  }
  return chamberChunk;
}

if (typeof window !== "undefined") {
  const prefetch = () => {
    try {
      const nav = navigator as Navigator & {
        connection?: { saveData?: boolean };
      };
      if (nav.connection?.saveData) return; /* data-saver hands carry nothing early */
    } catch {
      /* quiet */
    }
    const atIdle =
      typeof window.requestIdleCallback === "function"
        ? (cb: () => void) =>
            window.requestIdleCallback(() => cb(), { timeout: 1500 })
        : (cb: () => void) => window.setTimeout(cb, 1500);
    atIdle(() => {
      void ensureChamberChunk();
    });
  };
  if (document.readyState === "complete") prefetch();
  else window.addEventListener("load", prefetch, { once: true });
}

/* the docked geometry — the window the whole chamber lays out inside */
type Geo = {
  w: number;
  h: number;
  radius: number;
};

function computeGeo(): Geo {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  /* THE UNCUT MIRROR — the landing chat is never cut in the middle:
     the chamber itself lays out at the window's own size (the scoped
     --app-h below), so the crown, the quiet floor and the whisper
     line all stand complete inside the window. No crop, no slice —
     a whole small portal on the threshold.
     THE TALLER GLASS — the visitor asked for a grander window: the
     docked chat stands taller at every width (the phone's window is
     now twelve percent taller again, 0.670 of its height; the desk
     keeps its 506px cap), still whole.
     THE FIRST SCREEN'S OWN — at the desk the glass now keeps a
     gentle 0.60 of the height (from 0.633), so the whole chamber —
     crown, room and whisper line — stands fully visible in the
     first screen with the hero above it: the chat is the landing's
     main focus, never cut by the fold. */
  if (vw < 640) {
    return {
      w: Math.floor(vw * 0.94),
      /* the phone's window — 0.52 grew to 0.598, and at the
         visitor's word to 0.670 (twelve percent taller): the whole
         chamber inside a taller glass, the crown and the whisper
         line never slipping beneath the fold. */
      h: Math.round(vh * 0.670),
      radius: 26,
    };
  }
  /* THE DESK'S WIDE, CALM WINDOW — a touch wider and taller than
     before (360→414, 440→506, 0.55→0.633 of the height), the whole
     realm laid out inside it at true size.
     THE SMOOTH BORDER — the docked chat wears a gently rounded,
     slightly transparent edge (no frame), soft against the
     threshold beneath.
     THE SHOULDERS' AIR — the still gallery now hangs on both edges
     from 1280 up, so the glass keeps its distance from the plates
     (the same width law the rails wear: 18vw, a 340px crown, and
     never into the 900px column). */
  const rail =
    vw >= 1280
      ? Math.min(340, Math.round(vw * 0.18), Math.floor((vw - 920) / 2))
      : 0;
  const clear = vw >= 1024 ? 2 * rail + 44 : 44;
  return {
    w: Math.max(420, Math.min(880, Math.floor(vw * 0.86) - 24, vw - clear)),
    h: Math.max(414, Math.min(506, Math.round(vh * 0.6))),
    radius: 26,
  };
}

/* the phone's slower hands — on a small screen the covered crossing
   holds its veil a few breaths longer, so the chamber's own re-fit
   (its 0.58s transition ending at ~1120ms) and every first paint stand
   COMPLETE beneath the full light before it lifts: no block pops in
   during the fade, the glide stays whole. The desk keeps its swift
   crossing untouched. */
const PHONE_CROSSING = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 639px)").matches;

/* THE LANDING'S OWN LIGHT — the five fields' accents, read from the
   registry's one truth (SCOPE_META): the gate can never fall out of
   tune with the crown, the canopy or the library again. THE MIRROR
   carries the house's own gold — the standing field. The chosen
   scope's hex rides the chamber as --landing-scope-accent AND
   --scope-a in BOTH gears (docked and fullscreen), so the whole
   chat — the crown's hands, the panels, the composer, the doors,
   the send, the rooms' edges — wears that field's light; each
   field is its own world, tinted by its own color. */
const LANDING_SCOPE_ACCENTS: Record<string, string> = Object.fromEntries(
  LANDING_SCOPES.map((key) => [key, SCOPE_META[key].accent])
);

export default function LandingGate() {
  const { setTheme } = useTheme();
  const landingScope = useMirror((s) => s.landingScope);
  const [phase, setPhase] = useState<Phase>("landing");
  const [Chamber, setChamber] = useState<ComponentType<
    { bare?: boolean; onExpand?: () => void; onMinimize?: () => void }
  > | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [pending, setPending] = useState(false);
  /* THE GUIDE'S OWN PAGE — the threshold's full-screen guide pages
     tell the gate directly (LandingPage calls onGuideOpenChange, so
     even a close riding history.replaceState is heard): while a guide
     stands open the anchored chat steps out of the eye, and it
     returns the moment the guide folds away. */
  const [guideOpen, setGuideOpen] = useState(false);
  /* THE TUNNEL — the crossing itself: while the portal grows, the
     screen belongs to the crystal tunnel alone — the visitor never
     watches the landing's chat fly; they tunnel straight into the
     MAIN portal, and the tunnel's own light folds when the hall
     stands around them. */
  const [tunnel, setTunnel] = useState<"off" | "on" | "fading">("off");
  /* the keeper's name — watched by the realm's own keeping hands */
  const lensRef = useRef<HTMLDivElement | null>(null);
  const landingRootRef = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);
  const landingScroll = useRef(0);
  const phaseRef = useRef<Phase>("landing");
  phaseRef.current = phase;

  /* THE THRESHOLD'S OWN LIGHT — the realm wears the toggle's own
     default: the milky vanilla daylight (TOGGLE ON) is the WEBSITE'S
     DEFAULT, at every fresh visit. The choice itself lives for the
     SESSION: a visitor who turns the toggle off walks the blue crystal
     house for as long as the visit lasts (the word rides the session's
     own keeping, and the crown's hand writes it there), and the moment
     a new visit begins the realm wakes in the vanilla daylight again.
     The seal falls once, at the gate's first breath.
     `setTheme`'s own identity changes whenever the theme changes, so
     the seal watches the storage, never the callback's face. */
  const darkSealed = useRef(false);
  useEffect(() => {
    if (darkSealed.current) return;
    darkSealed.current = true;
    let session: string | null = null;
    try {
      session = window.sessionStorage.getItem("mirror-entity-realm-session");
    } catch {
      /* the session's keeping stays closed — the default serves */
    }
    if (session === "dark") {
      setTheme("dark");
      return;
    }
    setTheme("light");
    try {
      window.sessionStorage.setItem("mirror-entity-realm-session", "light");
      window.localStorage.setItem("mirror-entity-realm", "light");
    } catch {
      /* the keepings stay closed — the realm's own state carries */
    }
  }, [setTheme]);

  /* THE INSTANT FLOOR — the chunk rides the idle prefetch (laid after
     the landing's first breath, never racing the hero): this effect
     only RECEIVES the floor — it never starts the ride itself. */
  useEffect(() => {
    let cancelled = false;
    const receive = (chunk: Promise<ChamberModule>) => {
      void chunk.then((mod) => {
        if (!cancelled)
          setChamber(
            () =>
              mod.default as ComponentType<{
                bare?: boolean;
                onExpand?: () => void;
                onMinimize?: () => void;
              }>
          );
      });
    };
    if (chamberChunk) receive(chamberChunk);
    else floorWaiters.add(receive);
    return () => {
      cancelled = true;
      floorWaiters.delete(receive);
    };
  }, []);

  /* the geometry follows the viewport's WIDTH alone — never the
     keyboard, never the phone's folding URL bar. THE STUCK GLASS LAW:
     the anchored chat is an image stuck on the website — height-only
     drifts (the bar's collapse while scrolling, the keyboard's rise)
     are ignored, so the glass never moves, never grows, never
     shifts a pixel after its first carving. */
  useEffect(() => {
    const apply = () => setGeo(computeGeo());
    apply();
    let lastW = document.documentElement.clientWidth;
    let tm: number | undefined;
    const onResize = () => {
      const w = document.documentElement.clientWidth;
      if (w === lastW) return;
      lastW = w;
      window.clearTimeout(tm);
      tm = window.setTimeout(apply, 180);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(tm);
    };
  }, []);

  /* THE TYPING HOLD — while a field inside the docked glass is focused
     on a phone, the landing's own FRAME follows the visual viewport:
     its top rides the keyboard's pan and its height becomes the visible
     band alone. The glass itself never changes size (the stuck-glass
     law stands — the window is carved once), but the frame it lives in
     now ends exactly where the keys begin, so the frame never leaps
     away with the keyboard's pan (the chat keeps its place) and the
     caret's own keeping — the browser's and the chamber's — stands the
     composer just above the keys: what is typed is always seen.
     THE UNBROKEN KEEP — a quiet keeper re-checks the composer every
     half-breath while the focus lasts (the keyboard's own animation,
     the composer's own growth, every late shift), so the chat stays in
     focus the whole time. THE SLIDE-OUT LAW — the keeper only serves
     while the visitor stays with the chat: the moment their own hand
     scrolls the frame away, the keeper rests until the next focus. On
     blur the frame returns to the whole screen. */
  useEffect(() => {
    if (phase !== "landing") return;
    const root = landingRootRef.current;
    const lens = lensRef.current;
    if (!root || !lens) return;
    const vv = window.visualViewport;
    if (!vv) return;

    let focused = false;
    let keeper: number | undefined;
    let selfScrolling = false;
    let slidOut = false;

    const isEditable = (el: HTMLElement) =>
      el.tagName === "TEXTAREA" ||
      el.tagName === "INPUT" ||
      el.isContentEditable;

    const keep = () => {
      if (!focused) return;
      root.style.top = `${vv.offsetTop}px`;
      root.style.height = `${vv.height}px`;
      root.style.scrollPaddingBottom = "18px";
      if (slidOut) return;
      /* THE GENTLE KEEP — the frame's scroll lifts by only what the
         keys actually buried: the page never leaps half a screen, and
         once the composer stands clear (need ≤ 0) not a pixel moves. */
      const el = document.activeElement;
      if (
        el instanceof HTMLElement &&
        lens.contains(el) &&
        isEditable(el)
      ) {
        const r = el.getBoundingClientRect();
        const need = Math.ceil(r.bottom - vv.offsetTop + 14 - vv.height);
        if (need > 0) {
          selfScrolling = true;
          root.scrollTop += need;
          window.setTimeout(() => {
            selfScrolling = false;
          }, 120);
        }
      }
    };
    const startKeeper = () => {
      window.clearInterval(keeper);
      keeper = window.setInterval(keep, 500);
    };
    const release = () => {
      focused = false;
      slidOut = false;
      window.clearInterval(keeper);
      keeper = undefined;
      root.style.top = "";
      root.style.height = "";
      root.style.scrollPaddingBottom = "";
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !isEditable(el)) return;
      if (!lens.contains(el)) return;
      focused = true;
      slidOut = false;
      keep();
      startKeeper();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!focused) return;
      const next = e.relatedTarget;
      if (next instanceof Node && lens.contains(next)) return;
      release();
    };
    /* THE SLIDE-OUT LAW — a scroll of the frame that our own keep did
       not write is the visitor's own hand: they slid away from the
       chat on purpose, and the keeper rests (the next focus begins
       the keeping again). */
    const onRootScroll = () => {
      if (focused && !selfScrolling) slidOut = true;
    };
    vv.addEventListener("resize", keep);
    vv.addEventListener("scroll", keep);
    root.addEventListener("scroll", onRootScroll, { passive: true });
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    return () => {
      vv.removeEventListener("resize", keep);
      vv.removeEventListener("scroll", keep);
      root.removeEventListener("scroll", onRootScroll);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      window.clearInterval(keeper);
      release();
    };
  }, [phase, geo, Chamber]);

  /* THE GLASS IN THE FLOW — the lens lives inside its slot (the slot
     itself is rendered by the landing page), so the page's own native
     scroll carries the docked chat: no handler writes a transform on
     the walk, the glass and its section are one thing, and the old
     fixed-lens drift, the momentum freeze and the dead area where the
     chat used to stand are all gone at the root. The scroll is only
     remembered here, for the return's own keeping. */
  const handleLandingScroll = useCallback((y: number) => {
    landingScroll.current = y;
  }, []);

  /* THE DORMANT LAW — while the docked portal is scrolled away from
     the eye, every breath inside it rests: no animation frames are
     spent on what nobody sees. The realm wakes the moment its slot
     returns. */
  useEffect(() => {
    if (phase !== "landing") return;
    const lens = lensRef.current;
    if (!lens || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries[entries.length - 1];
        lens.classList.toggle("lens-dormant", !(seen?.isIntersecting ?? true));
      },
      { threshold: 0.02 }
    );
    io.observe(lens);
    return () => {
      io.disconnect();
      lens.classList.remove("lens-dormant");
    };
  }, [phase, geo, Chamber]);

  /* THE FULL PORTAL'S DOOR — every enter hand (the hero's button, the
     offer's link, the crown's fullscreen hand) carries the visitor
     into the MAIN portal itself: the realm grows to the whole screen.
     THE FREE LAW — no passage is ever demanded: the door itself shows
     the main hall to every visitor, guest and keeper alike; the
     passage (the account) rests beside the crown for whoever wants
     their library to travel, never a condition of entering. */
  const expandPortal = useCallback(() => {
    if (busy.current) return;
    if (phaseRef.current === "through") return;
    void (async () => {
      if (!Chamber) {
        setPending(true);
        /* THE VISITOR'S OWN HAND — the enter door is the demand: the
           shared import starts at once (the idle prefetch may never
           have fired), and the early ask is honored the moment the
           chamber arrives (the pending effect below). */
        void ensureChamberChunk();
        return;
      }
      busy.current = true;
      setTunnel("on");
      if (PHONE_CROSSING()) {
        /* THE INSTANT CROSSING — the phone skips the long passage: one
           quick breath of crystal light rises, covers the swap, and
           folds at once — no rings to watch, no blocks appearing, the
           portal simply is. The full passage keeps the desktop. */
        window.setTimeout(() => setPhase("opening"), 180);
        window.setTimeout(() => {
          setPhase("through");
          setTunnel("fading");
          busy.current = false;
        }, 260);
        window.setTimeout(() => setTunnel("off"), 720);
        return;
      }
      /* THE COVERED CROSSING — the tunnel's light is given the WHOLE of
         its rise (pt-in's own 0.32s, plus a settling breath) before the
         lens steps up to the whole screen: the swap happens beneath a
         FULLY opaque tunnel, never through a half-lit veil — the visitor
         never watches the chamber jump, not even for a frame — the
         tunnel is the crossing. */
      window.setTimeout(() => setPhase("opening"), 540);
      window.setTimeout(() => {
        setPhase("through");
        setTunnel("fading");
        window.setTimeout(() => setTunnel("off"), 900);
        busy.current = false;
      }, PHONE_CROSSING() ? 1320 : 1000);
    })();
  }, [Chamber]);

  /* THE GOOGLE PASSAGE'S RETURN — the journey comes home with a
     word when it failed (state, token, profile…): the visitor is
     told gently, and the word leaves the address. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get("google");
    if (!g) return;
    const reasons: Record<string, string> = {
      state: "The Google passage lost its key on the way back — rest, then try again; the email passage serves.",
      token: "Google kept the key — the passage did not open. The email passage serves.",
      profile: "Google would not share the name — the passage did not open. The email passage serves.",
      unverified: "Google's word about the email was missing — the passage cannot open with it.",
      unconfigured: "The Google passage rests — the email passage serves.",
      error: "The Google passage did not open. Rest, then try again — the email passage serves.",
    };
    toast.error(reasons[g] ?? reasons.error);
    params.delete("google");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  /* THE SEND'S OWN RETURN — after a whisper leaves the landing's chat
     (or the chat is cleared), the threshold brings its chat back to
     the eye: the keyboard's fold and the send's own pan never leave
     the glass half-off the screen for the visitor's hand to chase. */
  useEffect(() => {
    const onReturn = () => {
      if (phaseRef.current !== "landing") return;
      const root = landingRootRef.current;
      const lens = lensRef.current;
      if (!root || !lens) return;
      /* the hold's frame only serves while a field keeps the focus */
      const ae = document.activeElement;
      const holding =
        ae instanceof HTMLElement &&
        lens.contains(ae) &&
        (ae.tagName === "TEXTAREA" ||
          ae.tagName === "INPUT" ||
          ae.isContentEditable);
      if (!holding) {
        root.style.top = "";
        root.style.height = "";
        root.style.scrollPaddingBottom = "";
      }
      window.setTimeout(() => {
        if (phaseRef.current !== "landing") return;
        try {
          lens.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch {
          lens.scrollIntoView();
        }
      }, 90);
    };
    window.addEventListener("landing-chat:return", onReturn);
    return () => window.removeEventListener("landing-chat:return", onReturn);
  }, []);

  /* an early ask to enter — honored the moment the chamber arrives */
  useEffect(() => {
    if (pending && Chamber) {
      setPending(false);
      expandPortal();
    }
  }, [pending, Chamber, expandPortal]);

  /* THE RETURN — the portal folds back into its slot in the page.
     THE COVERED CROSSING — the tunnel's light is raised first (the
     screen is its own for a breath), and only beneath that full light
     does the lens step out of the fullscreen and stand in its slot
     again: the visitor never watches the swap, and the landing's own
     chat stands there, every word kept. No flight, no animation — the
     tunnel is the crossing. */
  const minimize = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    /* THE TWO ROOMS' LAW — whatever the main portal still held open
       (the passage's door a guest left standing, a modal of the realm)
       stays with the realm: the return folds the portal's own sheets
       away, so no portal information rides back into the landing's
       chat. The two rooms stay two different things. */
    {
      const st = useMirror.getState();
      if (st.authOpen) st.closeAuth();
      if (st.profilePageOpen) st.closeProfilePage();
      if (st.accountOpen) st.closeAccount();
    }
    setTunnel("on");
    if (PHONE_CROSSING()) {
      /* THE INSTANT RETURN — the phone's fold is as swift as its
         crossing: one quick breath of light, the lens standing in its
         slot beneath it, the whole homecoming inside a breath. */
      window.setTimeout(() => setPhase("landing"), 180);
      window.setTimeout(() => {
        setTunnel("fading");
        busy.current = false;
      }, 500);
      window.setTimeout(() => setTunnel("off"), 960);
      return;
    }
    /* THE FULL COVER ON THE WAY HOME — the lens folds back into its
       slot only after the tunnel stands fully risen (0.32s + a
       settling breath), so the fullscreen-to-slot swap is never seen
       through a half-lit veil. The landing then rests beneath the
       light until the fold begins. */
    window.setTimeout(() => {
      setPhase("landing");
    }, 540);
    window.setTimeout(() => {
      setTunnel("fading");
      busy.current = false;
    }, PHONE_CROSSING() ? 1260 : 940);
    window.setTimeout(() => setTunnel("off"), PHONE_CROSSING() ? 2160 : 1840);
  }, []);

  const fullscreen = phase === "opening" || phase === "through";
  const bare = phase !== "through";

  const docked = phase === "landing";

  /* ------------- THE LENS — the one portal, in its slot -------------
     Docked, the lens stands INSIDE the landing's slot (in the page's
     own flow — the native scroll carries it, never a handler).
     Fullscreen (the opening's breath and the through), it steps out
     with position: fixed — same node, same chamber, not one word
     lost — while the landing beneath rests hidden (visibility only,
     the lens's own word keeps it seen). */
  const lens =
    Chamber && geo ? (
      <div
        ref={lensRef}
        className={cn(
          "left-0 top-0 z-[45] transition-opacity duration-500",
          fullscreen ? "fixed" : "absolute",
          docked && "lens-docked",
          /* THE GUIDE'S PAGE — a full-screen guide covers the anchored
             chat the same way: the page is the guide's alone. The
             hidden word is spoken inline so it also stills the tab
             and the touch. */
          docked && guideOpen && "pointer-events-none opacity-0"
        )}
        style={{
          width: fullscreen ? "100vw" : geo.w,
          height: fullscreen ? "var(--vh-safe)" : geo.h,
          visibility: docked && guideOpen ? "hidden" : "visible",
        }}
      >
          <div
            data-testid="portal-lens"
            className={cn(
              "lens-frame absolute inset-0 overflow-hidden border bg-background",
              /* THE SMOOTH BORDER — while the portal rests docked on the
                 threshold its edge is a soft, slightly transparent line
                 with a faint crystal breath of shadow (no filter, no
                 animation — the phone pays nothing); the full portal
                 keeps its own solid edge. */
              docked
                ? "border-[var(--lp-edge)] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95),0_0_44px_-20px_rgba(92,122,82,0.4),0_0_30px_-16px_rgba(124,95,143,0.35)]"
                : "border-white/10 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]"
            )}
            style={{ borderRadius: fullscreen ? 0 : geo.radius }}
          >
            {/* THE WHOLE CHAMBER IN ITS WINDOW — docked, the chamber
                lays out at the window's own size through a scoped
                --app-h (its crown, floor and whisper line all stand
                complete inside — nothing cut) and the keyboard's own
                shift rests (the window itself never moves). Fullscreen,
                the chamber takes the true viewport again. */}
            <div
              className="absolute inset-0 m-auto"
              style={
                fullscreen
                  ? ({
                      width: "100vw",
                      height: "var(--vh-safe)",
                      /* THE SCOPE'S OWN LIGHT — the field rides the
                         fullscreen gear too: the whole chat wears it. */
                      "--scope-a":
                        LANDING_SCOPE_ACCENTS[landingScope] ?? "#d8b571",
                      "--landing-scope-accent":
                        LANDING_SCOPE_ACCENTS[landingScope] ?? "#d8b571",
                    } as CSSProperties)
                  : ({
                      width: geo.w,
                      height: geo.h,
                      "--app-h": `${geo.h}px`,
                      "--app-shift": "0px",
                      /* THE SCOPE'S OWN LIGHT — the threshold's chosen
                         field tints the WHOLE chat (the crown, the
                         panels, the composer, the doors, the send —
                         see LANDING_SCOPE_ACCENTS): every field is
                         its own world, wearing its own color. */
                      "--scope-a":
                        LANDING_SCOPE_ACCENTS[landingScope] ?? "#d8b571",
                      "--landing-scope-accent":
                        LANDING_SCOPE_ACCENTS[landingScope] ?? "#d8b571",
                    } as CSSProperties)
              }
            >
              {/* THE TWO GEARS' OWN HANDS — each gear wears only its
                  own hand, and both live at the crown's own CORNER:
                  docked (the landing phase) the corner carries the
                  expand hand (the chat fills the screen); through (the
                  fullscreen gear) the very same corner carries the
                  minimize hand (the chat folds back into its slot).
                  During the opening's tunnel breath neither hand
                  stands — the tunnel covers the crossing. The chat is
                  the SAME chat in both gears — the hands only gear the
                  window's size, and the corner wears a hand only when
                  its callback exists. There is NO hand that hides the
                  chat: the conversation never folds away. */}
              <Chamber
                bare={bare}
                {...(docked ? { onExpand: expandPortal } : {})}
                {...(phase === "through" ? { onMinimize: minimize } : {})}
              />
            </div>

            {/* THE FRAME IS GONE — the gilded filigree has left the
                threshold: the chat stands on its own smooth, slightly
                transparent border now, wearing the crystal light. */}
          </div>

          {/* THE CROWN'S OWN HANDS — the whole chamber stands inside
              its window now, so the portal's own crown carries every
              hand again: the crossing (the corner's fullscreen hand)
              lives at the crown's corner — no hand hides the chat, no
              second pair of hands rides the lens edge. */}
        </div>
    ) : null;

  return (
    <>
      {/* ---------------- THE LANDING — the threshold ----------------
          The threshold is NEVER unmounted now: through the portal's
          fullscreen reign it only rests unseen (visibility alone), so
          the lens's slot, the walk's own scroll and every word of the
          house keep their places — the return is instant and whole. */}
      <div
        ref={landingRootRef}
        data-testid="landing-root"
        className={cn(
          "fixed inset-0 z-30 overflow-y-auto overscroll-y-contain bg-[var(--lp-deep)]",
          phase === "opening" && "pointer-events-none",
          phase === "through" && "invisible"
        )}
      >
        <LandingPage
          slotStyle={
            geo
              ? { width: geo.w, height: geo.h }
              : /* THE WAKING GROUND — before the true window is carved,
                   the slot wears the waking height: on the phone ~67%
                   of the screen (the taller glass it will become), so
                   the carved window never arrives as a jump; the desk
                   keeps its own waking height (globals.css holds the
                   phone's value). */
                {
                  height:
                    "var(--portal-waking-h, min(var(--vh-safe), 660px))",
                }
          }
          onScroll={handleLandingScroll}
          initialScroll={landingScroll.current}
          onGuideOpenChange={setGuideOpen}
          slotChildren={lens}
        />
      </div>

      {/* THE RETURN HAND — the portal's own crown carries it now: the
          landing control stands at the crown's corner, one touch
          folding the realm back into its slot on the threshold. */}
      {/* THE TUNNEL — the direct crossing into the MAIN portal: the
          screen fills with the crystal passage the moment an enter
          hand is pressed, so the visitor never watches the landing's
          chat fly first — they tunnel straight into the main hall. */}
      {tunnel !== "off" && (
        <div
          aria-hidden="true"
          data-testid="portal-tunnel"
          className={cn(
            "portal-tunnel fixed inset-0 z-[70]",
            tunnel === "fading" && "portal-tunnel-fading",
            /* THE PHONE'S OWN LIGHT — the quick crossing wears the
               minimal veil: no rings, no streaks, one breath of glow */
            PHONE_CROSSING() && "portal-tunnel-quick"
          )}
        >
          <span className="pt-glow" />
          <span className="pt-ring" />
          <span className="pt-ring pt-ring-2" />
          <span className="pt-ring pt-ring-3" />
          <span className="pt-ring pt-ring-4" />
          <span className="pt-streaks" />
          <span className="pt-sigil">
            <img src="/images/landing/sigils/sigil-09.png" alt="" width={256} height={256} decoding="async" />
          </span>
        </div>
      )}
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
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

/* THE INSTANT FLOOR — the chamber's chunk is pulled the moment this
   module itself is evaluated — before React even hydrates — so the
   landing's chat rides the network's very first breath instead of
   waiting for the gate's first effect. */
const chamberChunk: Promise<{
  default: ComponentType<{
    bare?: boolean;
    onExpand?: () => void;
    onMinimize?: () => void;
    onFoldChat?: () => void;
  }>;
}> | null =
  typeof window === "undefined"
    ? null
    : import("@/components/mirror/AppShell");

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
     docked chat stands fifteen percent taller at every width (0.598
     of the phone's height, a 506px desk cap), still whole. */
  if (vw < 640) {
    return {
      w: Math.floor(vw * 0.94),
      /* the phone's window — 0.52 grew to 0.598 (fifteen percent
         taller): the whole chamber inside a taller glass, the crown
         and the whisper line never slipping beneath the fold. */
      h: Math.round(vh * 0.598),
      radius: 26,
    };
  }
  /* THE DESK'S WIDE, CALM WINDOW — a touch wider and taller than
     before (360→414, 440→506, 0.55→0.633 of the height), the whole
     realm laid out inside it at true size.
     THE SMOOTH BORDER — the docked chat wears a gently rounded,
     slightly transparent edge (no frame), soft against the
     threshold beneath. */
  const rail = Math.min(210, Math.max(130, Math.round(vw * 0.13)));
  const clear = vw >= 1024 ? 2 * rail + 44 : 44;
  return {
    w: Math.max(420, Math.min(880, Math.floor(vw * 0.86) - 24, vw - clear)),
    h: Math.max(414, Math.min(506, Math.round(vh * 0.633))),
    radius: 26,
  };
}

export default function LandingGate() {
  const { setTheme } = useTheme();
  const [phase, setPhase] = useState<Phase>("landing");
  const [Chamber, setChamber] = useState<ComponentType<
    { bare?: boolean; onExpand?: () => void; onMinimize?: () => void; onFoldChat?: () => void }
  > | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [pending, setPending] = useState(false);
  /* THE FOLDED CHAT — the landing chat's dropdown hand folds the
     whole chat section away (the lens itself rests, invisible but
     mounted, so not one word of the conversation is lost), and the
     threshold's own ground carries the invitation to call her back. */
  const [chatFolded, setChatFolded] = useState(false);
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
  /* the keeper's name — watched so the portal's own intention can
     carry a newly-signed visitor straight through the full portal */
  const me = useMirror((s) => s.me);
  const authOpen = useMirror((s) => s.authOpen);
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

  /* THE INSTANT FLOOR — the chunk already rides (pulled at the
     module's own breath above): this effect only receives it. */
  useEffect(() => {
    let cancelled = false;
    void (chamberChunk ?? import("@/components/mirror/AppShell")).then((mod) => {
      if (!cancelled)
        setChamber(
          () =>
            mod.default as ComponentType<{
              bare?: boolean;
              onExpand?: () => void;
              onMinimize?: () => void;
              onFoldChat?: () => void;
            }>
        );
    });
    return () => {
      cancelled = true;
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
     offer's link, the crown's fullscreen hand) now carries the visitor
     into the MAIN portal itself: the realm grows to the whole screen,
     and a guest meets the passage's door standing inside it — never a
     bounce back into the landing's chat. The paid law still stands:
     the realm's own offerings open by registration or login (the
     wallet and the credits keep their watch); the door itself shows
     the main hall. The landing's own floor stays free forever. */
  const expandPortal = useCallback(() => {
    if (busy.current) return;
    if (phaseRef.current === "through") return;
    setChatFolded(false);
    void (async () => {
      const st = useMirror.getState();
      let cur = st.me;
      if (!cur) {
        await st.refreshMe();
        cur = useMirror.getState().me;
      }
      if (busy.current) return;
      if (!Chamber) {
        setPending(true);
        return;
      }
      const guest = !cur || cur.email.startsWith("anon:");
      /* THE KEEPER'S MEMORY — a browser that has passed the passage
        once is remembered: every enter hand opens the main portal
        freely from then on, the door never asked again. */
      let ever = false;
      try {
        ever = window.localStorage.getItem("mirror.everSignedIn") === "1";
      } catch {
        /* the private keeping stays closed — the store's own word */
      }
      busy.current = true;
      setTunnel("on");
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
        /* the guest's first passage — the door opens inside the main
           portal, and the wish stands so the moment the passage
           names its keeper the walk simply continues. THE KEEPER'S
           MEMORY: a browser that passed once is never asked again. */
        if (guest && !ever) {
          useMirror.getState().setPortalIntent(true);
          try {
            sessionStorage.setItem("mirror.portalIntent", "1");
          } catch {
            /* the session's memory stays closed — the store's flag carries */
          }
          useMirror.getState().openAuth("signin");
        }
      }, 1000);
    })();
  }, [Chamber]);

  /* THE INTENTION'S OWN HAND — the passage named its keeper while the
     portal's wish was standing: through they go, at once. */
  useEffect(() => {
    if (phaseRef.current !== "landing") return;
    if (!me || me.email.startsWith("anon:")) return;
    const st = useMirror.getState();
    let flagged = st.portalIntent;
    try {
      flagged = flagged || sessionStorage.getItem("mirror.portalIntent") === "1";
    } catch {
      /* the session's memory stays closed — the store's flag decides */
    }
    if (!flagged) return;
    st.setPortalIntent(false);
    try {
      sessionStorage.removeItem("mirror.portalIntent");
    } catch {
      /* already forgotten */
    }
    expandPortal();
  }, [me, expandPortal]);

  /* THE SPENT WISH — if the passage's door closes with the visitor
     still a guest (they turned away themselves), the portal's wish
     is spent; a later sign-in from the profile must not yank them
     through the portal uninvited. */
  useEffect(() => {
    if (authOpen) return;
    const st = useMirror.getState();
    const cur = st.me;
    if (!cur || cur.email.startsWith("anon:")) {
      if (st.portalIntent) st.setPortalIntent(false);
      try {
        sessionStorage.removeItem("mirror.portalIntent");
      } catch {
        /* already forgotten */
      }
    }
  }, [authOpen]);

  /* THE GOOGLE PASSAGE'S RETURN — the journey comes home with a
     word when it failed (state, token, profile…): the visitor is
     told gently, the wish is spent, and the word leaves the address. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get("google");
    if (!g) return;
    useMirror.getState().setPortalIntent(false);
    try {
      sessionStorage.removeItem("mirror.portalIntent");
    } catch {
      /* already forgotten */
    }
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
      if (st.profileOpen) st.closeProfile();
      if (st.profilePageOpen) st.closeProfilePage();
      if (st.accountOpen) st.closeAccount();
    }
    setTunnel("on");
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
    }, 940);
    window.setTimeout(() => setTunnel("off"), 1840);
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
          /* THE FOLDED CHAT — the whole chat section steps out of
             the eye (still mounted, still remembering) while the
             threshold beneath shows the way back. THE GUIDE'S PAGE —
             a full-screen guide covers the anchored chat the same
             way: the page is the guide's alone. The hidden word is
             spoken inline so it also stills the tab and the touch. */
          docked && (chatFolded || guideOpen) && "pointer-events-none opacity-0"
        )}
        style={{
          width: fullscreen ? "100vw" : geo.w,
          height: fullscreen ? "100dvh" : geo.h,
          visibility: docked && (chatFolded || guideOpen) ? "hidden" : "visible",
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
                  ? { width: "100vw", height: "100dvh" }
                  : ({
                      width: geo.w,
                      height: geo.h,
                      "--app-h": `${geo.h}px`,
                      "--app-shift": "0px",
                    } as CSSProperties)
              }
            >
              <Chamber
                bare={bare}
                onExpand={expandPortal}
                onMinimize={minimize}
                onFoldChat={() => setChatFolded(true)}
              />
            </div>

            {/* THE FRAME IS GONE — the gilded filigree has left the
                threshold: the chat stands on its own smooth, slightly
                transparent border now, wearing the crystal light. */}
          </div>

          {/* THE CROWN'S OWN HANDS — the whole chamber stands inside
              its window now, so the portal's own crown carries every
              hand again: the crossing (crown-expand) and the fold
              (the crown's own dropdown hand) live in the top row —
              no second pair of hands rides the lens edge. The hero's
              “Enter the portal” on the page carries the same growth. */}
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
              ? /* THE TRUE FOLD — when the chat is folded the slot
                   itself collapses to a slim invitation bar, so the
                   chat's space folds away with it; the words stay
                   mounted in the lens (invisible, remembering). */
                chatFolded
                ? { width: geo.w, height: 68 }
                : { width: geo.w, height: geo.h }
              : { height: "min(100dvh, 660px)" }
          }
          onExpand={expandPortal}
          onScroll={handleLandingScroll}
          initialScroll={landingScroll.current}
          chatFolded={chatFolded}
          onUnfoldChat={() => setChatFolded(false)}
          onGuideOpenChange={setGuideOpen}
          slotChildren={lens}
        />
      </div>

      {/* THE RETURN HAND — the portal's own crown carries it now: the
          landing control stands between the about door and the
          visitor's passage, one touch folding the realm back into its
          slot on the threshold. */}
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
            tunnel === "fading" && "portal-tunnel-fading"
          )}
        >
          <span className="pt-glow" />
          <span className="pt-ring" />
          <span className="pt-ring pt-ring-2" />
          <span className="pt-ring pt-ring-3" />
          <span className="pt-ring pt-ring-4" />
          <span className="pt-streaks" />
          <span className="pt-sigil">
            <img src="/images/landing/sigils/sigil-09.png" alt="" />
          </span>
        </div>
      )}
    </>
  );
}

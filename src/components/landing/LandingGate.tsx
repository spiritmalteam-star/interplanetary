"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
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
/*  THE WHOLE MIRROR — the docked chamber is never cropped again: it   */
/*  lays out at the window's own size (its own --app-h), so the crown, */
/*  the quiet floor and the whisper line all stand inside the window — */
/*  nothing cut in the middle. The window itself stands smaller in     */
/*  height and a touch wider than before. Expand and minimize cross    */
/*  the crystal tunnel — the chamber re-fits behind the tunnel's light,*/
/*  the conversation never losing a breath.                            */
/* ------------------------------------------------------------------ */

type Phase = "landing" | "opening" | "through" | "closing";

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
  const slotRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
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

  /* THE ANCHORED CHAT — the glass is STUCK TO ITS SECTION like an
     image stuck on the website: its place is measured once in the
     landing's own CONTENT coordinates (rect + scrollTop — a sum that
     is the same at every scroll breath), and the walk itself moves it
     with the page — when the threshold scrolls, the chat rides its own
     section ("The mirror is waking…") exactly, never floating over the
     house's other rooms, never riding the viewport, never lagging a
     frame behind (one transform write per scroll breath, in the same
     breath as the scroll itself). */
  const lensPos = useRef({ x: 0, y: 0 });

  /* the glass's screen place — its content place minus the walk */
  const applyLensScreenPos = useCallback(() => {
    const lens = lensRef.current;
    if (!lens) return;
    if (phaseRef.current === "opening" || phaseRef.current === "through") return;
    const { x, y } = lensPos.current;
    lens.style.transform = `translate3d(${x}px, ${Math.round(y - landingScroll.current)}px, 0)`;
  }, []);

  const syncLens = useCallback(() => {
    const lens = lensRef.current;
    const slot = slotRef.current;
    if (!lens || !slot) return;
    const r = slot.getBoundingClientRect();
    /* the landing's own scroll — found by walking up from the slot to
       the first genuinely scrollable ancestor (the threshold's ground) */
    let scroller: HTMLElement | null = slot.parentElement;
    let scrollTop = landingScroll.current;
    while (scroller) {
      const oy = window.getComputedStyle(scroller).overflowY;
      if ((oy === "auto" || oy === "scroll") && scroller.scrollHeight > scroller.clientHeight + 1) {
        scrollTop = scroller.scrollTop;
        break;
      }
      scroller = scroller.parentElement;
    }
    lensPos.current = {
      x: Math.round(r.left),
      y: Math.round(r.top + scrollTop),
    };
    applyLensScreenPos();
  }, [applyLensScreenPos]);

  useLayoutEffect(() => {
    if (phase !== "landing") return;
    syncLens();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled && phaseRef.current === "landing") syncLens();
    });
    return () => {
      cancelled = true;
    };
  }, [phase, geo, Chamber, syncLens]);

  /* THE UNFOLD'S OWN SYNC — the fold is TRUE now: the slot itself
     collapses with the chat (the space folds away, not just the
     glass), and when the chat rises again the slot regrows — the
     lens finds its place twice, once at the first breath and once
     after the slot's own height transition settles. */
  useEffect(() => {
    if (phase !== "landing" || chatFolded) return;
    syncLens();
    const id = window.setTimeout(syncLens, 560);
    return () => window.clearTimeout(id);
  }, [chatFolded, phase, syncLens]);

  /* THE ANCHOR'S LAW — the scroll is remembered for the return (the
     closing's restore) and the glass moves WITH it in the same breath:
     the chat stays glued to its section at every step of the walk. */
  const handleLandingScroll = useCallback(
    (y: number) => {
      landingScroll.current = y;
      applyLensScreenPos();
    },
    [applyLensScreenPos]
  );

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
      setPhase("opening");
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
      }, 680);
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
     THE RETURN'S OWN CROSSING — the chamber re-fits itself to the
     window behind the crystal tunnel's light (the same passage the
     crossing in uses), so the visitor never watches the re-fit —
     the tunnel opens, the portal folds, the tunnel's light fades
     and the landing's own chat stands there, every word kept. */
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
    window.setTimeout(() => {
      setPhase("closing");
    }, 150);
    window.setTimeout(() => {
      setTunnel("fading");
      busy.current = false;
      /* THE FOLD'S OWN END — the closing was a phase without a way
         home before: the lens kept its animation cloak (every move
         lagged a breath behind) and the docked laws never returned.
         The fold's completion now lands the threshold back in its own
         phase — the docked glass laws wake again, exactly as the
         window settles into its slot. */
      setPhase("landing");
      window.setTimeout(() => setTunnel("off"), 900);
    }, 800);
  }, []);

  /* the expanding lens flies to the screen's corners */
  useLayoutEffect(() => {
    if (phase !== "opening") return;
    const lens = lensRef.current;
    if (lens) lens.style.transform = "translate3d(0, 0, 0)";
  }, [phase]);

  /* during the closing the landing remounts and restores its own
     scroll; only then can the lens find its slot again */
  useEffect(() => {
    if (phase !== "closing") return;
    const id = window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(syncLens));
    }, 80);
    return () => window.clearTimeout(id);
  }, [phase, syncLens]);

  const animating = phase === "opening" || phase === "closing";
  const fullscreen = phase === "opening" || phase === "through";
  const bare = phase !== "through";

  const docked = phase === "landing";

  return (
    <>
      {/* ---------------- THE LANDING — the threshold ---------------- */}
      {phase !== "through" && (
        <div
          data-testid="landing-root"
          className={cn(
            "fixed inset-0 z-30 overflow-y-auto overscroll-y-contain bg-[var(--lp-deep)] transition-opacity duration-500",
            phase === "opening" && "pointer-events-none opacity-0"
          )}
        >
          <LandingPage
            slotRef={slotRef}
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
          />
        </div>
      )}

      {/* ------------- THE LENS — the one portal, docked ------------- */}
      {Chamber && geo && (
        <div
          ref={lensRef}
          className={cn(
            "fixed left-0 top-0 z-[45] transition-opacity duration-500",
            docked && "lens-docked",
            animating && "lens-anim",
            /* THE FOLDED CHAT — the whole chat section steps out of
               the eye (still mounted, still remembering) while the
               threshold beneath shows the way back. THE GUIDE'S PAGE —
               a full-screen guide covers the anchored chat the same
               way: the page is the guide's alone. */
            docked && (chatFolded || guideOpen) && "pointer-events-none opacity-0"
          )}
          style={{
            width: fullscreen ? "100vw" : geo.w,
            height: fullscreen ? "100dvh" : geo.h,
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
                the chamber takes the true viewport again. The chamber
                rides centred in its lens, so the closing's fold keeps
                it steady inside the shrinking window. */}
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
      )}

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

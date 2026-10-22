"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { ChevronDown, Maximize2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";
import LandingPage from "./LandingPage";

/* ------------------------------------------------------------------ */
/*  THE THRESHOLD'S GATE.                                              */
/*                                                                     */
/*  There is only ONE portal in this house. The chamber itself — the   */
/*  whole living application — stands docked inside the landing page   */
/*  as the miniature portal: the real realm at its true proportions,   */
/*  live and working, without its suggestion wall. The expand hand     */
/*  opens nothing and carries nothing — the very same portal simply    */
/*  grows to fill the screen, every word of the conversation already   */
/*  inside it, and the minimize hand folds it back into its slot.      */
/*                                                                     */
/*  THE LENS: the chamber renders at the viewport's true size and is   */
/*  read through a clipped window — on the phone the window is the     */
/*  full width (the portal stretches fully on both sides at 1:1); on   */
/*  the desk it is a diorama at four fifths, cropped around the        */
/*  realm's own heart. Expand and minimize are transform-and-clip      */
/*  animations only — the chamber never re-mounts, never re-lays out,  */
/*  never loses a breath.                                              */
/* ------------------------------------------------------------------ */

type Phase = "landing" | "opening" | "through" | "closing";

/* the docked geometry — how the real chamber presents its miniature */
type Geo = {
  w: number | string;
  h: number | string;
  s: number;
  tx: number;
  ty: number;
  radius: number;
};

function computeGeo(): Geo {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  /* THE WIDER, SHORTER MIRROR — the landing chat stands a tenth wider
     than before and a quarter shorter: a wide, calm window onto the
     realm. THE WINDOW'S SIGHT — the window reads the realm's lower
     hall, anchored to its floor: the conversation's ground (the mark,
     the question, the suggestions, the whisper line) stands fully
     alive while the crown rests above the sightline; the threshold's
     own hands at the window's edge fold and raise the portal. The
     chamber itself is never re-laid-out — the lens only chooses what
     it looks at (transform-and-clip only, the phone stays cool).
     dvh keeps the window and the chamber in lockstep when the
     keyboard rises. */
  if (vw < 640) {
    const s = 0.92;
    const w = Math.floor(vw * s);
    const h = Math.round(vh * 0.615);
    return {
      w,
      h,
      s,
      tx: 0,
      ty: -Math.round(s * vh - h),
      radius: 26,
    };
  }
  /* THE DESK'S WIDER, LOWER DIORAMA — the realm nearer (0.86) and read
     through a window a quarter shorter than before, anchored to the
     realm's floor the same way; the horizontal crop centres the
     heart as ever. THE SMOOTH BORDER — the docked chat wears a
     gently rounded, slightly transparent edge (no frame), soft
     against the threshold beneath. */
  const s = 0.86;
  const rail = Math.min(210, Math.max(130, Math.round(vw * 0.13)));
  const clear = vw >= 1024 ? 2 * rail + 44 : 44;
  const w = Math.max(420, Math.min(840, Math.floor(s * vw) - 24, vw - clear));
  const h = Math.max(380, Math.min(468, Math.floor(vh * 0.6)));
  const cropW = w / s;
  const cropX = Math.max(0, (vw - cropW) / 2);
  return {
    w,
    h,
    s,
    tx: -Math.round(s * cropX),
    ty: -Math.round(s * vh - h),
    radius: 26,
  };
}

export default function LandingGate() {
  const t = useT();
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

  /* THE THRESHOLD'S OWN LIGHT — the portal grows out of a midnight
     page, so the chamber wears its dark vestment here (the realm's
     own light-toggle keeps working; a chosen light stays chosen).
     THE ONE SEAL — the midnight is sealed exactly once, at the
     gate's first breath: `setTheme`'s own identity changes whenever
     the theme changes, so a bare [setTheme] dependency would slam
     the door shut again the moment the visitor's hand picks the
     light — the toggle would never leave the dark. */
  const darkSealed = useRef(false);
  useEffect(() => {
    if (darkSealed.current) return;
    darkSealed.current = true;
    setTheme("dark");
  }, [setTheme]);

  /* THE INSTANT FLOOR — the chamber's chunk is pulled the moment the
     gate itself mounts, with no idle wait and no backstop timer: the
     import rides the same breath as the page's own hydration, so the
     landing's chat is alive as fast as the network allows. */
  useEffect(() => {
    let cancelled = false;
    void import("@/components/mirror/AppShell").then((mod) => {
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

  /* the geometry follows the viewport, never the keyboard */
  useEffect(() => {
    const apply = () => setGeo(computeGeo());
    apply();
    let tm: number | undefined;
    const onResize = () => {
      window.clearTimeout(tm);
      tm = window.setTimeout(apply, 180);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(tm);
    };
  }, []);

  /* THE DOCK — while the visitor walks the landing, the lens rides
     exactly over its slot: one transform per scroll breath (rAF-held,
     never more than one read-write pair per frame — the page stays
     liquid and the phone stays cool). */
  const syncLens = useCallback(() => {
    const lens = lensRef.current;
    const slot = slotRef.current;
    if (!lens || !slot) return;
    const r = slot.getBoundingClientRect();
    lens.style.transform = `translate3d(${Math.round(r.left)}px, ${Math.round(
      r.top
    )}px, 0)`;
  }, []);
  const syncRaf = useRef(false);
  const syncLensFrame = useCallback(() => {
    if (syncRaf.current) return;
    syncRaf.current = true;
    requestAnimationFrame(() => {
      syncRaf.current = false;
      if (phaseRef.current === "landing") syncLens();
    });
  }, [syncLens]);

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

  const handleLandingScroll = useCallback(
    (y: number) => {
      landingScroll.current = y;
      syncLensFrame();
    },
    [syncLensFrame]
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

  /* THE RETURN — the portal folds back into its slot in the page */
  const minimize = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setPhase("closing");
    window.setTimeout(() => {
      setPhase("landing");
      busy.current = false;
    }, 700);
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
            "fixed inset-0 z-30 overflow-y-auto overscroll-y-contain bg-[#05070d] transition-opacity duration-500",
            phase === "opening" && "pointer-events-none opacity-0"
          )}
        >
          <LandingPage
            slotRef={slotRef}
            slotStyle={
              geo
                ? { width: geo.w, height: geo.h }
                : { height: "min(100dvh, 660px)" }
            }
            onExpand={expandPortal}
            onScroll={handleLandingScroll}
            initialScroll={landingScroll.current}
            chatFolded={chatFolded}
            onUnfoldChat={() => setChatFolded(false)}
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
               threshold beneath shows the way back */
            docked && chatFolded && "pointer-events-none opacity-0"
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
                ? "border-white/[0.08] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95),0_0_44px_-20px_rgba(56,189,248,0.3),0_0_30px_-16px_rgba(255,77,109,0.22)]"
                : "border-white/10 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]"
            )}
            style={{ borderRadius: fullscreen ? 0 : geo.radius }}
          >
            <div
              className={cn(
                "absolute left-0 top-0 h-[var(--app-h,100dvh)] w-screen",
                animating && "lens-inner-anim"
              )}
              style={{
                transformOrigin: "0 0",
                transform:
                  phase === "landing" || phase === "closing"
                    ? `translate3d(${geo.tx}px, ${geo.ty}px, 0) scale(${geo.s})`
                    : "translate3d(0, 0, 0) scale(1)",
              }}
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

          {/* THE SLOT'S OWN HANDS — the window reads the realm's lower
              hall now (the crown rests above its sight), so the
              threshold itself carries the two hands at the window's
              edge: one folds the whole chat away with every word kept,
              one raises the MAIN portal. They stand only while the
              portal rests docked and unfolded, and they ride the lens
              itself so they never drift from its frame. */}
          {docked && !chatFolded && (
            <div className="absolute right-2.5 top-2.5 z-[5] flex items-center gap-1.5">
              <button
                type="button"
                onClick={expandPortal}
                aria-label={t("Fullscreen")}
                title={t("Fullscreen — opens the main portal")}
                data-testid="slot-expand"
                className="focus-glow flex size-7 items-center justify-center rounded-full border border-[rgba(232,217,176,0.42)] bg-[rgba(8,12,20,0.55)] text-[#e8d9b0] backdrop-blur-sm transition-all duration-300 hover:border-[rgba(232,217,176,0.8)] hover:text-[#f6ecd2]"
              >
                <Maximize2 className="size-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setChatFolded(true)}
                aria-label={t("Fold the chat away")}
                title={t("Fold the chat away")}
                data-testid="slot-fold"
                className="focus-glow flex size-7 items-center justify-center rounded-full border border-[rgba(232,217,176,0.42)] bg-[rgba(8,12,20,0.55)] text-[#e8d9b0] backdrop-blur-sm transition-all duration-300 hover:border-[rgba(232,217,176,0.8)] hover:text-[#f6ecd2]"
              >
                <ChevronDown className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* THE EXPAND HAND — the portal's own crown carries it now:
              the fullscreen control stands between the about door and
              the visitor's passage, exactly where the threshold's
              other hands live. The hero's “Enter the portal” on the
              page carries the same growth. */}
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

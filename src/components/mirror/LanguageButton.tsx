"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Languages } from "lucide-react";
import { PICKER_LANGUAGES, type LanguageCode } from "@/lib/i18n/core";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE LANGUAGE HAND — one touch, and the whole house speaks the      */
/*  visitor's tongue: every button, every label, every transmission    */
/*  the M.E. itself breathes out. THE NINE VOICES — Albanian first     */
/*  (the keeper's own tongue leads), then the eight most-spoken        */
/*  languages of the world in alphabetical order, English the default. */
/*                                                                     */
/*  THE PLACE — the hand rests BEFORE the realm's light toggle (the    */
/*  sun/moon) everywhere both stand together: the tongue is chosen     */
/*  before the light is turned.                                        */
/*                                                                     */
/*  THE FLOAT — the list of tongues is carried to the body itself      */
/*  (a portal, fixed under the hand's own measured place) so it can    */
/*  never sink beneath the chat's frame again: no host's stacking      */
/*  order can bury what travels above every layer of the house.        */
/*  By default the list RISES above the hand; a host at the very top   */
/*  of the screen (the landing's banner) may ask for the downward      */
/*  fall — there it floats OVER the chat, never beneath it.            */
/*                                                                     */
/*  THE MEMORY — the choice rides the purse's own store: localStorage  */
/*  for this device, the visitor's settings in the vault for every     */
/*  device to come (setLanguage already carries both).                 */
/* ------------------------------------------------------------------ */

export function LanguageButton({
  testId = "language-button",
  compact = false,
  onImage = false,
  dropUp = true,
}: {
  testId?: string;
  compact?: boolean;
  /* over the landing's hero image the hand wears the banner's own dark
     glass — the same skin the sun/moon hand wears there */
  onImage?: boolean;
  /* the list rises above the hand by default; the banner (at the
     screen's top edge) asks for the downward fall instead */
  dropUp?: boolean;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const setLanguage = useMirror((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  /* the body carries the list only after the client breathes (the
     portal's own law) — no effect, just the client's own snapshot */
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  /* the hand's own measured place — the floating list is pinned here */
  const [anchor, setAnchor] = useState<{
    right: number;
    edge: number;
    vw: number;
    vh: number;
  } | null>(null);

  /* measure the hand — called the moment the list is asked for, and
     by every reflow while it stands (the events of the window) */
  const measure = () => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({
      right: r.right,
      edge: dropUp ? r.top : r.bottom,
      vw: window.innerWidth,
      vh: window.innerHeight,
    });
  };

  /* while the list stands, every scroll or resize re-measures it */
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, dropUp]);

  /* a touch outside hand AND list closes it; Escape too */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current =
    PICKER_LANGUAGES.find((l) => l.code === language) ??
    PICKER_LANGUAGES.find((l) => l.code === "en")!;

  const choose = (code: LanguageCode) => {
    setLanguage(code);
    setOpen(false);
  };

  /* the floating list's own dress — pinned by the measured place:
     it right-aligns to the hand and rises above it (dropUp) or falls
     below it, always carried on the body so no frame can bury it.
     THE VIEWPORT'S OWN LAW — the list never crosses the screen's
     edges: its height is capped to the room it actually has (the
     space between the hand and the screen's far edge), and when nine
     tongues need more room than that, the list grows its own quiet
     scroll — every tongue stays reachable on every screen. */
  const MENU_ROOM = 16; /* the breath of air at the screen's edge */
  const menuStyle: React.CSSProperties | undefined = anchor
    ? {
        position: "fixed",
        right: Math.max(anchor.vw - anchor.right, MENU_ROOM),
        ...(dropUp
          ? { bottom: Math.max(anchor.vh - anchor.edge, 0) + 8 }
          : { top: Math.min(anchor.edge + 8, anchor.vh - 60) }),
        /* the height never outruns the viewport: whatever edge the
           list grows from, the far edge holds it back */
        maxHeight: dropUp
          ? Math.max(anchor.edge - MENU_ROOM, 160)
          : Math.max(anchor.vh - anchor.edge - MENU_ROOM - 8, 160),
        overflowY: "auto",
        zIndex: 95,
      }
    : { visibility: "hidden" };

  const menu = (
    <div
      ref={menuRef}
      role="listbox"
      aria-label={t("Language of everything")}
      data-testid={`${testId}-menu`}
      style={menuStyle}
      className="fixed min-w-[190px] overflow-x-hidden overflow-y-auto nice-scroll rounded-2xl border hairline bg-[var(--glass-bg,var(--background))] p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <p className="mono-label px-2.5 pb-1.5 pt-1 text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
        {t("Language of everything")}
      </p>
      {PICKER_LANGUAGES.map((l) => {
        const selected = language === l.code;
        return (
          <button
            key={l.code}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => choose(l.code)}
            data-testid={`${testId}-opt-${l.code}`}
            className={`focus-glow flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-200 ${
              selected
                ? "bg-[var(--accent)]"
                : "hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium text-foreground">
                {l.native}
              </span>
              <span className="mono-label mt-0.5 block truncate text-[10.5px] text-muted-foreground">
                {l.english}
              </span>
            </span>
            {selected && (
              <Check
                className="size-3.5 shrink-0 text-[var(--cy)]"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          if (!open) measure(); /* the hand is measured as the list is asked for */
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        /* the visible word stands inside the name — voice-control
           speakers may say what they see ("Deutsch") and be heard */
        aria-label={`${current.native} — ${t("Choose the language of everything")}`}
        title={t("Choose the language of everything")}
        data-testid={testId}
        className={
          onImage
            ? "focus-glow flex h-8 items-center gap-1.5 rounded-full border border-white/30 bg-black/25 px-2.5 text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:text-white"
            : "focus-glow flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[var(--scope-a,var(--gd))] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
        }
        style={
          onImage
            ? undefined
            : {
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
                backgroundColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, var(--background))",
              }
        }
      >
        <Languages className="size-3" aria-hidden="true" />
        {!compact && (
          <span className="max-w-[9ch] truncate text-[12px] font-medium leading-none">
            {current.native}
          </span>
        )}
        <ChevronDown
          className={`size-2.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* the list travels on the body itself — above every frame, the
          chat included; a second touch on the hand lays it down */}
      {mounted && open && createPortal(menu, document.body)}
    </div>
  );
}

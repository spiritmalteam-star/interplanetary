"use client";

/* ====================================================================
   THE FLOOR'S OWN COMPOSER — an island of calm inside the great room.

   THE STUTTER'S END — this composer keeps its OWN draft, its own cargo
   and its own fusion lenses, so every keystroke re-renders one input
   and nothing else: not the standing thread, not the growing answer,
   not the whole canopy. Before this island stood, the whisper line's
   words lived in the canopy itself and every letter pressed re-painted
   the entire room — in HyperX's deep field that was a freeze. The
   island's law: the words typed here cost only this island.
   ==================================================================== */

import {
  memo,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  FlaskConical,
  History,
  Phone,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import {
  HyperXFusionBar,
  HyperXFusionPicker,
  FUSION_MAX,
} from "./HyperXFusion";
import { ChatInputExtras, AttachmentChips } from "./ChatInputExtras";
import { filterStyles, isStyleSlashQuery } from "@/lib/image-styles";
import { SCOPE_META } from "@/lib/mirror/workspaces";
import type { LandingScopeKey } from "@/lib/mirror-store";
import type { LiveScopeKey } from "@/lib/live-scopes";
import { type ChatAttachment } from "./attachments";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface FloorAskFormProps {
  testIdPrefix: string;
  landingScope: LandingScopeKey;
  realm: boolean;
  disabled: boolean;
  floorBusy: boolean;
  /** the quiet stop — true only while a HyperX crossing streams */
  showStop: boolean;
  guest: boolean;
  placeholder: string;
  /** when this key changes (a new chat, a new category) the draft
      and the cargo lay themselves down */
  resetKey: string;
  floorLiveScope: LiveScopeKey;
  /** the floor's own word above the line (the empty room's motto) */
  introNote?: ReactNode;
  onSend: (
    text: string,
    attachments: ChatAttachment[],
    fusion?: string[]
  ) => void;
  onStop: () => void;
  onCall: () => void;
  /** the visit's own kept conversations (the parent renders the panel) */
  historyPanel: (opts?: { bare?: boolean }) => ReactNode;
}

export const FloorAskForm = memo(function FloorAskForm({
  testIdPrefix,
  landingScope,
  realm,
  disabled,
  floorBusy,
  showStop,
  guest,
  placeholder,
  resetKey,
  floorLiveScope,
  introNote,
  onSend,
  onStop,
  onCall,
  historyPanel,
}: FloorAskFormProps) {
  const t = useT();
  /* THE FLOOR'S OWN DRAFT — the island's own words */
  const [draft, setDraft] = useState("");
  const [atts, setAtts] = useState<ChatAttachment[]>([]);
  /* THE FUSION'S OWN HANDS — HyperX's crossing gear, kept on the
     island: arming a lens costs one island repaint, never the room */
  const [fusionOpen, setFusionOpen] = useState(false);
  const [fusionCats, setFusionCats] = useState<string[]>([]);
  /* the history panel's breath stays on the island too */
  const [historyOpen, setHistoryOpen] = useState(false);
  /* THE ISLAND'S OWN RESET — when the walk changes its ground (a new
     chat, another category) the words and cargo are laid down once */
  const [seenReset, setSeenReset] = useState(resetKey);
  if (resetKey !== seenReset) {
    setSeenReset(resetKey);
    if (draft !== "") setDraft("");
    if (atts.length > 0) setAtts([]);
    if (fusionCats.length > 0) setFusionCats([]);
    if (fusionOpen) setFusionOpen(false);
    if (historyOpen) setHistoryOpen(false);
  }

  /* THE FLOOR'S OWN SEED — a door from the threshold may hand the floor
     its first words: the seed is taken ONCE (the render-time take —
     the room's own adjustment law), the draft wears it, and the
     store's own sweep below lays the spent seed down. */
  const floorSeed = useMirror((s) => s.floorSeed);
  const [takenSeed, setTakenSeed] = useState<string | null>(null);
  if (floorSeed && floorSeed !== takenSeed) {
    setTakenSeed(floorSeed);
    setDraft(floorSeed);
  }
  useEffect(() => {
    if (floorSeed && floorSeed === takenSeed) {
      useMirror.getState().takeFloorSeed();
    }
  }, [floorSeed, takenSeed]);

  /* THE BRIDGE'S OWN CARRY — a workspace's advisor may hand its advice
     to the floor: the newest carried draft wears the whisper line and
     the stamp is spent at once (the same law as the seed: taken once,
     the draft wears it, the carry is spent). The Mirror advises; the
     visitor's own hand sends it. */
  const bridgeCarry = useMirror((s) => s.bridgeDraft);
  const [carriedAt, setCarriedAt] = useState(0);
  if (bridgeCarry && bridgeCarry.at !== carriedAt) {
    setCarriedAt(bridgeCarry.at);
    setDraft(bridgeCarry.text);
  }
  useEffect(() => {
    if (carriedAt) useMirror.getState().consumeBridgeDraft();
  }, [carriedAt]);

  /* THE VISITOR'S OWN STYLE — the image look chosen through the "/"
     hand; every crystallization on this floor wears it. */
  const visualStyle = useMirror((s) => s.visualStyle);
  const setVisualStyle = useMirror((s) => s.setVisualStyle);
  const styleMenuOpen = isStyleSlashQuery(draft);

  const toggleFusionLens = (id: string) => {
    setFusionCats((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= FUSION_MAX) return prev;
      return [...prev, id];
    });
  };

  const fusionArmed = fusionCats.length >= 2;

  const send = () => {
    const q = draft.trim();
    if (!q || disabled || floorBusy) return;
    /* the "/" alone is the style hand, never a whisper */
    if (isStyleSlashQuery(q)) {
      setDraft("");
      return;
    }
    const carried = atts.filter((a) =>
      a.kind === "image" ? !!a.dataUrl : !a.reading && !!a.text
    );
    setDraft("");
    setAtts([]);
    /* THE FUSION'S OWN SEND — the armed lenses ride only when the
       crossing is legal (two or more) */
    onSend(q, carried, landingScope === "hyperx" && fusionArmed ? fusionCats : undefined);
    setFusionOpen(false);
  };

  return (
    <div
      data-testid={`${testIdPrefix}-askbar`}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {introNote}
      {atts.length > 0 && (
        <div className="pointer-events-auto w-full max-w-[560px]">
          <AttachmentChips
            attachments={atts}
            onRemove={(id) => setAtts((p) => p.filter((a) => a.id !== id))}
            testId={`${testIdPrefix}-ask-attachments`}
          />
        </div>
      )}
      {/* THE VISITOR'S OWN STYLE — the chosen look, worn until taken
          off; every painting this floor crystallizes wears it */}
      {visualStyle && (
        <span
          className="mono-label pointer-events-auto flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]"
          style={{
            color: "var(--scope-a,var(--gd))",
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
          }}
          data-testid={`${testIdPrefix}-ask-style-chip`}
        >
          <Sparkles className="size-3" aria-hidden="true" />
          {visualStyle}
          <button
            type="button"
            onClick={() => setVisualStyle(null)}
            aria-label={t("Remove the style")}
            className="focus-glow ml-0.5 flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      )}
      {/* THE "/" PICKER — the styles standing over the whisper line */}
      {styleMenuOpen && (
        <div
          className="pointer-events-auto nice-scroll max-h-44 w-full max-w-[340px] overflow-y-auto rounded-xl border hairline bg-background p-1 shadow-lg"
          data-testid={`${testIdPrefix}-ask-style-menu`}
          role="listbox"
          aria-label={t("Choose a style for the image")}
        >
          {filterStyles(draft).map((s) => (
            <button
              key={s.value}
              type="button"
              role="option"
              aria-selected={visualStyle === s.value}
              onClick={() => {
                setVisualStyle(s.value);
                setDraft("");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-200 hover:bg-foreground/5"
            >
              <Sparkles
                className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-medium text-foreground">
                  {s.value}
                </span>
                <span className="block truncate text-[10.5px] text-muted-foreground/70">
                  {t(s.hint)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {/* THE HYPERX FUSION — the armed lenses' bar and the nine lenses'
          picker, standing over the whisper line. The bar shows WHICH
          fusion is being used (and pulses while the revelation
          crosses); the picker arms and disarms the lenses. The default
          HyperX stands untouched when no lens is armed. */}
      {landingScope === "hyperx" && (
        <HyperXFusionBar
          selected={fusionCats}
          busy={floorBusy}
          onClear={() => {
            setFusionCats([]);
            setFusionOpen(false);
          }}
          onOpen={() => setFusionOpen((o) => !o)}
          testId={testIdPrefix}
        />
      )}
      {landingScope === "hyperx" && fusionOpen && (
        <HyperXFusionPicker
          selected={fusionCats}
          onToggle={toggleFusionLens}
          onClose={() => setFusionOpen(false)}
          testId={testIdPrefix}
        />
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className={cn(
          "pointer-events-auto flex w-full max-w-[560px] items-center gap-2 rounded-full border py-1.5 pl-2.5 pr-1.5 transition-colors duration-300",
          /* THE CRYSTAL FOCUS — the line's own focus tint follows the
             blue crystal. */
          "focus-within:border-[rgba(148,190,224,0.5)]",
          /* THE COOL FLOOR — in both its dockings (the threshold and
             the realm) the line wears an opaque coat and no backdrop
             blur: a live blur over a scrolling page is heat the phone
             must not pay for a lens. */
          "bg-background floor-glow"
        )}
      >
        {/* THE INPUT'S OWN CALM — the reload and the star have left the
            whisper line: the cargo, the call, the words, the send. */}
        {/* THE FLOOR'S OWN HISTORY — docked in the threshold the quiet
            floor keeps the device's own hand within reach even with no
            room standing: one touch opens this visit's kept
            conversations (this device alone — nothing travels to a
            server). */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => (historyOpen ? setHistoryOpen(false) : setHistoryOpen(true))}
            aria-expanded={historyOpen}
            aria-label={t("Conversation history")}
            title={t("Conversation history — kept only on this device, for this visit")}
            data-testid={`${testIdPrefix}-ask-history`}
            className="focus-glow pm-tap flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <History className="size-3.5" aria-hidden="true" />
          </button>
          {historyOpen && (
            <>
              <div
                aria-hidden="true"
                className="fixed inset-0 z-30"
                onClick={() => setHistoryOpen(false)}
              />
              <div
                data-testid={`${testIdPrefix}-ask-history-panel`}
                className="absolute bottom-11 left-0 z-40"
              >
                {/* the one shared panel — the visit's whispers, the
                    maker's trail, the keeper's kept rooms */}
                {historyPanel({ bare: true })}
              </div>
            </>
          )}
        </div>
        {/* THE FLOOR'S OWN PAPERCLIP AND CAMERA — one image and up to
            three documents ride with the whisper. THE LANDING'S QUIET
            LINE — docked in the threshold the chat keeps its calm
            shape: no attachments, no cargo — only the voice, the words
            and the send. The full portal carries the advanced hands. */}
        <ChatInputExtras
          scope={floorLiveScope}
          size="2xs"
          withCall={false}
          withAttachments={false}
          disabled={disabled || floorBusy}
          accentVar="var(--scope-a,var(--gd))"
          attachments={atts}
          onAttachmentsChange={setAtts}
        />
        {/* THE CATEGORY'S OWN CALL — the focused category's direct
            line, one touch from the floor. THE LANDING'S OWN VOICE —
            docked in the threshold the call is always the no-scope
            reflection itself (communion), never a category's voice. */}
        <button
          type="button"
          onClick={onCall}
          disabled={disabled}
          aria-label={t("Open the direct mirror connection")}
          title={t("Open the direct mirror connection")}
          data-testid={`${testIdPrefix}-ask-call`}
          className="focus-glow pm-tap flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Phone className="size-3.5" aria-hidden="true" />
        </button>
        {/* THE HYPERX FUSION HAND — the discovery field's own crossing
            button: one touch opens the nine lenses over the whisper
            line; the armed bar above shows which fusion rides. Only
            HyperX carries it. */}
        {landingScope === "hyperx" && (
          <button
            type="button"
            onClick={() => setFusionOpen((o) => !o)}
            aria-expanded={fusionOpen}
            aria-pressed={fusionArmed}
            aria-label={t("The nine lenses of fusion")}
            title={t("The nine lenses of fusion")}
            data-testid={`${testIdPrefix}-ask-fusion`}
            className={cn(
              "focus-glow pm-tap relative flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
              fusionArmed
                ? "text-[var(--hyperx-fusion,#e879f9)]"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={
              fusionArmed
                ? {
                    background:
                      "color-mix(in srgb, var(--hyperx-fusion,#e879f9) 12%, transparent)",
                    boxShadow:
                      "inset 0 0 0 1px color-mix(in srgb, var(--hyperx-fusion,#e879f9) 45%, transparent)",
                  }
                : undefined
            }
          >
            <FlaskConical className="size-3.5" aria-hidden="true" />
            {fusionArmed && (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 size-1.5 rounded-full"
                style={{
                  backgroundColor: "var(--hyperx-fusion,#e879f9)",
                  boxShadow:
                    "0 0 6px 0 color-mix(in srgb, var(--hyperx-fusion,#e879f9) 80%, transparent)",
                }}
              />
            )}
          </button>
        )}
        <label htmlFor={`${testIdPrefix}-ask`} className="sr-only">
          {placeholder}
        </label>
        <input
          id={`${testIdPrefix}-ask`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          data-testid={`${testIdPrefix}-ask-input`}
          className="min-w-0 flex-1 bg-transparent py-1 text-[14.5px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        {/* THE ASK'S OWN STOP — while the crossing streams, the ask hand
            offers the quiet stop: one touch lays the stream down, the
            words that arrived are kept. No animation, no glow — a
            hand, nothing more. */}
        {realm && showStop && (
          <button
            type="button"
            onClick={onStop}
            aria-label={t("Stop")}
            title={t("Stop")}
            data-testid={`${testIdPrefix}-ask-stop`}
            className="focus-glow pm-tap flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <Square className="size-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || floorBusy || !draft.trim()}
          aria-label={t("Send")}
          data-testid={`${testIdPrefix}-ask-send`}
          /* THE CRYSTAL SEND — the house's scope-aware crystal CTA: the
             room's own light leads the gradient, the theme's own law
             inks it, one quiet glow at rest, one light sweep per
             hover, a spring press. */
          className={cn(
            "btn-primary focus-glow pm-tap flex size-8 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed",
            /* THE BEACON — while the crossing streams the send hand
               becomes the spinning blade (pm-beacon) wearing the
               breathing aura (pm-channeling); the resting dim is laid
               down so the light is never dulled. */
            floorBusy ? "pm-channeling" : "disabled:opacity-35"
          )}
        >
          {floorBusy ? (
            <span className="pm-beacon" aria-hidden="true" />
          ) : (
            <Send className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </form>
      {/* THE TEMPORARY CHAT'S OWN LINE — the landing's floor is free
          and holds nothing: a quiet honest word for the non logged-in,
          the way in named for the ones who stay. */}
      {guest && (
        <p
          data-testid="floor-temporary-note"
          className="mono-label text-[9px] uppercase tracking-[0.26em] text-muted-foreground/55"
          style={{ pointerEvents: "none" }}
        >
          {t("Temporary chat — sign in to keep your reflections")}
        </p>
      )}
    </div>
  );
});

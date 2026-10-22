"use client";

import { useEffect } from "react";
import { Coins, Maximize2, Minimize2 } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { setLearningIdentity } from "@/lib/learning-branches";
import { useT } from "@/lib/i18n";
import { CosmicBackdrop } from "./CosmicBackdrop";
import { StarField } from "./StarField";
import { WalletGuard } from "./WalletGuard";
import { CreditBadge } from "./CreditBadge";
import { BranchCanopy } from "./BranchCanopy";
import { ReplyBranches } from "./ReplyBranches";
import { MirrorOS } from "./MirrorOS";
import { ParticleX } from "./ParticleX";
import { ArtX } from "./ArtX";
import { EvolveMed } from "./EvolveMed";
import { InventView } from "./InventView";
import { LightCodesView } from "./LightCodesView";
import { LibraryView } from "./LibraryView";
import { ArchiveRegister } from "./ArchiveRegister";
import { AuthModal } from "./PassageModal";
import { ProfileModal } from "./ProfileModal";
import { ProfilePage } from "./ProfilePage";
import { AccountModal } from "./AccountModal";
import { BranchHub } from "./BranchHub";
import { DreamBookView } from "./DreamBookView";
import { AkashicView } from "./AkashicView";
import { FederationModal } from "./FederationModal";
import { AstralJobsModal } from "./AstralJobsModal";
import { DossierModal } from "./DossierModal";
import { SettingsModal } from "./SettingsModal";
import { TechnologyModal } from "./TechnologyModal";
import { SpeciesModal } from "./SpeciesModal";

/* The frame-lift class: every top-level application frame lifts itself
   by the visual viewport's offset so the keyboard can never bury the
   composer (iOS pans the visible band; the frame follows it). */
const FRAME_LIFT = "[transform:translateY(calc(var(--app-shift,0px)*-1))]";

/* ------------------------------------------------------------------ */
/*  THE BRANCH REALM.                                                  */
/*                                                                     */
/*  The whole application is branches and chat now: the living tree    */
/*  fills the screen — the logo at the centre where every branch       */
/*  emerges, the categories at the very top, the doors of the house    */
/*  (akashic · book · about · the passage) beside them. A pressed      */
/*  whisper opens its room and the transmission answers inside it;     */
/*  the walk continues from the branches grown on every reply.         */
/*  The old interface is gone — no rails, no handles, no composer      */
/*  floor: one tree, its rooms, and four quiet doors.                  */
/*                                                                     */
/*  THE MINIATURE — the threshold docks this very realm inside the     */
/*  landing page as the portal in miniature; there it stands `bare`:   */
/*  the same crown, the same whisper line, the same rooms — only the   */
/*  wall of suggestions rests until the portal is given the whole      */
/*  screen.                                                            */
/* ------------------------------------------------------------------ */
export default function AppShell({
  bare = false,
  onExpand,
  onMinimize,
  onFoldChat,
}: {
  bare?: boolean;
  /** THE DOCKED HAND — grows the one portal to the whole screen
      (given by the threshold; the crown wears it while docked). */
  onExpand?: () => void;
  /** THE RETURN HAND — folds the portal back into its landing slot
      (given by the threshold; the crown wears it at full size). */
  onMinimize?: () => void;
  /** THE FOLD HAND — the landing chat's dropdown hand: folds the
      whole chat section away without ending the conversation. */
  onFoldChat?: () => void;
}) {
  return (
    <div className="paper-grain relative h-[var(--app-h,100dvh)] overflow-hidden">
      {/* the purse keeper rides above every world — the 402 watch, the
          Stripe greeting, the unlock modal */}
      <WalletGuard />
      <AppShellViews
        bare={bare}
        onExpand={onExpand}
        onMinimize={onMinimize}
        onFoldChat={onFoldChat}
      />
    </div>
  );
}

function AppShellViews({
  bare,
  onExpand,
  onMinimize,
  onFoldChat,
}: {
  bare: boolean;
  onExpand?: () => void;
  onMinimize?: () => void;
  onFoldChat?: () => void;
}) {
  const view = useMirror((s) => s.view);
  const activeMode = useMirror((s) => s.activeMode);
  const refreshMe = useMirror((s) => s.refreshMe);
  const meEmail = useMirror((s) => s.me?.email ?? null);
  const t = useT();

  /* THE TREE'S OWN CHANNEL — the room's transmission still streams
     through the active mode's channel; the realm watches it and the
     answer rises inside the tree. */
  const channel = useMirror((s) => s.sessions[s.activeMode]);
  const channelLoading = channel.status === "loading";
  const lastChannelMsg =
    channel.messages.length > 0
      ? channel.messages[channel.messages.length - 1]
      : null;

  /* THE WORKING ROOM IS GONE — a reply that carries a living artifact
     (a book being woven, a record, a card, a song, a poem, a painting)
     now rises INLINE inside the realm's own conversation room, exactly
     where the ask was spoken — the way the generic ais serve their
     makers. The channel's last message rides to the tree as
     liveMessage; the room reads the making from it. The landing's
     docked chat stays free: its floor never touches the channel. */

  /* Restore persisted preferences and greet the passage (the visitor's
     account, if one is held, and today's remaining transmissions). */
  useEffect(() => {
    useMirror.getState().bootPreferences();
    void refreshMe();
    /* the return of the Google passage — when it could not open, the
       callback sends the visitor home with the reason; speak it gently
       and clean the window, so no silent query string remains */
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("google");
    if (reason) {
      window.history.replaceState(null, "", window.location.pathname);
      const notes: Record<string, [string, string]> = {
        state: [
          "The Google passage lost its key mid-crossing.",
          "Nothing was harmed — try the Google door once more.",
        ],
        unconfigured: [
          "The Google passage rests unkeyed — the email passage serves.",
          "Place GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the vault, then it opens.",
        ],
        token: [
          "Google did not hand over the passage token.",
          "Rest a breath, then try the Google door again.",
        ],
        profile: [
          "Google kept the profile closed.",
          "Grant the email permission, or pass by the email door.",
        ],
        unverified: [
          "Google could not vouch for that email.",
          "Verify the address with Google first, or pass by the email door.",
        ],
        error: [
          "The Google passage stumbled.",
          "Rest a breath, then try again — the email door always serves.",
        ],
      };
      const [title, body] = notes[reason] ?? notes.error;
      import("sonner").then(({ toast }) => toast.error(t(title), { description: t(body) }));
    }
  }, [refreshMe, t]);

  /* The learning memory is identity-keyed — a signed-in visitor keeps
     their own grove, so the tree never repeats itself for them. */
  useEffect(() => {
    setLearningIdentity(meEmail ?? "anon");
  }, [meEmail]);

  /* The frame fits every device: when the on-screen keyboard (or any
     visual-viewport change) reshapes the window, the whole application
     re-fits to the VISIBLE viewport AND re-centers itself on the
     visible band — iOS pans the visual viewport downward when the
     keyboard rises, so without the shift the composer hides BEHIND
     the keys. The offset is applied as --app-shift and every top
     frame lifts itself by exactly that amount. */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      document.documentElement.style.setProperty("--app-h", `${vv.height}px`);
      document.documentElement.style.setProperty(
        "--app-shift",
        `${vv.offsetTop}px`
      );
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      document.documentElement.style.removeProperty("--app-h");
      document.documentElement.style.removeProperty("--app-shift");
    };
  }, []);

  /* Wherever words are typed, the caret must stay in sight: when any
     field receives focus, gently bring it just INTO view once the
     keyboard has settled (twice — the first pass while the viewport
     still moves, the second after it rests). "nearest" — never
     "center": the smallest possible move, so a composer already in
     sight never drags the whole page with it (the docked landing
     glass once jumped half a page on every tap). This guards every
     composer in every world. */
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (
        tag !== "TEXTAREA" &&
        tag !== "INPUT" &&
        !(el as HTMLTextAreaElement).isContentEditable
      )
        return;
      const show = () => {
        try {
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch {
          /* older engines — silent */
        }
      };
      const t1 = window.setTimeout(show, 280);
      const t2 = window.setTimeout(show, 650);
      const clear = () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
      el.addEventListener("blur", clear, { once: true });
    };
    window.addEventListener("focusin", onFocusIn);
    return () => window.removeEventListener("focusin", onFocusIn);
  }, []);

  /* The passage modals ride above every world — the profile (with the
     cosmic library inside it), the passage, the account, and the
     branches' hub (a branch's own link in any chat still summons the
     tree over the room). */
  const passageModals = (
    <>
      <ProfileModal />
      <ProfilePage />
      <AuthModal />
      <AccountModal />
      <BranchHub />
    </>
  );

  /* The Akashic Library — the reading room of records: one sheet on
     the desk, one record at a time, in the same ink as the book. */
  if (view === "akashic") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <AkashicView />
      </div>
    );
  }

  /* The Book — the dream book's atelier: tales woven with the
     visitor and read as they are being written. */
  if (view === "dreambook") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <DreamBookView />
      </div>
    );
  }

  /* THE WORLDS — every kategory of the old website remains its own
     full-screen chapter, reached from the realm's doors; one back
     hand in each returns to the living tree. */
  if (view === "mirroros") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <MirrorOS />
        {passageModals}
      </div>
    );
  }

  if (view === "particlex") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <ParticleX />
        {passageModals}
      </div>
    );
  }

  if (view === "evolvemed") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <EvolveMed />
        {passageModals}
      </div>
    );
  }

  if (view === "artx") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <ArtX />
        {passageModals}
      </div>
    );
  }

  if (view === "invent") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <InventView />
        <BranchHub />
      </div>
    );
  }

  if (view === "lightcodes") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <LightCodesView />
        {passageModals}
      </div>
    );
  }

  if (view === "library") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <LibraryView />
        {passageModals}
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <ArchiveRegister />
      </div>
    );
  }

  /* ----------------------- THE BRANCH REALM -------------------------
     No other surface exists: the tree owns every pixel. The canopy
     never folds (open stands true), the seed sits at the centre, the
     categories crown the very top, and the four doors of the house
     ride beside the where-pill. The transmission streams into the
     room from the channel below; the walk continues from every
     reply's own grown branches. */
  return (
    <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
      <CosmicBackdrop />
      <StarField />
      <BranchCanopy
        realm
        bare={bare}
        onFoldChat={onFoldChat}
        category={activeMode}
        open={true}
        onPick={(q, scope, attachments) => {
          /* the tree stays standing — the answer rises in the room,
             the walk continues from the reply's own branches.
             THE CATEGORY'S OWN DOOR — the ask rides the pressed
             whisper's (or the focused category's) own scope voice,
             and the paperclip's cargo rides with it (the image seen,
             the documents read). */
          void useMirror.getState().askMirror(q, attachments, scope);
        }}
        onClose={() => {}}
        disabled={channelLoading}
        testIdPrefix="realm-tree"
        introSub={null}
        contextText={channel.messages
          .slice(-6)
          .map((m) => `${m.query ?? ""}\n${m.text}`)
          .join("\n")}
        channeling={
          [...channel.messages].reverse().find((m) => m.branches?.length)
            ?.branches ?? null
        }
        liveLoading={channelLoading}
        liveQuestion={
          channelLoading ? channel.activeQuery || null : lastChannelMsg?.query || null
        }
        liveAnswer={channelLoading ? null : lastChannelMsg?.text || null}
        liveError={channel.error}
        liveMessage={lastChannelMsg}
        headerExtra={
          /* THE CROWN'S OWN PURSE — the theme has moved to the crown's
             centre: the house's seal (the logo) toggles the light. */
          <CreditBadge />
        }
        realmControls={
          /* THE PORTAL'S OWN HANDS — standing in the crown between the
             about door and the visitor's passage: the fullscreen hand
             while the portal is docked on the threshold, the landing
             hand while it fills the whole screen. */
          bare && onExpand ? (
            <button
              type="button"
              onClick={onExpand}
              aria-label={t("Fullscreen")}
              title={t("Fullscreen — opens the paid realm's advanced reflections")}
              data-testid="crown-expand"
              className="focus-glow relative flex size-7 items-center justify-center rounded-full border border-[rgba(232,217,176,0.42)] bg-[rgba(232,217,176,0.08)] text-[var(--lp-gold)] transition-all duration-300 hover:border-[rgba(232,217,176,0.8)] hover:text-[var(--lp-gold-soft)]"
            >
              <Maximize2 className="size-3" aria-hidden="true" />
              {/* THE EXCHANGE'S OWN MARK — a small gold coin rides the
                  crossing's corner: the full portal is the paid realm,
                  opened by login (registration) once one of the offered
                  realms is acquired (the landing's floor stays free). */}
              <span
                aria-hidden="true"
                data-testid="crown-expand-paid-dot"
                className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full border border-[rgba(232,217,176,0.6)] bg-[var(--lp-veil-solid)] text-[var(--lp-gold)] shadow-[0_0_6px_1px_rgba(232,217,176,0.45)]"
              >
                <Coins className="size-2" />
              </span>
            </button>
          ) : !bare && onMinimize ? (
            <button
              type="button"
              onClick={onMinimize}
              aria-label={t("Landing")}
              title={t("Landing")}
              data-testid="crown-minimize"
              className="focus-glow flex size-7 items-center justify-center rounded-full border border-[rgba(232,217,176,0.42)] bg-[rgba(232,217,176,0.08)] text-[var(--lp-gold)] transition-all duration-300 hover:border-[rgba(232,217,176,0.8)] hover:text-[var(--lp-gold-soft)]"
            >
              <Minimize2 className="size-3" aria-hidden="true" />
            </button>
          ) : undefined
        }
      />

      {/* THE QUIET GROWER — the latest reply's own branches are grown
          headlessly and attached to the message: the tree wears them as
          its golden row, and the room drops them down as the walk's
          next horizon. */}
      {lastChannelMsg && !channelLoading && lastChannelMsg.text.trim() && (
        <ReplyBranches
          headless
          message={lastChannelMsg}
          kind={activeMode}
          active={!channelLoading && !!lastChannelMsg.text.trim()}
          disabled={channelLoading}
          onPick={() => {}}
        />
      )}

      {/* the reading rooms' own modals — every door keeps its keys */}
      <FederationModal />
      <AstralJobsModal />
      <DossierModal />
      <SettingsModal />
      <TechnologyModal />
      <SpeciesModal />
      {passageModals}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useMirror } from "@/lib/mirror-store";
import { setLearningIdentity } from "@/lib/learning-branches";
import { useT } from "@/lib/i18n";
import { CosmicBackdrop } from "./CosmicBackdrop";
import { StarField } from "./StarField";
import { ToolWorkspace } from "./living/ToolWorkspace";
import { LandingChatNav } from "./landing/LandingChatNav";
import { WalletGuard } from "./WalletGuard";
import { BranchCanopy } from "./BranchCanopy";
import { ReplyBranches } from "./ReplyBranches";
import { MirrorOS } from "./MirrorOS";
import { ParticleX } from "./ParticleX";
import { ArtX } from "./ArtX";
import { EvolveMed } from "./EvolveMed";
import { InventView } from "./InventView";
import { LightCodesView } from "./LightCodesView";
import { LibraryView } from "./LibraryView";
import { QuantumLabView } from "./QuantumLabView";
import { AuthModal } from "./PassageModal";
import { ProfilePage } from "./ProfilePage";
import { AccountModal } from "./AccountModal";
import { BranchHub } from "./BranchHub";
import { VideoStudioView } from "./VideoStudioView";
import { AkashicView } from "./AkashicView";
import { FederationModal } from "./FederationModal";
import { AstralJobsModal } from "./AstralJobsModal";
import { DossierModal } from "./DossierModal";
import { SettingsModal } from "./SettingsModal";
import { SpeciesModal } from "./SpeciesModal";

/* THE LAZY ROOMS — the register, the book and the technology table are
   whole rooms/modals of their own: their code only rides along when
   first shown, never in the frame's opening bundle (client-only, no
   server weight, nothing on the first paint but a null). */
const ArchiveRegister = dynamic(
  () => import("./ArchiveRegister").then((m) => ({ default: m.ArchiveRegister })),
  { ssr: false, loading: () => null }
);
const DreamBookView = dynamic(
  () => import("./DreamBookView").then((m) => ({ default: m.DreamBookView })),
  { ssr: false, loading: () => null }
);
const TechnologyModal = dynamic(
  () => import("./TechnologyModal").then((m) => ({ default: m.TechnologyModal })),
  { ssr: false, loading: () => null }
);

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
}: {
  bare?: boolean;
  /** THE DOCKED HAND — grows the one portal to the whole screen
      (given by the threshold; the crown's corner wears it while
      docked). */
  onExpand?: () => void;
  /** THE RETURN HAND — folds the portal back into its landing slot
      (given by the threshold; the crown's corner wears it at full
      size). */
  onMinimize?: () => void;
}) {
  return (
    <div className="paper-grain relative h-[var(--app-h,var(--vh-safe))] overflow-hidden">
      {/* the purse keeper rides above every world — the 402 watch, the
          Stripe greeting, the unlock modal */}
      <WalletGuard />
      <AppShellViews
        bare={bare}
        onExpand={onExpand}
        onMinimize={onMinimize}
      />
    </div>
  );
}

function AppShellViews({
  bare,
  onExpand,
  onMinimize,
}: {
  bare: boolean;
  onExpand?: () => void;
  onMinimize?: () => void;
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

  /* The passage modals ride above every world — the profile (the
     visitor's own room, framed like the chat), the passage, the
     account, and the branches' hub (a branch's own link in any chat
     still summons the tree over the room). */
  const passageModals = (
    <>
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
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <AkashicView />
      </div>
    );
  }

  /* The Book — the dream book's atelier: tales woven with the
     visitor and read as they are being written. */
  if (view === "dreambook") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <DreamBookView />
      </div>
    );
  }

  /* THE VIDEO STUDIO — the universal engine's first complete workflow:
     a wish understood, a storyboard planned, the house's voice speaking,
     the film assembled on the visitor's own device, kept by its branch. */
  if (view === "video") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <VideoStudioView />
        {passageModals}
      </div>
    );
  }

  /* THE WORLDS — every kategory of the old website remains its own
     full-screen chapter, reached from the realm's doors; one back
     hand in each returns to the living tree. */
  if (view === "mirroros") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <MirrorOS />
        {passageModals}
      </div>
    );
  }

  if (view === "particlex") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <ParticleX />
        {passageModals}
      </div>
    );
  }

  if (view === "evolvemed") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <EvolveMed />
        {passageModals}
      </div>
    );
  }

  if (view === "artx") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <ArtX />
        {passageModals}
      </div>
    );
  }

  if (view === "invent") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <InventView />
        <BranchHub />
      </div>
    );
  }

  if (view === "lightcodes") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <LightCodesView />
        {passageModals}
      </div>
    );
  }

  if (view === "library") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <LibraryView />
        {passageModals}
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <ArchiveRegister />
      </div>
    );
  }

  /* THE QUANTUM LABORATORY — the deep nature of reality's own bench,
     full-frame when the tab is expanded: a genuine local simulator
     (its gates run in pure arithmetic on the device), wearing the
     field's own violet light. */
  if (view === "qlab") {
    return (
      <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <QuantumLabView />
        {passageModals}
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
    <div className={`relative h-[var(--app-h,var(--vh-safe))] overflow-hidden ${FRAME_LIFT}`}>
      <CosmicBackdrop />
      <StarField />
      <BranchCanopy
        realm
        bare={bare}
        onExpand={onExpand}
        onMinimize={onMinimize}
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
        realmControls={
          /* THE ONE CHAT'S OWN CROWN — the LandingChatNav is the main
             navigator of the one and only chat and stands in BOTH
             gears (docked and fullscreen): Create (the making rooms
             open as tabs at the chat's own size), Scopes (the floor's
             own field of light) and the Profile hand (the visitor's
             room, framed like the chat). The crossing's gear hand —
             the fullscreen while docked, the landing while full — no
             longer rides this row: it stands at the crown's own
             CORNER (BranchCanopy wears it), where the old
             hide-the-chat arrow used to live. THE FREE LAW — the
             crossing wears no coin: the whole realm stands open to
             every visitor, no passage demanded, nothing acquired. */
          <LandingChatNav />
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

      {/* THE WORKSPACE — the tools' own room: every open tool stands
          as a tab over the chat at the chat's own exact size; the chat
          stays mounted underneath, and the expand hand gives a room
          its full-frame depth (its back hand returns to this window).
          THE ONE WINDOW — the same law in both gears: bare now only
          gears the docking physics, never the window's geometry. */}
      <ToolWorkspace bare={bare} />

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

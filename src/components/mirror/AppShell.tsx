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
import { CreditBadge } from "./CreditBadge";
import { WalletGuard } from "./WalletGuard";
import { BranchCanopy } from "./BranchCanopy";
import { ReplyBranches } from "./ReplyBranches";
import { AuthModal } from "./PassageModal";
import { ProfilePage } from "./ProfilePage";
import { AccountModal } from "./AccountModal";
import { BranchHub } from "./BranchHub";
import { FederationModal } from "./FederationModal";
import { AstralJobsModal } from "./AstralJobsModal";
import { DossierModal } from "./DossierModal";
import { SettingsModal } from "./SettingsModal";
import { SpeciesModal } from "./SpeciesModal";

/* THE LAZY ROOM — the technology table is a modal of its own: its
   code only rides along when first shown, never in the frame's
   opening bundle (client-only, no server weight). */
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

  /* ----------------------- THE BRANCH REALM -------------------------
     ONE SURFACE, ONE FRAME: the whole application is the one chat
     now. Every room — tool, workplace, the visitor's profile —
     plays WITHIN the chat's own frame (the window rises over the
     chat at its exact size, the way the profile always played); no
     view ever leaves for a separate page any more (the old
     full-screen early-returns are gone with the expand hand). The
     canopy never folds (open stands true), the seed sits at the
     centre, the categories crown the very top, and the crown's own
     navigator rides beside the where-pill. The transmission streams
     into the room from the channel below; the walk continues from
     every reply's own grown branches. */
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
          /* THE CROWN'S OWN PURSE — the wallet pill rides beside the
             navigator, one row with it (the profile icon and the light's
             toggle stand just before): the purse always in sight, one
             touch opening the visitor's own room where the Transactions
             book and the account chamber live. THE FREE LAW — the
             crossing wears no coin: the whole realm stands open to
             every visitor, no passage demanded, nothing acquired. */
          <div className="flex items-center gap-1.5">
            <CreditBadge />
            <LandingChatNav />
          </div>
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
          stays mounted underneath. THE ONE FRAME — there is no
          expansion beyond the frame any more: the same window is the
          room's whole world in both gears, the way the profile plays
          (bare now only gears the docking physics, never the
          window's geometry). */}
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

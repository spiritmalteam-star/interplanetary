"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SuggestionTree } from "./SuggestionTree";
import {
  CHANNELING_BRANCH,
  TREE_DRIFT_EVENT,
  type LearnedBranch,
} from "@/lib/learning-branches";
import type { BranchId } from "@/lib/data/suggestion-tree";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE BRANCHES' HUB — the living tree, summoned.                     */
/*                                                                     */
/*  No chat carries a standing suggestion surface any more: the only   */
/*  whispers of a conversation are the branches grown on each reply.   */
/*  Every branch panel keeps its quiet link — "Find them on the tree"  */
/*  — and this hub is where that link arrives: the living tree opens   */
/*  as an overlay, drifted to the branch the conversation belongs to,  */
/*  carrying the branches grown from this very thread at its crown.    */
/*                                                                     */
/*  One overlay, every thread: the drift event names the branch, the   */
/*  hub wires the branch to its own door (the OS speaks for the        */
/*  manifesting branch, the quantum narrator for quantum, the forge    */
/*  for invent…), so a picked whisper continues the thread it came     */
/*  from. Rides above every world with the passage modals.             */
/* ------------------------------------------------------------------ */

type HubBranch = BranchId | typeof CHANNELING_BRANCH;

/** The branch's own door — which thread speaks when a whisper is picked. */
function isMainBranch(b: HubBranch): b is "interplanetary" | "healing" {
  return b === "interplanetary" || b === "healing";
}

export function BranchHub() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState<HubBranch>("manifesting");

  /* the threads the hub can drift to — their last breaths are the
     context, their door the voice a picked whisper asks through */
  const osMessages = useMirror((s) => s.osMessages);
  const osStatus = useMirror((s) => s.osStatus);
  const askOS = useMirror((s) => s.askOS);
  const pxMessages = useMirror((s) => s.pxMessages);
  const pxStatus = useMirror((s) => s.pxStatus);
  const askPX = useMirror((s) => s.askPX);
  const emMessages = useMirror((s) => s.emMessages);
  const emStatus = useMirror((s) => s.emStatus);
  const askEM = useMirror((s) => s.askEM);
  const axMessages = useMirror((s) => s.axMessages);
  const axStatus = useMirror((s) => s.axStatus);
  const askArtX = useMirror((s) => s.askArtX);
  const forgeSession = useMirror((s) => s.forgeSession);
  const askForge = useMirror((s) => s.askForge);
  const sessions = useMirror((s) => s.sessions);
  const askMirror = useMirror((s) => s.askMirror);
  const activeMode = useMirror((s) => s.activeMode);

  /* THE DRIFT — one quiet event from a branch panel's link opens the
     hub on the branch the conversation belongs to. */
  useEffect(() => {
    const onDrift = (e: Event) => {
      const detail = (e as CustomEvent<{ branch?: string }>).detail;
      const b = detail?.branch;
      if (!b) return;
      setBranch(b as HubBranch);
      setOpen(true);
    };
    window.addEventListener(TREE_DRIFT_EVENT, onDrift);
    return () => window.removeEventListener(TREE_DRIFT_EVENT, onDrift);
  }, []);

  const wiring = useMemo(() => {
    const lastGrown = (msgs: { role?: string; branches?: LearnedBranch[] }[]) =>
      [...msgs]
        .reverse()
        .find((m) => m.branches?.length)?.branches;

    if (branch === "manifesting")
      return {
        context: osMessages.slice(-6).map((m) => m.text).join("\n"),
        channeling: lastGrown(
          osMessages.filter((m) => m.role === "os")
        ),
        loading: osStatus === "loading",
        ask: (q: string) => void askOS(q),
      };
    if (branch === "quantum")
      return {
        context: pxMessages.slice(-6).map((m) => m.text).join("\n"),
        channeling: lastGrown(pxMessages.filter((m) => m.role === "px")),
        loading: pxStatus === "loading",
        ask: (q: string) => void askPX(q),
      };
    if (branch === "evolvemed")
      return {
        context: emMessages.slice(-6).map((m) => m.text).join("\n"),
        channeling: lastGrown(emMessages.filter((m) => m.role === "em")),
        loading: emStatus === "loading",
        ask: (q: string) => void askEM(q),
      };
    if (branch === "artx")
      return {
        context: axMessages.slice(-6).map((m) => m.text).join("\n"),
        channeling: lastGrown(axMessages.filter((m) => m.role === "ax")),
        loading: axStatus === "loading",
        ask: (q: string) => void askArtX(q),
      };
    if (branch === "invent") {
      const msgs = forgeSession.messages;
      return {
        context: msgs.slice(-6).map((m) => `${m.query}\n${m.text}`).join("\n"),
        channeling: lastGrown(msgs),
        loading: forgeSession.status === "loading",
        ask: (q: string) => void askForge(q),
      };
    }
    /* interplanetary · healing · the channeling branch itself — the
       main channels (the channeling crown hangs over the active one) */
    const mode = isMainBranch(branch) ? branch : activeMode;
    const session = sessions[mode];
    return {
      context: session.messages
        .slice(-6)
        .map((m) => `${m.query}\n${m.text}`)
        .join("\n"),
      channeling: lastGrown(session.messages),
      loading: session.status === "loading",
      ask: (q: string) => void askMirror(q),
    };
  }, [
    branch,
    osMessages,
    osStatus,
    askOS,
    pxMessages,
    pxStatus,
    askPX,
    emMessages,
    emStatus,
    askEM,
    axMessages,
    axStatus,
    askArtX,
    forgeSession,
    askForge,
    sessions,
    askMirror,
    activeMode,
  ]);

  const treeBranch: BranchId =
    branch === CHANNELING_BRANCH ? activeMode : branch;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[88dvh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[820px]"
        data-testid="branch-hub"
      >
        <DialogHeader>
          <DialogTitle className="scope-gradient-text text-[16px] font-semibold">
            {t("The living tree")}
          </DialogTitle>
          <DialogDescription>
            {t("The branches of this conversation, linked with their branch of the tree.")}
          </DialogDescription>
        </DialogHeader>
        <SuggestionTree
          focusBranch={treeBranch}
          /* THE CATEGORIZATION LAW — the hub opens on the branch the
             conversation belongs to, that branch alone. */
          lockedBranch={treeBranch}
          contextText={wiring.context}
          onPick={(q) => {
            if (wiring.loading) return;
            wiring.ask(q);
            setOpen(false);
          }}
          disabled={wiring.loading}
          testIdPrefix="hub-tree"
          channeling={wiring.channeling}
          transmitting={wiring.loading}
        />
      </DialogContent>
    </Dialog>
  );
}

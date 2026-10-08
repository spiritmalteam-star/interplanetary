"use client";

import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import type { ChatSurface } from "@/lib/chat-archive";

type WorldChat = "manifest" | "quantum" | "evolvemed" | "artx" | "invent";

/** world → its own chat surface on the shelf */
const WORLD_SURFACE: Record<WorldChat, ChatSurface> = {
  manifest: "os",
  quantum: "px",
  evolvemed: "em",
  artx: "ax",
  invent: "forge",
};

/** The fresh-chat hand of a world: one press and the ChatGPT turn is
    made — the present conversation already rests on the shelf (the
    autosave kept it current) and a fresh page opens in its place. The
    old one can always be reopened from the conversation panel. It
    lives at the top-right of each world's header. */
export function WorldNewChat({ world }: { world: WorldChat }) {
  const t = useT();

  return (
    <button
      type="button"
      data-testid={`new-chat-${world}`}
      aria-label={t("New chat")}
      title={t("New chat")}
      onClick={() => {
        useMirror.getState().newChat(WORLD_SURFACE[world]);
        toast({
          title: t("New chat"),
          description: t(
            "The old conversation rests on your shelf — reopen it anytime."
          ),
        });
      }}
      className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
    >
      <Plus className="size-4" aria-hidden="true" />
    </button>
  );
}

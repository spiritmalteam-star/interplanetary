"use client";

import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";

type WorldChat = "manifest" | "quantum" | "evolvemed" | "invent";

/** The fresh-chat hand of a world: one press and that world's own
    conversation returns to its quiet origin — the manifest core (with
    its blueprint bench), the quantum core, the med nexus or the forge.
    It lives at the top-right of each world's header. */
export function WorldNewChat({ world }: { world: WorldChat }) {
  const t = useT();
  const clearWorldChat = useMirror((s) => s.clearWorldChat);
  const clearChannel = useMirror((s) => s.clearChannel);

  return (
    <button
      type="button"
      data-testid={`new-chat-${world}`}
      aria-label={t("New chat")}
      title={t("New chat")}
      onClick={() => {
        if (world === "invent") clearChannel("forge");
        else clearWorldChat(world);
        toast({
          title: t("New chat"),
          description: t("The channel returns to its quiet origin."),
        });
      }}
      className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
    >
      <Plus className="size-4" aria-hidden="true" />
    </button>
  );
}

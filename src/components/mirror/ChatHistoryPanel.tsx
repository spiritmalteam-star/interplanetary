"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  ARCHIVE_EVENT,
  getActiveChatId,
  listChats,
  type ChatSurface,
} from "@/lib/chat-archive";

/**
 * ChatHistoryPanel — the conversation shelf, opened as a slide-over.
 * ChatGPT's own courtesy, held to the house's zero-database law: every
 * past conversation rests in the browser alone, and any of them can be
 * reopened — or laid down for good — from this one quiet panel.
 */
export function ChatHistoryPanel({
  surface,
  open,
  onClose,
}: {
  surface: ChatSurface;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  /* Two hands may touch the shelf while the panel stands open: the
     store's archiveTick and the archive's own window event. Either one
     re-reads the shelf below. */
  const archiveTick = useMirror((s) => s.archiveTick);
  const [eventTick, setEventTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    const bump = () => setEventTick((n) => n + 1);
    window.addEventListener(ARCHIVE_EVENT, bump);
    return () => window.removeEventListener(ARCHIVE_EVENT, bump);
  }, [open]);

  /* Escape lays the panel down, as a touch on the backdrop does */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Read straight from the shelf during render — the panel only opens
     client-side after mount, so the reads are cheap and SSR-safe. */
  const chats = open
    ? [...listChats(surface)].sort(
        (a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt)
      )
    : [];
  const activeId = open ? getActiveChatId(surface) : "";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="shelf-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <motion.aside
            key="shelf-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("Your conversations")}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[71] flex w-[320px] max-w-[85vw] flex-col border-l hairline bg-background shadow-[-24px_0_80px_-32px_rgba(0,0,0,0.6)]"
          >
            {/* header — the shelf's name and the fresh hand */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b hairline px-4 py-3">
              <p className="text-[15px] font-semibold tracking-[0.01em] text-foreground">
                {t("Your conversations")}
              </p>
              <button
                type="button"
                aria-label={t("New chat")}
                title={t("New chat")}
                onClick={() => {
                  useMirror.getState().newChat(surface);
                  onClose();
                }}
                className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>

            {/* the shelf itself */}
            <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {chats.length === 0 ? (
                <p className="px-3 py-8 text-center text-[13.5px] italic leading-relaxed text-muted-foreground">
                  {t("Nothing rests on the shelf yet.")}
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {chats.map((chat) => {
                    const active = chat.id === activeId;
                    return (
                      <li key={chat.id} className="group relative flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            useMirror.getState().openChat(surface, chat.id);
                            onClose();
                          }}
                          style={
                            active
                              ? {
                                  backgroundColor:
                                    "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                                }
                              : undefined
                          }
                          className="focus-glow min-w-0 flex-1 rounded-lg px-3 py-2 pr-9 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--scope-a)_8%,transparent)]"
                        >
                          <span className="block truncate text-[13.5px] leading-snug text-foreground/90">
                            {chat.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
                            {new Intl.DateTimeFormat(undefined, {
                              month: "short",
                              day: "numeric",
                            }).format(new Date(chat.savedAt))}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={t("Remove")}
                          title={t("Remove")}
                          onClick={(e) => {
                            e.stopPropagation();
                            useMirror.getState().deleteChat(surface, chat.id);
                          }}
                          className="focus-glow absolute right-1.5 flex size-7 items-center justify-center rounded-full text-muted-foreground/60 opacity-0 transition-all duration-200 hover:text-foreground group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* the zero-database law, spoken quietly */}
            <p className="shrink-0 border-t hairline px-4 py-3 text-[11px] leading-relaxed text-muted-foreground/70">
              {t(
                "Kept only on this device — the Mirror holds nothing on any server."
              )}
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

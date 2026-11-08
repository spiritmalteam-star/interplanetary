"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageCircle, Plus, Send, ShieldAlert } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type ConversationCard,
  type ThreadMessage,
  type PersonCard,
  GP_HAND,
  GP_GHOST,
  GP_INPUT,
  EmptyRoom,
  RoomLabel,
  MakerMark,
  netFetch,
  relativeTime,
  useInterval,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  MESSAGES — private and group conversations.                        */
/*                                                                     */
/*  Only participants read a room's words. Unread truths come from     */
/*  the reading marks; the thread breathes quietly while it is open.   */
/*  Blocking and reporting rest in the room's own header.              */
/* ------------------------------------------------------------------ */

export default function MessagesSection({ active }: { active: boolean }) {
  const t = useT();
  const [conversations, setConversations] = useState<ConversationCard[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  /* the new conversation sheet */
  const [creating, setCreating] = useState(false);
  const [people, setPeople] = useState<PersonCard[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [gTitle, setGTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await netFetch<{ conversations: ConversationCard[] }>(
        "/api/network/conversations"
      );
      setConversations(data.conversations);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  /* the list breathes while the section is open */
  useInterval(
    () => {
      if (document.visibilityState === "visible") void load();
    },
    active && !openId ? 6000 : null
  );

  const startConversation = useCallback(
    async (ids: string[], isGroup: boolean) => {
      if (ids.length === 0) return;
      setBusy(true);
      try {
        const data = await netFetch<{ conversationId: string }>("/api/network/conversations", {
          method: "POST",
          body: isGroup ? { title: gTitle.trim(), memberIds: ids } : { userId: ids[0] },
        });
        setCreating(false);
        setPicked([]);
        setGTitle("");
        setOpenId(data.conversationId);
      } catch {
        /* the sheet stays open */
      } finally {
        setBusy(false);
      }
    },
    [gTitle]
  );

  const openPeople = useCallback(async () => {
    setCreating(true);
    try {
      const data = await netFetch<{ people: PersonCard[] }>("/api/network/people?take=40");
      setPeople(data.people);
    } catch {
      setPeople([]);
    }
  }, []);

  if (openId) {
    return (
      <ThreadRoom
        id={openId}
        onBack={() => {
          setOpenId(null);
          void load();
        }}
      />
    );
  }

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[760px]">
        <div className="flex items-center justify-between gap-3">
          <RoomLabel>{t("Messages")}</RoomLabel>
          <button type="button" onClick={() => void openPeople()} className={GP_HAND} data-testid="messages-new">
            <Plus className="size-4" aria-hidden="true" />
            {t("New conversation")}
          </button>
        </div>

        {conversations === null && !error && (
          <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The conversations arrive…")}
          </p>
        )}
        {error && (
          <p className="py-20 text-center text-[13.5px] text-[#b45309]">
            {t("The conversations could not be read.")}
          </p>
        )}
        {conversations !== null && conversations.length === 0 && !error && (
          <EmptyRoom
            icon={MessageCircle}
            line={t("No conversations yet — meet someone in Encounters and open a door.")}
          />
        )}
        {conversations !== null && conversations.length > 0 && (
          <div className="mt-4 space-y-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpenId(c.id)}
                data-testid={`conversation-${c.id}`}
                className="gp-card gp-card-hover focus-glow flex w-full items-center gap-3 rounded-[20px] px-4 py-3.5 text-left outline-none"
              >
                <MakerMark name={c.title} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-[#3d3428]">{c.title}</p>
                    {c.isGroup && (
                      <span className="mono-label shrink-0 rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-1.5 py-0.5 text-[7.5px] uppercase tracking-[0.14em] text-[#8a6f46]">
                        {t("circle of voices")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-[#7c715f]">
                    {c.lastMessage
                      ? `${c.lastMessage.senderName}: ${c.lastMessage.body}`
                      : t("The room waits for its first word.")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {c.lastMessage && (
                    <p className="text-[10px] text-[#a2947c]">
                      {relativeTime(c.lastMessage.createdAt, t)}
                    </p>
                  )}
                  {c.unreadCount > 0 && (
                    <span
                      aria-label={t("unread")}
                      className="mt-1 inline-flex items-center justify-center rounded-full bg-[#a16207] px-1.5 text-[10px] font-bold text-white"
                    >
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------- the new conversation sheet ---------- */}
      {creating && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end sm:justify-center sm:px-6" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t("Keep shaping")}
            onClick={() => setCreating(false)}
            className="absolute inset-0 cursor-default bg-[#3d3428]/25"
            tabIndex={-1}
          />
          <div className="gp-glass relative flex max-h-[86%] flex-col rounded-t-[28px] sm:mx-auto sm:w-full sm:max-w-[540px] sm:rounded-[30px]">
            <div className="flex items-center justify-between px-5 pt-4 sm:px-7 sm:pt-5">
              <RoomLabel>{t("Gather a conversation")}</RoomLabel>
              <button
                type="button"
                onClick={() => setCreating(false)}
                aria-label={t("Keep shaping")}
                className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
              >
                <ArrowLeft className="size-3.5 rotate-90" aria-hidden="true" />
              </button>
            </div>
            <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
              {people.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[#a2947c]">
                  {t("Meet makers in Encounters first — conversations grow from meetings.")}
                </p>
              ) : (
                <>
                  <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                    {picked.length > 1 ? t("They will be a circle of voices") : t("One door")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {people.map((p) => {
                      const on = picked.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setPicked((prev) => (on ? prev.filter((x) => x !== p.id) : [...prev, p.id]))
                          }
                          aria-pressed={on}
                          className={cn(
                            "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-all duration-300",
                            on
                              ? "border-[#cbb98d] bg-white text-[#5c5344]"
                              : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                          )}
                        >
                          <MakerMark name={p.name} size={22} />
                          <span className="text-[11.5px] font-semibold">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {picked.length > 1 && (
                    <input
                      value={gTitle}
                      onChange={(e) => setGTitle(e.target.value)}
                      maxLength={60}
                      placeholder={t("Give the conversation its name…")}
                      aria-label={t("Give the conversation its name…")}
                      className={cn(GP_INPUT, "mt-3")}
                    />
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5 border-t border-[#eadfca]/70 px-5 py-3.5 sm:px-7">
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => void startConversation(picked, picked.length > 1)}
                disabled={picked.length === 0 || busy || (picked.length > 1 && gTitle.trim().length < 3)}
                className={GP_HAND}
                data-testid="messages-create"
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("Open the room")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============== ONE THREAD =============== */
function ThreadRoom({ id, onBack }: { id: string; onBack: () => void }) {
  const t = useT();
  const [conv, setConv] = useState<{
    id: string;
    isGroup: boolean;
    title: string;
    members: Array<{ id: string; name: string; image: string | null; anon: boolean }>;
  } | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [reported, setReported] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await netFetch<{
        conversation: NonNullable<typeof conv>;
        messages: ThreadMessage[];
      }>(`/api/network/conversations/${id}`);
      setConv(data.conversation);
      setMessages(data.messages);
      /* the thread's floor follows the newest word */
      requestAnimationFrame(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch {
      /* a missed breath is followed by the next one */
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /* the open thread breathes quietly */
  useInterval(
    () => {
      if (document.visibilityState === "visible") void load();
    },
    4000
  );

  const speak = useCallback(async () => {
    const text = draft.trim();
    if (text.length < 1 || sending) return;
    setSending(true);
    try {
      const data = await netFetch<{ message: ThreadMessage }>(
        `/api/network/conversations/${id}`,
        { method: "POST", body: { body: text } }
      );
      setMessages((prev) => [...(prev ?? []), data.message]);
      setDraft("");
      requestAnimationFrame(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch {
      /* the words stay in the draft */
    } finally {
      setSending(false);
    }
  }, [draft, sending, id]);

  const reportRoom = useCallback(async () => {
    if (!conv || reported) return;
    try {
      await netFetch("/api/network/safety", {
        method: "POST",
        body: { action: "report", targetType: "conversation", targetId: conv.id, reason: "The visitor asked the house for help with this conversation." },
      });
      setReported(true);
    } catch {
      /* the hand returns */
    }
  }, [conv, reported]);

  return (
    <div className="flex h-full flex-col px-3 pb-4 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto flex w-full max-w-[760px] items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("Messages")}
          className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-[#3d3428]">
            {conv?.title ?? "…"}
          </p>
          {conv?.isGroup && (
            <p className="text-[10.5px] text-[#a2947c]">
              {conv.members.map((m) => m.name).join(" · ")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void reportRoom()}
          aria-label={t("Ask the house for help")}
          title={reported ? t("The house has heard.") : t("Ask the house for help")}
          className={cn(
            "focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
            reported
              ? "border-[#7c5cad]/40 bg-[#7c5cad]/10 text-[#7c5cad]"
              : "border-[#e4d9bd] bg-white/70 text-[#a2947c] hover:text-[#b45309]"
          )}
        >
          <ShieldAlert className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div ref={bodyRef} className="gp-scroll mx-auto mt-4 min-h-0 w-full max-w-[760px] flex-1 space-y-3 overflow-y-auto pr-1" data-testid="messages-thread">
        {messages === null ? (
          <p className="flex items-center justify-center gap-2 py-16 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The room arrives…")}
          </p>
        ) : messages.length === 0 ? (
          <p className="py-16 text-center font-[family-name:var(--font-literata)] text-[13.5px] italic leading-[1.85] text-[#8a7c64]">
            {t("The room waits for its first word.")}
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")} data-testid={`message-${m.id}`}>
              <div
                className={cn(
                  "gp-card max-w-[80%] rounded-[18px] px-4 py-2.5",
                  m.mine && "border-[#d9c99a]/50 bg-[#faf5e6]"
                )}
              >
                {!m.mine && (
                  <p className="text-[10px] font-semibold text-[#8a6f46]">{m.sender.name}</p>
                )}
                <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-[#4c4436] [overflow-wrap:anywhere]">
                  {m.body}
                </p>
                <p className="mt-1 text-right text-[9.5px] text-[#b3a68d]">
                  {relativeTime(m.createdAt, t)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mx-auto mt-3 w-full max-w-[760px]">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void speak();
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder={t("Speak into the room…")}
            aria-label={t("Speak into the room…")}
            data-testid="messages-draft"
            className="gp-scroll max-h-28 min-h-[44px] flex-1 resize-none rounded-[16px] border border-[#e4d9bd] bg-white/80 px-3.5 py-2.5 text-[13px] leading-relaxed text-[#4c4436] outline-none transition-colors duration-300 placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
          />
          <button
            type="button"
            onClick={() => void speak()}
            disabled={sending || draft.trim().length < 1}
            aria-label={t("Speak the echo")}
            className={cn(GP_HAND, "size-11 px-0 py-0")}
            data-testid="messages-send"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

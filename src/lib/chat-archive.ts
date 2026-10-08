/* ------------------------------------------------------------------ */
/*  THE CHAT ARCHIVE — the visitor's own keeping, in the browser.      */
/*                                                                     */
/*  The ChatGPT law of the house: every conversation SURVIVES. A       */
/*  reload, a journey to another world, the closing of the tab — the   */
/*  words remain. The visitor alone decides when a conversation ends:  */
/*  "New chat" lays the present one to rest in the archive and opens   */
/*  a fresh page; the old one can always be reopened from the          */
/*  conversation panel. Nothing ever travels to a server — the         */
/*  browser's own localStorage is the only shelf, the zero-database    */
/*  law held to the letter.                                            */
/*                                                                     */
/*  Per surface (os / px / em / ax / forge / interplanetary /          */
/*  healing) the archive keeps a list of conversations (newest         */
/*  first) plus which one is active. Titles are drawn from the         */
/*  visitor's own first words, the way ChatGPT names a chat.           */
/* ------------------------------------------------------------------ */

export type ChatSurface =
  | "os"
  | "px"
  | "em"
  | "ax"
  | "forge"
  | "interplanetary"
  | "healing";

export interface ArchivedChat {
  id: string;
  title: string;
  savedAt: string;
  /** The surface's own message shape — the archive never looks inside. */
  messages: unknown[];
  /** The scope/window the conversation stood in (px scope, em vector,
      ax window, fusion) so reopening restores the whole room. */
  meta?: { scope?: string | null; fusion?: string[] };
}

interface ArchiveShape {
  [surface: string]: { activeId: string; chats: ArchivedChat[] };
}

const KEY = "mirror-chat-archive-v1";
const MAX_CHATS_PER_SURFACE = 30;
const MAX_MESSAGES_PER_CHAT = 80;
/** data: URLs (canvas paintings) can alone exceed the quota — they are
    dropped on the shelf (the live session still holds them). Remote
    https images keep their place. */
const MAX_INLINE_STRING = 60_000;

export const ARCHIVE_EVENT = "mirror:archive-changed";

function freshId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---- the deep sweep — long inline strings (data: images) are shed ---- */

function shedHeavy(value: unknown, depth = 0): unknown {
  if (depth > 8) return null;
  if (typeof value === "string")
    return value.length > MAX_INLINE_STRING && value.startsWith("data:")
      ? ""
      : value;
  if (Array.isArray(value)) return value.slice(0, 60).map((v) => shedHeavy(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>))
      out[k] = shedHeavy(v, depth + 1);
    return out;
  }
  return value;
}

function readArchive(): ArchiveShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ArchiveShape;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeArchive(state: ArchiveShape) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* the shelf is full — shed the oldest conversations by half, once */
    try {
      const trimmed: ArchiveShape = {};
      for (const [surface, entry] of Object.entries(state)) {
        trimmed[surface] = {
          activeId: entry.activeId,
          chats: entry.chats
            .slice(0, Math.max(1, Math.ceil(entry.chats.length / 2)))
            .map((c) => ({ ...c, messages: c.messages.slice(-30) })),
        };
      }
      window.localStorage.setItem(KEY, JSON.stringify(trimmed));
    } catch {
      /* even the trimmed shelf refused — the session copy still holds */
    }
  }
  window.dispatchEvent(new CustomEvent(ARCHIVE_EVENT));
}

function entryOf(state: ArchiveShape, surface: ChatSurface) {
  return (
    state[surface] ?? {
      activeId: "",
      chats: [] as ArchivedChat[],
    }
  );
}

/* ----------------------- the public shelf --------------------------- */

export function listChats(surface: ChatSurface): ArchivedChat[] {
  return entryOf(readArchive(), surface).chats;
}

export function getActiveChatId(surface: ChatSurface): string {
  return entryOf(readArchive(), surface).activeId;
}

export function getChat(surface: ChatSurface, id: string): ArchivedChat | null {
  return entryOf(readArchive(), surface).chats.find((c) => c.id === id) ?? null;
}

/** Upsert the active conversation (the autosave's one hand). Empty
    conversations never take a place on the shelf. */
export function saveActiveChat(
  surface: ChatSurface,
  data: {
    messages: unknown[];
    title?: string;
    meta?: ArchivedChat["meta"];
  }
): void {
  if (typeof window === "undefined") return;
  const messages = (shedHeavy(data.messages) as unknown[]) ?? [];
  if (messages.length === 0) return;
  const state = readArchive();
  const entry = entryOf(state, surface);
  const id = entry.activeId || freshId();
  const existing = entry.chats.find((c) => c.id === id);
  const title =
    (data.title && data.title.trim()) ||
    existing?.title ||
    firstTitle(messages) ||
    "…";
  const chat: ArchivedChat = {
    id,
    title: title.slice(0, 60),
    savedAt: new Date().toISOString(),
    messages: messages.slice(-MAX_MESSAGES_PER_CHAT),
    meta: data.meta ?? existing?.meta,
  };
  const chats = [chat, ...entry.chats.filter((c) => c.id !== id)].slice(
    0,
    MAX_CHATS_PER_SURFACE
  );
  state[surface] = { activeId: id, chats };
  writeArchive(state);
}

/** The ChatGPT turn: the present conversation is already on the shelf
    (the autosave keeps it current); "New chat" opens a fresh page and
    makes it the active one. The outgoing conversation is never erased. */
export function startNewChat(surface: ChatSurface): string {
  if (typeof window === "undefined") return "";
  const state = readArchive();
  const entry = entryOf(state, surface);
  /* prune empty strays — only conversations with words may rest here */
  const chats = entry.chats.filter((c) => c.messages.length > 0);
  const id = freshId();
  state[surface] = { activeId: id, chats };
  writeArchive(state);
  return id;
}

export function setActiveChat(surface: ChatSurface, id: string) {
  if (typeof window === "undefined") return;
  const state = readArchive();
  const entry = entryOf(state, surface);
  state[surface] = { activeId: id, chats: entry.chats };
  writeArchive(state);
}

export function deleteChat(surface: ChatSurface, id: string) {
  if (typeof window === "undefined") return;
  const state = readArchive();
  const entry = entryOf(state, surface);
  const chats = entry.chats.filter((c) => c.id !== id);
  const activeId = entry.activeId === id ? chats[0]?.id ?? "" : entry.activeId;
  state[surface] = { activeId, chats };
  writeArchive(state);
}

function firstTitle(messages: unknown[]): string {
  for (const m of messages) {
    if (m && typeof m === "object") {
      const rec = m as { query?: unknown; text?: unknown; role?: unknown };
      const isVisitor = rec.role === undefined || rec.role === "visitor";
      const words =
        typeof rec.query === "string" && rec.query.trim()
          ? rec.query
          : isVisitor && typeof rec.text === "string" && rec.text.trim()
            ? rec.text
            : "";
      if (words.trim()) return words.trim();
    }
  }
  return "";
}

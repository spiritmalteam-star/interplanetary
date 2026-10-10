"use client";

/* ------------------------------------------------------------------ */
/*  THE ROOM NARRATOR — the walk's one voice.                          */
/*                                                                     */
/*  The frequency tones are retired: a room no longer hums, it         */
/*  SPEAKS. The male documentary narrator (the house's "aurora"        */
/*  register, engine xiaochen — a measured, low male voice) reads      */
/*  each room's transmission aloud through /api/tts, exactly like the  */
/*  laboratory's own Listen voice.                                     */
/*                                                                     */
/*  THE GATE LAW — the narrator speaks only by the visitor's own       */
/*  hand: one touch opens the gate, and from then on every room's      */
/*  landed transmission is narrated as the walk continues. Closing     */
/*  the gate (or folding the walk) silences the voice.                 */
/*                                                                     */
/*  THE ONE VOICE LAW — one narration sounds at a time; narrations     */
/*  are cached per room+language so replay is instant; a fetch that    */
/*  outlives its room is aborted, never played into the wrong room.    */
/*  When the house voice cannot travel, the visitor's own browser      */
/*  reads in its stead — the walk never falls silent.                  */
/* ------------------------------------------------------------------ */

import { toast } from "sonner";
import { DEFAULT_VOICE, translate } from "@/lib/i18n/core";
import { useMirror } from "@/lib/mirror-store";
import {
  browserVoiceAvailable,
  noteBrowserVoiceFallback,
  speakWithBrowserVoice,
  stopBrowserVoice,
} from "@/lib/browser-voice";

export type NarrationState = "idle" | "loading" | "playing";

export interface NarrationSnapshot {
  state: NarrationState;
  /** The room currently loading or speaking (null when idle). */
  roomId: string | null;
}

/** The one male register every room speaks through — the documentary
    narrator ("A man · warm documentary narrator"). */
const NARRATOR_VOICE = DEFAULT_VOICE;
const NARRATOR_PACE = 0.95;
/** The room's voice, not the whole book — two synthesis chunks at
    most, so the voice arrives while the words are still warm. */
const MAX_CHARS = 1800;
const MAX_CACHE = 12;

const IDLE_SNAPSHOT: NarrationSnapshot = { state: "idle", roomId: null };

let snapshot: NarrationSnapshot = IDLE_SNAPSHOT;
let state: NarrationState = "idle";
let currentRoom: string | null = null;
let currentAudio: HTMLAudioElement | null = null;
let inFlight: AbortController | null = null;
/** A play() refused because its click grew old — kept warm for the
    next press (the ListenButton lesson, carried into the walk). */
let prepared: { key: string; audio: HTMLAudioElement } | null = null;
/** THE GATE — false until the visitor's own hand opens it. */
let gate = false;

const listeners = new Set<(s: NarrationSnapshot) => void>();
const cache = new Map<string, string>();

function emit(): void {
  snapshot = state === "idle" && currentRoom === null
    ? IDLE_SNAPSHOT
    : { state, roomId: currentRoom };
  listeners.forEach((l) => l(snapshot));
}

function setSafe(next: NarrationState, room: string | null = currentRoom): void {
  state = next;
  currentRoom = room;
  emit();
}

/* ------------------------- the public ear -------------------------- */

/** A stable snapshot for useSyncExternalStore (identity-stable between
    emits — never a fresh object per read). */
export function getNarration(): NarrationSnapshot {
  return snapshot;
}

export function subscribeNarration(
  l: (s: NarrationSnapshot) => void
): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** True once the visitor has opened the narrator's voice this walk. */
export function narrationGateOpen(): boolean {
  return gate;
}

export function openNarrationGate(): void {
  gate = true;
}

/** Close the gate and silence the voice — the fold's law. */
export function closeNarrationGate(): void {
  gate = false;
  stopRoomNarration();
}

/* --------------------------- the voice ----------------------------- */

function cachePut(key: string, url: string): void {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      const oldUrl = cache.get(oldest);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      cache.delete(oldest);
    }
  }
  cache.set(key, url);
}

function bindAudio(audio: HTMLAudioElement, room: string): void {
  audio.onended = () => {
    if (currentAudio === audio) {
      currentAudio = null;
      setSafe("idle");
    }
  };
  audio.onerror = () => {
    if (currentAudio === audio) {
      currentAudio = null;
      setSafe("idle");
    }
  };
}

/** The browser reads in the house voice's stead — the walk never
    falls silent (the traveler's voice). */
function speakWithTravelerVoice(
  text: string,
  room: string,
  language: string
): boolean {
  if (!browserVoiceAvailable()) return false;
  stopBrowserVoice();
  const handle = speakWithBrowserVoice({
    text,
    lang: language,
    rate: Math.min(1.15, NARRATOR_PACE),
    onEnd: () => {
      if (state === "playing" && currentRoom === room) setSafe("idle");
    },
  });
  if (!handle) return false;
  noteBrowserVoiceFallback(() => {
    const lang = useMirror.getState().language;
    toast.info(
      translate(
        lang,
        "The house voice rests — your browser reads in its stead."
      )
    );
  });
  setSafe("playing", room);
  return true;
}

/** Silence the narrator — every stop path leads here. */
export function stopRoomNarration(): void {
  if (inFlight) {
    inFlight.abort();
    inFlight = null;
  }
  prepared = null;
  stopBrowserVoice();
  if (currentAudio) {
    const audio = currentAudio;
    currentAudio = null;
    audio.onended = null;
    audio.onerror = null;
    try {
      audio.pause();
    } catch {
      /* already at rest */
    }
  }
  if (state !== "idle" || currentRoom !== null) setSafe("idle", null);
}

/**
 * The narrator reads a room's transmission aloud. One voice at a
 * time: a new room's voice stops the old one; the same room already
 * loading or speaking is left to breathe. Resolves when the voice is
 * playing (or when it has honestly failed — the traveler's voice
 * stands in first, the walk never falls silent).
 */
export async function speakRoomNarration(
  roomId: string,
  text: string,
  language: string
): Promise<void> {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
  if (!clean) return;

  /* the same room already speaking or gathering — let it breathe */
  if (
    (state === "playing" || state === "loading") &&
    currentRoom === roomId
  ) {
    return;
  }

  stopRoomNarration();

  const key = `${roomId}::${language}`;

  /* the prepared voice from a refused first play — release it now */
  const ready = prepared;
  if (ready && ready.key === key) {
    prepared = null;
    currentAudio = ready.audio;
    bindAudio(ready.audio, roomId);
    try {
      await ready.audio.play();
      setSafe("playing", roomId);
    } catch {
      currentAudio = null;
      setSafe("idle");
    }
    return;
  }

  setSafe("loading", roomId);
  try {
    let url = cache.get(key);
    if (!url) {
      inFlight = new AbortController();
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: clean,
          voice: NARRATOR_VOICE,
          pace: NARRATOR_PACE,
        }),
        signal: inFlight.signal,
      });
      inFlight = null;
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "the voice field refused");
      }
      const blob = await res.blob();
      url = URL.createObjectURL(blob);
      cachePut(key, url);
    }
    const audio = new Audio(url);
    currentAudio = audio;
    bindAudio(audio, roomId);
    try {
      await audio.play();
      setSafe("playing", roomId);
    } catch (playErr) {
      if (
        playErr instanceof DOMException &&
        playErr.name === "NotAllowedError"
      ) {
        /* the press that fetched the voice grew old while it traveled —
           keep it warm; one more touch and the narrator speaks */
        currentAudio = null;
        prepared = { key, audio };
        setSafe("idle");
        return;
      }
      throw playErr;
    }
  } catch (err) {
    /* an aborted fetch belongs to a room already left — quiet */
    if (err instanceof DOMException && err.name === "AbortError") return;
    setSafe("idle");
    if (speakWithTravelerVoice(clean, roomId, language)) return;
    const lang = useMirror.getState().language;
    toast.error(translate(lang, "The voice field is momentarily quiet."), {
      description: translate(lang, "Rest, then listen again."),
    });
  }
}

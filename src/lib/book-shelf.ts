"use client";

/* ------------------------------------------------------------------ */
/*  THE SHELF OF KEPT VOLUMES — the Dream Book's own history.          */
/*                                                                     */
/*  A volume that took an evening to weave never vanishes the moment   */
/*  the visitor turns away: every book rests on this shelf — kept on   */
/*  the visitor's own device (localStorage, temporary by nature), and  */
/*  in their cosmic library on the server when they are signed in.     */
/*  One touch of the history button and the past volumes return,      */
/*  ready to be read again or continued.                               */
/*                                                                     */
/*  The shelf is bounded (the eight freshest volumes) and quota-safe:  */
/*  if the browser's keeping is full, the oldest volume steps aside.   */
/* ------------------------------------------------------------------ */

export interface ShelfPage {
  n: number;
  chapter?: string;
  paragraphs: string[];
}

export interface ShelfVolume {
  bookId: string;
  title: string;
  subtitle: string;
  sigil: string;
  axiom: string;
  dedication?: string;
  totalPages: number;
  ended: boolean;
  savedAt: string;
  config: { age: string; tale: string; volume: string; level: string; topic: string };
  threads: string;
  pages: ShelfPage[];
}

const SHELF_KEY = "mirror-dream-shelf";
const SHELF_MAX = 8;
/** A generous page budget per volume — the browser's own drive holds it. */
const PAGE_BUDGET = 160;

export function loadShelf(): ShelfVolume[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHELF_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShelfVolume[];
    return Array.isArray(parsed) ? parsed.filter((v) => v && v.title) : [];
  } catch {
    return [];
  }
}

/** Trims a volume to its keeping size — the newest pages matter most. */
function trimVolume(v: ShelfVolume): ShelfVolume {
  const pages = v.pages.length > PAGE_BUDGET ? v.pages.slice(-PAGE_BUDGET) : v.pages;
  return { ...v, pages };
}

/** Keeps a volume on the shelf — deduped by its library id, newest first. */
export function keepVolume(volume: ShelfVolume): void {
  if (typeof window === "undefined") return;
  try {
    const prev = loadShelf();
    const rest = prev.filter(
      (v) => v.bookId && volume.bookId && v.bookId !== volume.bookId
    );
    const next = [{ ...trimVolume(volume), savedAt: new Date().toISOString() }, ...rest].slice(
      0,
      SHELF_MAX
    );
    try {
      window.localStorage.setItem(SHELF_KEY, JSON.stringify(next));
    } catch {
      /* the drive is full — the oldest volume steps aside, one by one */
      let trimmed = [...next];
      while (trimmed.length > 1) {
        trimmed = trimmed.slice(0, -1);
        try {
          window.localStorage.setItem(SHELF_KEY, JSON.stringify(trimmed));
          return;
        } catch {
          /* keep stepping aside */
        }
      }
    }
  } catch {
    /* the shelf never interrupts the weaving */
  }
}

export function forgetVolume(bookId: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = loadShelf().filter((v) => v.bookId !== bookId);
    window.localStorage.setItem(SHELF_KEY, JSON.stringify(next));
  } catch {
    /* quiet */
  }
}

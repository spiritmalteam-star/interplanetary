"use client";

import { useEffect, useRef } from "react";
import { useMirror, type ToolTabKey } from "@/lib/mirror-store";

/* ------------------------------------------------------------------ */
/*  THE REAL ADDRESS LAYER — "a real address for every room".          */
/*                                                                     */
/*  The house is one living application, so every room's address is a  */
/*  query of the one URL (?room=music, ?room=books, ?room=codex…):     */
/*  deep links open the room directly, a refresh keeps it, browser     */
/*  Back / Forward walk the visit's own history, and the document's    */
/*  title wears the room's name. Private content stays out of the      */
/*  URL — only the room's kind travels, never a work's words.          */
/*                                                                     */
/*  Route protection stays with the shared access resolver: browsing   */
/*  is open to every visitor; only purchase and publish ask for a      */
/*  passage (the doors themselves speak when a keeper is needed).      */
/* ------------------------------------------------------------------ */

const TAB_ROOMS: Record<ToolTabKey, string> = {
  register: "codex",
  dreambook: "books",
  lightcodes: "music",
  akashic: "akashic",
  invent: "invent",
  quantum: "quantum",
  healx: "healx",
  artx: "atelier",
  video: "studio",
  library: "library",
  mirroros: "mirroros",
  scopes: "scopes",
};

const OVERLAY_ROOMS = {
  market: "market",
  profile: "profile",
  about: "about",
  tour: "tour",
  signin: "signin",
  billing: "billing",
} as const;

const ROOM_TITLES: Record<string, string> = {
  workplace: "InDream workspace",
  codex: "Codex Exobiologica",
  books: "Books",
  music: "Music",
  akashic: "Akashic Records",
  invent: "Invent",
  quantum: "Quantum",
  healx: "Heal X",
  atelier: "Atelier",
  studio: "Studio",
  library: "Library",
  mirroros: "Mirror OS",
  scopes: "Scopes",
  market: "Market",
  profile: "Profile",
  billing: "Credits & plans",
  signin: "Sign in",
  about: "About Us",
  tour: "Welcome tour",
};

type RoomName = string;

function roomFromState(s: ReturnType<typeof useMirror.getState>): RoomName | null {
  if (s.marketOpen) return OVERLAY_ROOMS.market;
  if (s.profilePageOpen) return OVERLAY_ROOMS.profile;
  if (s.aboutOpen) return OVERLAY_ROOMS.about;
  if (s.tourOpen) return OVERLAY_ROOMS.tour;
  if (s.authOpen) return OVERLAY_ROOMS.signin;
  if (s.walletModalOpen) return OVERLAY_ROOMS.billing;
  if (s.activeToolTab) return TAB_ROOMS[s.activeToolTab];
  return null;
}

function roomTitle(room: RoomName | null): string {
  if (!room) return "ReflectMe — the Mirror Entity";
  return `${ROOM_TITLES[room] ?? room} · ReflectMe`;
}

function urlForRoom(room: RoomName | null): string {
  return room ? `/?room=${room}` : "/";
}

/* apply a room to the store — every door open to every visitor; the
   paid doors themselves ask for a passage when purchase or publish
   is the visitor's aim */
function openRoom(room: RoomName | null) {
  const s = useMirror.getState();
  switch (room) {
    case null:
      return;
    case OVERLAY_ROOMS.market:
      s.openMarket();
      return;
    case OVERLAY_ROOMS.profile:
      s.openProfilePage();
      return;
    case OVERLAY_ROOMS.about:
      s.openAbout();
      return;
    case OVERLAY_ROOMS.tour:
      s.openTour();
      return;
    case OVERLAY_ROOMS.signin:
      s.openAuth("signin");
      return;
    case OVERLAY_ROOMS.billing:
      s.openWalletModal();
      return;
    case "workplace": {
      s.openToolTab(s.lastMakerTab ?? "dreambook");
      return;
    }
    default: {
      const tab = (Object.keys(TAB_ROOMS) as ToolTabKey[]).find(
        (k) => TAB_ROOMS[k] === room
      );
      if (tab) s.openToolTab(tab);
    }
  }
}

export function UrlRooms() {
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const marketOpen = useMirror((s) => s.marketOpen);
  const profilePageOpen = useMirror((s) => s.profilePageOpen);
  const aboutOpen = useMirror((s) => s.aboutOpen);
  const tourOpen = useMirror((s) => s.tourOpen);
  const authOpen = useMirror((s) => s.authOpen);
  const walletModalOpen = useMirror((s) => s.walletModalOpen);
  /* the room the address bar already carries — pushes are skipped for it */
  const addressRoom = useRef<RoomName | null>(null);
  const booted = useRef(false);

  /* THE FIRST BREATH — the address is read once and its room opened,
     so a bookmarked or refreshed link lands where it names. */
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      addressRoom.current = room;
      openRoom(room);
      /* the title wears the room's name from the very first breath */
      const title = roomTitle(room);
      if (document.title !== title) document.title = title;
    }
  }, []);

  /* THE HOUSE'S OWN SYNC — a room change writes its address (Back and
     Forward walk the visit's rooms), and the title wears the room's
     name. The room the address already carries never pushes again. */
  useEffect(() => {
    const room = roomFromState(useMirror.getState());
    if (room === addressRoom.current) return;
    addressRoom.current = room;
    try {
      window.history.pushState({ room }, "", urlForRoom(room));
      const title = roomTitle(room);
      if (document.title !== title) document.title = title;
    } catch {
      /* an address that cannot be written never blocks the room */
    }
  }, [activeToolTab, marketOpen, profilePageOpen, aboutOpen, tourOpen, authOpen, walletModalOpen]);

  /* THE VISITOR'S OWN STEPS — Back and Forward re-enter the room the
     history carries, without pushing a new address for it. */
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const room = params.get("room");
      addressRoom.current = room;
      openRoom(room);
      const title = roomTitle(room);
      if (document.title !== title) document.title = title;
      void e;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return null;
}

"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import {
  isLanguageCode,
  translate,
  ensureDict,
  subscribeDicts,
  getDictVersion,
  type LanguageCode,
} from "./core";

export * from "./core";

/* ------------------------------------------------------------------ */
/*  THE LANGUAGE'S OWN STORE — deliberately tiny and dependency-free.  */
/*  The landing page, the dictionaries and every room can translate    */
/*  without pulling the whole laboratory's state (and its data         */
/*  archives) into their bundle — the threshold's first paint sheds    */
/*  the luggage. The laboratory's own store keeps its mirror copy for  */
/*  API calls and pushes every change here (one language, one truth,   */
/*  two light keepers — mirror-store → setUiLanguage).                 */
/* ------------------------------------------------------------------ */

interface UiLanguageState {
  language: LanguageCode;
  set: (code: LanguageCode) => void;
}

export const useUiLanguage = create<UiLanguageState>((set) => ({
  language: "en",
  set: (code) => set({ language: code }),
}));

/** The whole document follows the chosen voice — screen readers and
    browsing agents read the page in the language it now speaks. */
function applyDocumentLang(code: LanguageCode) {
  try {
    document.documentElement.lang = code;
  } catch {
    /* no document — silent */
  }
}

/** The one entry point the laboratory's store uses — switching here
    changes every translated surface instantly, with no reload, no
    lost drafts, no route change and no re-login. The tongue's lazy
    dictionary is lifted first, so no English flash lands mid-swap;
    a rapid switch is race-guarded (the last voice asked for wins). */
let latestAsked: LanguageCode | null = null;
export async function setUiLanguage(code: LanguageCode): Promise<void> {
  latestAsked = code;
  await ensureDict(code);
  if (latestAsked !== code) return;
  useUiLanguage.getState().set(code);
  applyDocumentLang(code);
}

/** Boot the language from the visitor's own device — called once at
    the landing's first breath (the laboratory's bootPreferences also
    feeds it after reading the same key). */
export function bootUiLanguage(): void {
  try {
    const raw = localStorage.getItem("mirror-entity-language");
    if (raw && isLanguageCode(raw)) void setUiLanguage(raw);
  } catch {
    /* storage closed — English stays */
  }
}

/** Reactive translator — re-renders when the language changes, and
    once more when the chosen tongue's lazy dictionary arrives (until
    then the English source speaks, the law of the fallback). */
export function useT() {
  const language = useUiLanguage((s) => s.language);
  /* the tongues' own wake — a version bump when a lazy dict lands */
  useSyncExternalStore(subscribeDicts, getDictVersion, getDictVersion);
  useEffect(() => {
    void ensureDict(language);
  }, [language]);
  return useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language]
  );
}

/** The current language outside React (API payloads). */
export function currentUiLanguage(): LanguageCode {
  return useUiLanguage.getState().language;
}

/** Keep <html lang> truthful even if a surface changes the store
    directly — mounted once at the application's root. */
export function useDocumentLang() {
  const language = useUiLanguage((s) => s.language);
  useEffect(() => {
    applyDocumentLang(language);
  }, [language]);
}

"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useMirror } from "@/lib/mirror-store";
import {
  translate,
  ensureDict,
  subscribeDicts,
  getDictVersion,
} from "./core";

export * from "./core";

/** Reactive translator — re-renders when the language changes, and
    once more when the chosen tongue's lazy dictionary arrives (until
    then the English source speaks, the law of the fallback). */
export function useT() {
  const language = useMirror((s) => s.language);
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

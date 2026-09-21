"use client";

import { useCallback } from "react";
import { useMirror } from "@/lib/mirror-store";
import { translate, type LanguageCode } from "./core";

export * from "./core";

/** Reactive translator — re-renders when the language changes. */
export function useT() {
  const language = useMirror((s) => s.language);
  return useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language]
  );
}

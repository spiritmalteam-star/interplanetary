"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      /* THE TOGGLE'S OWN LAW — ON (the milky vanilla daylight) is the
         default: a fresh key forgets every older midnight, so every
         visitor meets the vanilla house first; the toggle's own choice
         is kept under this key from then on. */
      defaultTheme="light"
      enableSystem={false}
      storageKey="mirror-entity-realm"
    >
      {children}
    </NextThemesProvider>
  );
}

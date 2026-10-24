"use client";

/* THE WALK'S OWN AIR — how much of the map the eye can hold at once.
   At low zoom the tree breathes in outlines only: the semantic zoom's
   Level A. Provided by the navigator, read by the living nodes. */
import { createContext } from "react";

export const NavDensity = createContext<boolean>(false);

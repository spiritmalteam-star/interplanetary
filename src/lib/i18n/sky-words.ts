/* ------------------------------------------------------------------ */
/*  THE SKY'S OWN WORDS — the honest sentences the house's doors       */
/*  speak when a storm crosses. Each one is a dict key: a failure      */
/*  word is born in the visitor's own tongue at render time (the       */
/*  i18n law — the static dictionary, never a live translation).       */
/*  An unknown storm keeps its raw word (a developer's truth).         */
/* ------------------------------------------------------------------ */

import { translate, type LanguageCode } from "./core";

export const SKY_WORDS: readonly string[] = [
  /* the field's rest — the one-breath doors' gentle storm word */
  "The field is momentarily quiet. Rest, then try again.",
  /* the spent light — the energy's own name */
  "The mirror's energy ran out momentarily — it will speak again once the light returns.",
  /* the watchful field's two-minute word */
  "The field is quiet — speak once more",
  /* the vision's honest brush */
  "The brushes rested — the vision could not be painted.",
  "Crystallize again",
  /* the other chambers' storm words */
  "ParticleX is momentarily quiet. Rest, then reach again.",
  "Evolve Med is momentarily quiet. Rest, then reach again.",
  "The chamber rests a moment. Breathe, then ask again.",
];

/** A known sky word rides the dictionary (the visitor's tongue);
    anything else stands as it came. */
export function translateSkyWord(
  language: LanguageCode,
  msg: string
): string {
  if (!msg) return msg;
  return SKY_WORDS.includes(msg) ? translate(language, msg) : msg;
}

/** The render-time hand — the component's own translator (reactive to
    the chosen tongue and the lazy dictionary's arrival) carries the
    sky's known words; unknown storms keep their raw word. */
export function skyWord(
  t: (key: string, params?: Record<string, string | number>) => string,
  msg: string
): string {
  if (!msg) return msg;
  return SKY_WORDS.includes(msg) ? t(msg) : msg;
}

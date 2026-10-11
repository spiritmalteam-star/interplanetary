/* --------------------------------------------------------------------
   THE WALK THAT LED HERE — the progression the mirror remembers.

   When the visitor speaks inside a suggestion's room, the walk's own
   trail (every whisper pressed before this one, oldest first) rides
   with their words, so the mirror knows the road and not just the
   room: it can refer back to earlier steps, honor the progression of
   the conversation, and never restart from zero. */

export function walkLine(raw: unknown): string {
  if (!Array.isArray(raw)) return "";
  const steps: string[] = [];
  for (const s of raw) {
    if (typeof s !== "string" || !s.trim()) continue;
    if (steps.length >= 8) break;
    steps.push(`${steps.length + 1}. ${s.trim().slice(0, 160)}`);
  }
  if (steps.length === 0) return "";
  return `

THE WALK THAT LED HERE (AUTHENTIC CONTEXT — the visitor's own progression): the visitor arrived at this very question through their own walk across the living tree of suggestions. Each numbered step below is a whisper they pressed before speaking; the LAST step is the suggestion this room was opened from. You remember the whole walk: when it truly serves the visitor, refer back to earlier steps and to how far they have come; honor the progression of the conversation; never restart from zero.
${steps.join("\n")}`;
}

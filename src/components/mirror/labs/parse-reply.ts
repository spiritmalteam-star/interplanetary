/* ------------------------------------------------------------------ */
/*  THE LOCAL READER — turns a Mirror reply into one or more lab       */
/*  pieces, with no round-trip anywhere: a titled node (the reply's    */
/*  first honest line) carrying its first paragraph as the note, or    */
/*  — when the reply speaks in a list — one piece per spoken step.     */
/*  Heuristic by law: the words stay on the device, only the pieces    */
/*  they name travel to the bench.                                     */
/* ------------------------------------------------------------------ */

import type { LabNodeStatus } from "./lab-config";

/** a piece waiting to be laid on a bench — the chat hands it over */
export type LaidPiece = {
  kind: string;
  name: string;
  note: string;
  status: LabNodeStatus;
};

const NAME_CAP = 80;
const NOTE_CAP = 600;
const LIST_CAP = 6;

/** markdown's paint stripped — the words, not the brushwork */
function cleanLine(line: string): string {
  return line
    .replace(/[`*_~]/g, "")
    .replace(/^\s{0,8}#{1,6}\s*/, "")
    .replace(/^\s{0,8}>\s?/, "")
    .trim();
}

function clip(text: string, cap: number): string {
  const t = text.trim();
  if (t.length <= cap) return t;
  const cut = t.slice(0, cap);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > cap * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** a numbered or bulleted line — the replies often speak in steps */
const LIST_LINE = /^\s{0,8}(?:[-*•‣–]|\d{1,2}[.)])\s+(.+)$/;

export function parseReplyToLays(
  reply: string,
  kind: string
): LaidPiece[] {
  const text = typeof reply === "string" ? reply : "";
  if (!text.trim()) return [];

  const lines = text.split("\n");

  /* THE LISTED WAY — a reply that speaks in steps becomes one piece
     per step (the list's own shape is the bench's shape) */
  const items: string[] = [];
  for (const line of lines) {
    if (items.length >= LIST_CAP) break;
    const m = line.match(LIST_LINE);
    if (!m) continue;
    const cleaned = clip(cleanLine(m[1]).replace(/^[“"']|["'”:.]+$/g, ""), NAME_CAP);
    if (cleaned.length >= 2) items.push(cleaned);
  }
  if (items.length >= 2) {
    return items.map((name) => ({ kind, name, note: "", status: "draft" as const }));
  }

  /* THE TITLED WAY — the reply's first honest line names the piece;
     its first paragraph rides along as the note. When the first line
     is a whole paragraph, its first sentence becomes the title and
     the rest of the paragraph stays with the note. */
  const cleaned = lines.map(cleanLine);
  let nameIdx = cleaned.findIndex((l) => l.length >= 2);
  if (nameIdx === -1) {
    return [
      {
        kind,
        name: "Laid from the Mirror",
        note: clip(text, NOTE_CAP),
        status: "draft",
      },
    ];
  }

  const first = cleaned[nameIdx];
  let name: string;
  let carried: string;
  if (first.length > 72) {
    const sentence = first.match(/^(.{12,}?[.!?…])(\s|$)/);
    if (sentence) {
      name = clip(sentence[1], NAME_CAP);
      carried = first.slice(sentence[1].length).trim();
    } else {
      name = clip(first, NAME_CAP);
      carried = "";
    }
  } else {
    name = clip(first.replace(/^[“"']|["'”:.]+$/g, ""), NAME_CAP);
    carried = "";
  }

  const noteLines: string[] = [];
  if (carried) noteLines.push(carried);
  for (let i = nameIdx + 1; i < cleaned.length; i++) {
    const l = cleaned[i];
    if (!l) {
      if (noteLines.length > 0) break;
      continue;
    }
    if (LIST_LINE.test(l)) break;
    noteLines.push(l);
    if (noteLines.join(" ").length >= NOTE_CAP) break;
  }
  const note = clip(noteLines.join("\n"), NOTE_CAP);

  return [{ kind, name, note, status: "draft" }];
}

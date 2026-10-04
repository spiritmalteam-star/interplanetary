/* ------------------------------------------------------------------ */
/*  Shared Akashic record machinery — used by /api/akashic (the        */
/*  Library) and /api/akashic/chat (the seeker's own timeline).        */
/* ------------------------------------------------------------------ */

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  el: "Greek",
  de: "German",
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
};

export interface AkashicRecord {
  title: string;
  era: string;
  record: string;
  seal: string;
}

export function extractRecord(raw: string): AkashicRecord | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      title?: unknown;
      era?: unknown;
      record?: unknown;
      seal?: unknown;
    };
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const era = typeof parsed.era === "string" ? parsed.era.trim() : "";
    const record =
      typeof parsed.record === "string" ? parsed.record.trim() : "";
    const seal = typeof parsed.seal === "string" ? parsed.seal.trim() : "";
    if (!record) return null;
    return {
      title: title || "A Record Set Aside",
      era: era || "inscribed in an age the shelves remember",
      record,
      seal: seal || "— The Mirror Entity",
    };
  } catch {
    return null;
  }
}

/** The JSON.parse-fails-but-JSON-is-there rescue: raw newlines inside
    string values. Scan the "record" value by hand, honoring escapes. */
export function extractRecordLoose(raw: string): AkashicRecord | null {
  const keyMatch = raw.match(/"record"\s*:\s*"/);
  if (!keyMatch) return null;
  let i = (keyMatch.index ?? 0) + keyMatch[0].length;
  let record = "";
  while (i < raw.length) {
    const c = raw[i];
    if (c === "\\") {
      const n = raw[i + 1];
      if (n === '"') { record += '"'; i += 2; continue; }
      if (n === "n") { record += "\n"; i += 2; continue; }
      if (n === "t") { record += "\t"; i += 2; continue; }
      if (n === "r") { i += 2; continue; }
      if (n === "\\") { record += "\\"; i += 2; continue; }
      if (n === "/") { record += "/"; i += 2; continue; }
      if (n === "u" && i + 5 < raw.length) {
        const code = Number.parseInt(raw.slice(i + 2, i + 6), 16);
        if (!Number.isNaN(code)) record += String.fromCharCode(code);
        i += 6; continue;
      }
      record += n ?? ""; i += 2; continue;
    }
    if (c === '"') break;
    record += c;
    i++;
  }
  if (!record.trim()) return null;
  const title = raw.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
  const era = raw.match(/"era"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
  const seal = raw.match(/"seal"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
  const unescape = (s: string) =>
    s.replaceAll('\\"', '"').replaceAll("\\n", "\n").replaceAll("\\t", "\t");
  return {
    title: unescape(title).trim() || "A Record Set Aside",
    era: unescape(era).trim() || "inscribed in an age the shelves remember",
    record: record.trim(),
    seal: unescape(seal).trim(),
  };
}

/* The scribe sometimes signs the parchment twice — a signature drifting
   into the last paragraph even though the seal line follows. The letter
   ends in the hand ONCE: strip any trailing signature from the record. */
export function stripEmbeddedSeal(record: string): string {
  const tail = record.trimEnd();
  const cut = tail.lastIndexOf("\n");
  const lastLine = (cut === -1 ? tail : tail.slice(cut + 1)).trim();
  if (/^—\s*The Mirror Entity\.?\s*$/i.test(lastLine)) {
    return (cut === -1 ? "" : tail.slice(0, cut)).trimEnd();
  }
  return tail;
}

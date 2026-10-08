/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — the Visual Director's JSON recovery                */
/*  The director composes rich JSON (panels, diagrams, annotations).   */
/*  Long panel bodies sometimes carry unescaped quotes, a missing      */
/*  comma or a bare "y:20" — and one broken character must never       */
/*  silence a vision. Three layers of mending, then a field harvest:   */
/*    1. direct parse (fences unwrapped)                               */
/*    2. heuristic repair (control chars, trailing commas, bare keys)  */
/*    3. stray-quote escaping (raw " inside string values)             */
/*    4. field harvesting — regex the essential fields straight out    */
/*       of broken text, so the atelier can paint anyway               */
/*  Safe on server and client: pure functions, no I/O.                 */
/* ------------------------------------------------------------------ */

/** Repair the small, known sloppinesses of a JSON-looking span. */
export function repairHeuristics(span: string): string {
  return span
    /* control characters inside strings */
    .replace(/[\u0000-\u0019]+/g, " ")
    /* trailing commas */
    .replace(/,(\s*[}\]])/g, "$1")
    /* missing quote after a short key:  "y:10  →  "y":10 — the group
       already carries the colon, so the replacement adds only the
       missing quote (a literal extra colon here produced "y"::10 and
       the repair forever failed its own fix) */
    .replace(/"(x|y|z|id|n)(:\s*-?\d)/g, '"$1"$2')
    /* missing comma between sibling values:  "a":"1" "b":"2" */
    .replace(/"(\s*)\{"(?=[a-z]+":)/g, '"$1,{"');
}

/**
 * Walk the text as the JSON parser would and escape every bare `"`
 * that opens INSIDE a string value but is not its structural closer —
 * the unquoted-quote disease of long panel bodies. A closing quote is
 * recognized by what follows it (`, : } ]` or end); anything else is a
 * stray quote from the prose and becomes `\"`.
 */
export function escapeStrayQuotes(src: string): string {
  if (!src.includes('"')) return src;
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (!inStr) {
      if (ch === '"') inStr = true;
      out += ch;
      continue;
    }
    if (esc) {
      out += ch;
      esc = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      esc = true;
      continue;
    }
    if (ch === '"') {
      /* lookahead — a structural follower means the string truly ends */
      let j = i + 1;
      while (j < src.length && (src[j] === " " || src[j] === "\t")) j++;
      const nxt = src[j];
      if (nxt === undefined || nxt === "," || nxt === ":" || nxt === "}" || nxt === "]") {
        inStr = false;
        out += ch;
      } else {
        out += '\\"';
      }
      continue;
    }
    out += ch;
  }
  return out;
}

function parseSpan(span: string): Record<string, unknown> | null {
  try {
    return JSON.parse(span) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Parse a JSON object out of free text — fences unwrapped, span cut. */
export function parseJsonLoose(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  for (let depth = 0; depth < 3; depth++) {
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fence) text = fence[1].trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    const span = text.slice(start, end + 1);
    const direct = parseSpan(span);
    if (direct) return direct;
    const mended = parseSpan(repairHeuristics(span));
    if (mended) return mended;
    const escaped = parseSpan(escapeStrayQuotes(repairHeuristics(span)));
    if (escaped) return escaped;
    const escapedThenMended = parseSpan(repairHeuristics(escapeStrayQuotes(span)));
    if (escapedThenMended) return escapedThenMended;
    /* unwrap one more layer and try again */
    text = span;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  THE FIELD HARVEST — the JSON may be beyond structural repair,      */
/*  yet the vision itself (subject, prompt, whisper, panels) still     */
/*  lies inside the text. Pull the essential fields out by hand.       */
/* ------------------------------------------------------------------ */

const str = (v: unknown, max = 2000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Clean a harvested value: unescape, drop stray trailing quotes. */
function cleanHarvested(v: string): string {
  return v
    .replace(/\\(["\\\/])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/"/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** One string field, tolerant of stray quotes inside its value. */
function harvestStringField(text: string, key: string, max = 2000): string {
  const re = new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?=,\\s*"|\\})`, "i");
  const m = text.match(re);
  if (m) return cleanHarvested(m[1]).slice(0, max);
  /* the value may end at the text's end or run into a known next key */
  const re2 = new RegExp(
    `"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?=,\\s*"(?:subject|title|subtitle|whisper|explanation|discernment|aspect|artworkPrompt|panels|diagram|annotations|slides|mode)"|\\}|$)`,
    "i"
  );
  const m2 = text.match(re2);
  return m2 ? cleanHarvested(m2[1]).slice(0, max) : "";
}

/** Heading/body pairs, even when the enclosing JSON is broken. */
function harvestPanels(text: string): { heading: string; body: string }[] {
  const out: { heading: string; body: string }[] = [];
  const re =
    /"heading"\s*:\s*"([\s\S]*?)"\s*,\s*"body"\s*:\s*"([\s\S]*?)"\s*(?=\}|,\s*\{|\])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && out.length < 6) {
    const heading = cleanHarvested(m[1]).slice(0, 90);
    const body = cleanHarvested(m[2]).slice(0, 700);
    if (heading && body) out.push({ heading, body });
  }
  return out;
}

/** Annotation pins — {"x":20,"y":40,"label":"..."} — quote-typo safe. */
function harvestAnnotations(text: string): { x: number; y: number; label: string }[] {
  const out: { x: number; y: number; label: string }[] = [];
  const re = /"x"\s*:\s*(\d{1,3})\s*,\s*"?y"?\\?\s*:\s*(\d{1,3})\s*,\s*"label"\s*:\s*"([\s\S]*?)"\s*(?=\}|,\s*\{|\])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && out.length < 8) {
    const x = Math.min(92, Math.max(8, parseInt(m[1], 10) || 50));
    const y = Math.min(92, Math.max(8, parseInt(m[2], 10) || 50));
    const label = cleanHarvested(m[3]).slice(0, 60);
    if (label) out.push({ x, y, label });
  }
  return out;
}

/** Diagram nodes — {"id":"n1","label":"...","x":25,"y":30}. */
function harvestDiagramNodes(
  text: string
): { id: string; label: string; x: number; y: number }[] {
  const out: { id: string; label: string; x: number; y: number }[] = [];
  const re = /"id"\s*:\s*"(n?\w{1,8})"\s*,\s*"label"\s*:\s*"([\s\S]*?)"\s*,\s*"x"\s*:\s*(\d{1,3})\s*,\s*"?y"?\\?\s*:\s*(\d{1,3})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && out.length < 10) {
    const label = cleanHarvested(m[2]).slice(0, 40);
    if (!label) continue;
    out.push({
      id: m[1].slice(0, 20),
      label,
      x: Math.min(92, Math.max(8, parseInt(m[3], 10) || 50)),
      y: Math.min(92, Math.max(8, parseInt(m[4], 10) || 50)),
    });
  }
  return out;
}

const KNOWN_MODES = [
  "illustration",
  "encyclopedia",
  "diagram",
  "science",
  "map",
  "presentation",
] as const;

export interface HarvestedSpec {
  mode?: string;
  subject: string;
  title: string;
  subtitle: string;
  whisper: string;
  explanation: string;
  discernment: string;
  aspect: string;
  artworkPrompt: string;
  panels: { heading: string; body: string }[];
  annotations: { x: number; y: number; label: string }[];
  diagramNodes: { id: string; label: string; x: number; y: number }[];
}

/**
 * Harvest the director's essential fields out of raw, possibly broken
 * output. Returns null only when not even a subject or artwork prompt
 * can be found — in which case the vision truly was never composed.
 */
export function harvestDirectorSpec(raw: string): HarvestedSpec | null {
  const text = raw.replace(/```(?:json)?/g, "").trim();
  if (!text) return null;

  const modeMatch = text.match(
    /"mode"\s*:\s*"(illustration|encyclopedia|diagram|science|map|presentation)"/i
  );
  const mode = modeMatch
    ? (modeMatch[1].toLowerCase() as (typeof KNOWN_MODES)[number])
    : undefined;

  const subject = harvestStringField(text, "subject", 300);
  const title = harvestStringField(text, "title", 160);
  const subtitle = harvestStringField(text, "subtitle", 220);
  const whisper = harvestStringField(text, "whisper", 300);
  const explanation = harvestStringField(text, "explanation", 1200);
  const discernment = harvestStringField(text, "discernment", 400);
  const artworkPrompt = harvestStringField(text, "artworkPrompt", 1200);
  const aspectMatch = text.match(/"aspect"\s*:\s*"(wide|tall|square)"/i);

  if (!subject && !artworkPrompt) return null;

  return {
    mode,
    subject,
    title,
    subtitle,
    whisper,
    explanation,
    discernment,
    aspect: aspectMatch ? aspectMatch[1].toLowerCase() : "",
    artworkPrompt,
    panels: harvestPanels(text),
    annotations: harvestAnnotations(text),
    diagramNodes: harvestDiagramNodes(text),
  };
}

export { str };

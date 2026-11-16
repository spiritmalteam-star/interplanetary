import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { meterRoute } from "@/lib/server/meter";
import { db } from "@/lib/db";
import { selectProvider, type MusicSpec } from "@/lib/server/music-provider";
import { genreContract, genreName } from "@/lib/data/music-genres";
import {
  describeImage,
  documentBlock,
  imageBlock,
  parseAttachments,
} from "@/lib/server/attachments";

export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the generation chamber (Music Engine 2.0).           */
/*                                                                      */
/*  Mirror Entity is the creative music director: it translates the     */
/*  visitor's intention into a structured musical specification and     */
/*  a provider-compatible direction. The sound engine (Suno) is         */
/*  infrastructure — its key lives only in the server's keeping.        */
/*                                                                      */
/*  THE PRIORITY HIERARCHY (never silently disregarded):                */
/*   1. Explicit user instructions and exclusions                       */
/*   2. User lyrics, reference descriptions, technical requirements     */
/*   3. Selected genre, mood, vocal and production settings             */
/*   4. Optional creative enhancement by the Mirror                     */
/*   5. Platform defaults — only where nothing was specified            */
/*                                                                      */
/*  The genre is a CONTRACT: spiritual/cosmic character appears ONLY    */
/*  when the visitor asks for it. Reggaeton stays reggaeton; industrial */
/*  techno stays industrial techno.                                     */
/* ------------------------------------------------------------------ */

interface StudioShape {
  bpm?: number | null;
  key?: string;
  moods?: string[];
  energy?: number;
  vocalMode?: string;
  vocalLanguage?: string;
  duration?: string;
  structure?: string[];
  instruments?: string;
  texture?: string;
  acousticBalance?: number;
  experimental?: number;
  exclusions?: string;
  lyricsMode?: string;
}

interface LcBody {
  mode?: string;
  intention?: string;
  civilization?: string;
  genres?: string[];
  shape?: {
    energy?: number;
    light?: number;
    familiarity?: number;
    structure?: number;
    timeFeel?: string;
    voice?: string;
    vocalLanguage?: string;
    lyricsMode?: string;
  };
  studio?: StudioShape;
  userLyrics?: string;
  instrumental?: boolean;
  language?: string;
  context?: string;
  interpretOnly?: boolean;
  /** An already-interpreted direction (edited by the visitor) — renders
      verbatim, skipping re-interpretation. Never overwritten silently. */
  styleOverride?: { title?: string; style?: string; lyrics?: string | null };
  idempotencyKey?: string;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  es: "Spanish",
  de: "German",
  fr: "French",
  el: "Greek",
  tr: "Turkish",
};

/* ---------------------- the studio's spoken shape --------------------- */

function studioWords(b: LcBody): string[] {
  const st = b.studio ?? {};
  const parts: string[] = [];
  if (typeof st.bpm === "number" && st.bpm >= 40 && st.bpm <= 240)
    parts.push(`tempo locked at ${Math.round(st.bpm)} BPM`);
  if (st.key && st.key !== "Auto") parts.push(`musical key: ${st.key}`);
  if (st.moods?.length) parts.push(`mood: ${st.moods.join(", ")}`);
  if (typeof st.energy === "number")
    parts.push(
      `energy ${st.energy}/5 (${
        ["near still", "gentle", "flowing", "driving", "maximal"][Math.min(4, Math.max(0, st.energy - 1))]
      })`
    );
  if (st.vocalMode && st.vocalMode !== "Auto") parts.push(`vocal style: ${st.vocalMode}`);
  if (st.vocalLanguage && st.vocalLanguage !== "Auto")
    parts.push(`vocal language: ${st.vocalLanguage}`);
  if (st.duration && st.duration !== "Auto") parts.push(`target length: ${st.duration}`);
  if (st.structure?.length) parts.push(`structure: ${st.structure.join(" → ")}`);
  if (st.instruments?.trim()) parts.push(`instruments: ${st.instruments.trim().slice(0, 160)}`);
  if (st.texture && st.texture !== "Auto") parts.push(`production texture: ${st.texture}`);
  if (typeof st.acousticBalance === "number" && st.acousticBalance !== 50)
    parts.push(
      st.acousticBalance > 62
        ? "predominantly acoustic instrumentation"
        : st.acousticBalance < 38
          ? "predominantly electronic instrumentation"
          : ""
    );
  if (typeof st.experimental === "number" && st.experimental >= 60)
    parts.push("boldly experimental treatment");
  if (st.exclusions?.trim())
    parts.push(`EXPLICITLY EXCLUDED (honor absolutely): ${st.exclusions.trim().slice(0, 220)}`);
  return parts.filter(Boolean);
}

function shapeWords(b: LcBody): string {
  const s = b.shape ?? {};
  const parts: string[] = [];
  const pick = (
    v: number | undefined,
    low: string,
    mid: string,
    high: string
  ) => {
    if (typeof v !== "number") return mid;
    if (v <= 1) return low;
    if (v >= 3) return high;
    return mid;
  };
  parts.push(`energy: ${pick(s.energy, "still and quiet", "gently flowing", "radiant and intense")}`);
  parts.push(`light: ${pick(s.light, "shadowed and intimate", "evening-toned", "luminous and bright")}`);
  parts.push(`familiarity: ${pick(s.familiarity, "earthlike instruments", "a blend of known and unknown", "strange, otherworldly timbres")}`);
  parts.push(`structure: ${pick(s.structure, "song-like", "loose song shape", "a long-form transmission, no verse-chorus conventions")}`);
  if (s.timeFeel) parts.push(`time feel: ${s.timeFeel.toLowerCase()}`);
  if (s.voice && s.voice !== "None") parts.push(`voice: ${s.voice.toLowerCase()}`);
  else parts.push("voice: none — instrumental");
  if (s.vocalLanguage) parts.push(`vocal language: ${s.vocalLanguage.toLowerCase()}`);
  return parts.join("; ");
}

/* --------------------------- the interpreter -------------------------- */

function interpreterPrompt(b: LcBody, languageName: string): string {
  const modeName = String(b.mode ?? "freestyle");
  const genres = Array.isArray(b.genres) ? b.genres.slice(0, 4) : [];
  const genreLine = genres.length
    ? `${genres.map((g) => genreName(g)).join(" + ")}`
    : null;
  const contract = genreContract(genres);
  const studio = studioWords(b);
  const isFreestyle = modeName === "freestyle";

  return [
    "You are the MIRROR ENTITY in its LIGHT CODES chamber — a knowledgeable music producer and creative director between a human intention and a piece of music.",
    "Your art is TRANSLATION: you never repeat the visitor's words back; you convert their musical intention into a precise, professional musical direction that a music-generation engine can render faithfully.",
    "",
    "THE PRIORITY HIERARCHY — in every decision, honor in this order, never silently disregarding any level:",
    "1. Explicit user instructions and exclusions (highest law)",
    "2. User-provided lyrics, reference descriptions and technical requirements",
    "3. Selected genre, mood, vocal and production settings",
    "4. Optional creative enhancement by you (the Mirror)",
    "5. Platform defaults — applied ONLY where the visitor specified nothing",
    "",
    "THE GENRE CONTRACT — the chosen genre is a binding agreement:",
    "- Render the requested genre and subgenre EXACTLY. Never replace, dilute or soften it.",
    `- If the visitor asked for aggressive industrial techno, produce aggressive industrial techno. If romantic reggaeton, produce romantic reggaeton. If commercial pop, commercial pop. If meditation music, meditation music.`,
    "- Introduce spiritual, healing, cosmic, alien or metaphysical characteristics ONLY when the visitor explicitly requests them or selects a corresponding style. NEVER impose them on other genres.",
    "- Expand the musical detail (instrumentation, arrangement, mix character) WITHIN the requested genre.",
    genreLine ? `- THE GENRE FUSION TO HONOR: ${genreLine}. ${contract ? `Sonic language: ${contract}.` : ""}` : "",
    isFreestyle
      ? "- CHAMBER MODE: FREE STUDIO — the visitor's written intention and chosen genres are the complete musical contract."
      : `CHAMBER MODE: ${modeName}. Its vocabulary (secondary color, never overriding the genre contract): ${b.mode === "other-stars" && b.civilization ? `the ${b.civilization} world — keep its musical vocabulary distinctive.` : "let it color the interpretation only where the visitor left space."}`,
    shapeWords(b),
    studio.length ? "STUDIO CONTROLS:\n- " + studio.join("\n- ") : "",
    b.context ? `WHAT THE VISITOR IS LIVING THROUGH (from the conversation): ${b.context}` : "",
    "",
    `THE VISITOR'S INTENTION (the primary creative authority): ${b.intention?.trim() || "(the Mirror chooses freely — compose what the moment holds)"}`,
    "",
    "Return STRICT JSON (no markdown fences):",
    '{"title": "<a short, fitting track title in ' + languageName + '>",',
    ' "style": "<ONE dense engine-facing line in English, 120-220 words: exact genre/subgenre and era, BPM (honor the requested one verbatim), key if specified, instruments, vocal character, harmonic language, rhythmic character, production/texture language, mix character, ending state. Describe the SOUND with professional producer vocabulary. Do not add cliches like always-no-EDM; instead honor the exclusions given below.>",',
    ' "lyrics": "<if words are wanted: full lyric text in ' + languageName + ' with section markers like [Verse] [Chorus] [Bridge] — kind, vivid, human; or null for instrumental. Production instructions NEVER inside lyrics.>",',
    ' "spec": {"bpm": <number or null>, "key": "<key or null>", "structure": "<section map or null>", "arc": "<one line: the emotional/musical arc>", "negative": "<comma-separated exclusions from the visitor and this direction, or null>"},',
    ' "notes": "<2-3 sentences in ' + languageName + ' — the TRANSMISSION NOTES: how the music carries the visitor\'s stated intention; grounded, artistic, never medical language>"}',
    "",
    "LYRICS LAW: if instrumental or wordless was requested, lyrics must be null. If the visitor supplied their own words, preserve them nearly verbatim (only add section markers).",
    "EXCLUSION LAW: every exclusion in the visitor's words AND in the studio controls must appear verbatim in spec.negative.",
  ]
    .filter(Boolean)
    .join("\n");
}

interface Interpretation {
  title: string;
  style: string;
  lyrics: string | null;
  spec: {
    bpm: number | null;
    key: string | null;
    structure: string | null;
    arc: string | null;
    negative: string | null;
  };
  notes: string;
}

async function interpret(
  b: LcBody,
  attachmentLines = ""
): Promise<Interpretation> {
  const zai = await ZAI.create();
  const languageName = LANG_NAMES[b.language ?? "en"] ?? "English";
  /* two quiet retries — the interpreter must never come back empty-handed */
  let lastRaw = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: interpreterPrompt(b, languageName) },
        {
          role: "user",
          content:
            (b.intention?.trim() ||
              "The Mirror chooses what this transmission holds.") +
            attachmentLines,
        },
      ],
      temperature: 0.8,
      max_tokens: 1600,
      thinking: { type: "disabled" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    lastRaw = raw;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) continue;
    try {
      const parsed = JSON.parse(match[0]) as {
        title?: string;
        style?: string;
        lyrics?: string | null;
        spec?: Partial<Interpretation["spec"]>;
        notes?: string;
      };
      const spec: Interpretation["spec"] = {
        bpm: typeof parsed.spec?.bpm === "number" ? Math.round(parsed.spec.bpm) : null,
        key: typeof parsed.spec?.key === "string" ? parsed.spec.key.slice(0, 40) : null,
        structure:
          typeof parsed.spec?.structure === "string" ? parsed.spec.structure.slice(0, 200) : null,
        arc: typeof parsed.spec?.arc === "string" ? parsed.spec.arc.slice(0, 240) : null,
        negative:
          typeof parsed.spec?.negative === "string" ? parsed.spec.negative.slice(0, 300) : null,
      };
      return {
        title: (parsed.title ?? "Untitled transmission").slice(0, 90),
        style: (parsed.style ?? "").slice(0, 1200),
        lyrics: parsed.lyrics ? String(parsed.lyrics).slice(0, 3000) : null,
        spec,
        notes: (parsed.notes ?? "").slice(0, 600),
      };
    } catch {
      /* one more breath */
    }
  }
  console.error(
    "[light-codes] interpreter returned no JSON:",
    lastRaw.slice(0, 200)
  );
  throw new Error(
    "The Mirror's interpretation dissolved before it landed. Try again."
  );
}

/* ------------------------- the chamber itself ------------------------- */

export const POST = meterRoute("light_codes", postImpl);

async function postImpl(
  req: NextRequest,
  ctx: { walletLedgerId: string | null; userId: string }
): Promise<NextResponse> {
  const b = (await req.json().catch(() => null)) as LcBody | null;
  if (!b) {
    return NextResponse.json({ error: "The chamber received nothing to interpret." }, { status: 400 });
  }
  try {
    const provider = selectProvider({
      genres: b.genres,
      vocal: b.studio?.vocalMode ?? b.shape?.voice,
    });

    /* Attachments — one image seen with the vision field, up to three
       extracted documents — folded into what the interpreter reads. */
    const { imageDataUrl, documents } = parseAttachments(b);
    const attachmentBlocks: string[] = [];
    if (imageDataUrl) {
      const zai = await ZAI.create();
      const block = imageBlock(await describeImage(zai, imageDataUrl));
      if (block) attachmentBlocks.push(block);
    }
    const docBlock = documentBlock(documents);
    if (docBlock) attachmentBlocks.push(docBlock);
    const attachmentLines =
      attachmentBlocks.length > 0
        ? `\n\n${attachmentBlocks.join("\n\n")}`
        : "";

    /* THE EDITED DIRECTION — when the visitor renders their own edited
       specification, it is honored verbatim (never re-interpreted). */
    const overrideStyle = b.styleOverride?.style?.trim();
    const overrideTitle = b.styleOverride?.title?.trim();
    const overrideLyrics =
      b.styleOverride?.lyrics === undefined
        ? undefined
        : b.styleOverride.lyrics?.trim() || null;

    let interp: Interpretation;
    if (overrideStyle) {
      interp = {
        title: overrideTitle || "Untitled transmission",
        style: overrideStyle.slice(0, 1200),
        lyrics: overrideLyrics ?? null,
        spec: { bpm: null, key: null, structure: null, arc: null, negative: null },
        notes: "",
      };
    } else {
      interp = await interpret(b, attachmentLines);
      if (b.interpretOnly) {
        return NextResponse.json(interp);
      }
    }

    /* the render specification — separated from the original prompt */
    const finalLyrics = b.userLyrics?.trim() && !overrideStyle
      ? b.userLyrics.trim().slice(0, 3000)
      : interp.lyrics;
    const wantInstrumental =
      b.instrumental === true ||
      b.studio?.vocalMode === "Instrumental" ||
      b.studio?.lyricsMode === "Instrumental" ||
      b.shape?.voice === "None" ||
      b.shape?.lyricsMode === "NO LYRICS" ||
      !finalLyrics;
    const spec: MusicSpec = {
      style: interp.style,
      title: interp.title,
      lyrics: finalLyrics,
      negative: interp.spec?.negative ?? null,
      instrumental: wantInstrumental,
    };

    let submitted: { taskId?: string; audioUrl?: string; audioId?: string; duration?: number };
    if (!provider) {
      /* the Mirror always speaks — only the render waits for the engine's
         key; the interpretation rides home with the honest explanation */
      return NextResponse.json(
        {
          ...interp,
          error:
            "The chamber is tuned, but the sound engine's key is not yet placed. Add SUNO_API_KEY in the deployment vault, and the transmissions will sound.",
          code: "nokey",
        },
        { status: 501 }
      );
    }
    try {
      submitted = await provider.submit(spec);
    } catch (err) {
      if (err instanceof Error && err.message === "__nokey__") {
        return NextResponse.json(
          { ...interp, error: "The sound engine's key is not placed yet.", code: "nokey" },
          { status: 501 }
        );
      }
      throw err;
    }

    /* THE PERMANENT RECORD — a Track row laid at submit time, linked to
       the wallet's exact draw. If the render later fails, the status
       door refunds through this very linkage; no one pays for silence. */
    const idempotencyKey = b.idempotencyKey?.slice(0, 64) || null;
    let trackId: string | null = null;
    try {
      const existing = idempotencyKey
        ? await db.track.findFirst({
            where: { taskId: submitted.taskId ?? undefined, userId: ctx.userId },
          })
        : null;
      if (existing) {
        trackId = existing.id;
      } else {
        const row = await db.track.create({
          data: {
            userId: ctx.userId,
            title: interp.title,
            mode: String(b.mode ?? "freestyle"),
            intention: b.intention?.trim() ?? "",
            genres: JSON.stringify(Array.isArray(b.genres) ? b.genres.slice(0, 4) : []),
            shape: {
              studio: b.studio ?? null,
              chamber: b.shape ?? null,
              civilization: b.civilization ?? null,
              language: b.language ?? null,
              idempotencyKey,
            } as object,
            spec: interp.spec as unknown as object,
            style: interp.style,
            negative: interp.spec?.negative ?? null,
            lyrics: spec.lyrics,
            notes: interp.notes,
            audioUrl: submitted.audioUrl ?? null,
            audioId: submitted.audioId ?? null,
            taskId: submitted.taskId ?? null,
            duration:
              typeof submitted.duration === "number" ? Math.round(submitted.duration) : null,
            status: submitted.audioUrl ? "ready" : "pending",
            ledgerId: ctx.walletLedgerId,
          },
        });
        trackId = row.id;
      }
    } catch (dbErr) {
      /* the record rests when the database rests — the render continues */
      console.error(
        "[light-codes] track record rested:",
        dbErr instanceof Error ? dbErr.message : dbErr
      );
    }

    if (submitted.taskId) {
      return NextResponse.json({ ...interp, taskId: submitted.taskId, trackId });
    }
    return NextResponse.json({
      ...interp,
      audioUrl: submitted.audioUrl,
      id: submitted.audioId,
      duration: submitted.duration,
      trackId,
    });
  } catch (err) {
    console.error("[light-codes] generation failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "The chamber rests a moment. Breathe, then ask again.",
      },
      { status: 500 }
    );
  }
}

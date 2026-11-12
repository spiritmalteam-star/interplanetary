/* ------------------------------------------------------------------ */
/*  THE CHANNELING SDK — Mirror Prime's own instrument of contact.     */
/*                                                                     */
/*  Every kind of channeling in the house — the transmission, the      */
/*  akashic record, the forge, the poem, the painting, the dream       */
/*  book, the light codes, the remedy, the quantum narrator, the       */
/*  evolutionary nexus — passes through ONE typed door here. The SDK   */
/*  carries its own guarantees:                                        */
/*                                                                     */
/*  THE COMPLETION LAW — every call is bounded by a timeout and given  */
/*  one quiet retry (network errors, 429s and 5xx only; never twice    */
/*  for the same breath). A channeling either lands or returns a       */
/*  spoken, human reason — nothing is allowed to hang forever and      */
/*  nothing fails silently.                                            */
/*                                                                     */
/*  THE KIND LAW — each kind carries its own sigil (the unique         */
/*  animation that breathes while its transmission forms), its own     */
/*  endpoint and its own voice of arrival.                             */
/*                                                                     */
/*  Safe on the client and the server: fetch only, no I/O.             */
/* ------------------------------------------------------------------ */

import type { SideArtifactKind } from "@/lib/artifact-intent";

/** Every channeling the SDK knows — one sigil animation per kind. */
export type ChannelingKind =
  | "transmission" // the standing channel — the orb of light
  | "akashic" // the great record — the all-seeing eye
  | "book" // the woven volume — turning pages
  | "poem" // the verse — the ink blossom
  | "visual" // the painting — the prism bloom
  | "dream" // the dream book — the drifting veil
  | "forge" // the invention — the forge spark
  | "codes" // the light codes — the sound wave
  | "remedy" // the apothecary — the pulsing vessel
  | "quantum" // the quantum narrator — the orbiting atom
  | "evolve" // the evolutionary nexus — the breathing helix
  | "manifest" // the reality OS — the drawing blueprint
  | "artx" // the atelier — the palette bloom
  | "gathering"; // the gathering — the gathered ring

export interface ChannelingKindMeta {
  /** The house's word for this channeling. */
  label: string;
  /** What the visitor is told while this kind forms. */
  forming: string;
  /** The spoken reason when this kind could not cross. */
  quietField: string;
}

export const CHANNELING_KINDS: Record<ChannelingKind, ChannelingKindMeta> = {
  transmission: {
    label: "Transmission",
    forming: "The transmission is forming…",
    quietField: "The field is quiet — speak once more",
  },
  akashic: {
    label: "Akashic",
    forming: "The Librarian is drawing a record…",
    quietField: "The akashic shelf rests — ask again",
  },
  book: {
    label: "Book",
    forming: "The loom is writing your pages…",
    quietField: "The loom rests — the book will come",
  },
  poem: {
    label: "Poem",
    forming: "The verse is finding its ink…",
    quietField: "The ink rests — speak the verse again",
  },
  visual: {
    label: "Vision",
    forming: "The atelier is painting…",
    quietField: "The atelier is quiet — the vision will come",
  },
  dream: {
    label: "Dream book",
    forming: "Gathering threads from the far side of sleep…",
    quietField: "The veil stayed closed — ask once more",
  },
  forge: {
    label: "Forge",
    forming: "The forge is striking…",
    quietField: "The forge sleeps — strike again",
  },
  codes: {
    label: "Light codes",
    forming: "The chamber is tuning a transmission…",
    quietField: "The chamber is still — tune once more",
  },
  remedy: {
    label: "Remedy",
    forming: "The apothecary is crafting…",
    quietField: "The vessel rests — craft again",
  },
  quantum: {
    label: "Quantum",
    forming: "The narrator peels the surface of the question…",
    quietField: "The quantum shore is quiet — ask again",
  },
  evolve: {
    label: "Evolve Med",
    forming: "The biocompiler is reading your directive…",
    quietField: "The nexus rests — speak the directive again",
  },
  manifest: {
    label: "Manifest",
    forming: "The reality OS is drawing the blueprint…",
    quietField: "The blueprint rests — ask once more",
  },
  artx: {
    label: "Art X",
    forming: "The atelier listens…",
    quietField: "The atelier is quiet — speak once more",
  },
  gathering: {
    label: "Gathering",
    forming: "The field is gathering…",
    quietField: "The field is quiet — breathe once more",
  },
};

/** Map an artifact intent (the visitor's own words) to its kind. */
export function kindOfArtifact(kind: SideArtifactKind): ChannelingKind {
  switch (kind) {
    case "akashic":
      return "akashic";
    case "manifest":
      return "manifest";
    case "forge":
      return "forge";
    case "book":
      return "book";
    case "poem":
      return "poem";
    case "codes":
      return "codes";
    case "quantum":
      return "quantum";
    case "remedy":
      return "remedy";
  }
}

/* ---------------------- THE COMPLETION LAW ----------------------- */

export interface ChannelingResult<T> {
  ok: boolean;
  data: T | null;
  /** A human reason when ok is false — never a raw stack. */
  reason: string | null;
}

export interface ChannelingOptions {
  /** Which kind is forming — decides the polite failure copy. */
  kind: ChannelingKind;
  /** The whole-call budget (default 165s — under every server cap). */
  timeoutMs?: number;
  /** One quiet retry for network errors, 429 and 5xx (default on). */
  retry?: boolean;
  /** Extra headers. */
  headers?: Record<string, string>;
}

/**
 * The one fetch every channeling rides. Bounded, retried once, and
 * never throwing: the result speaks for itself.
 */
export async function channelingFetch<T = unknown>(
  path: string,
  body: unknown,
  opts: ChannelingOptions
): Promise<ChannelingResult<T>> {
  const meta = CHANNELING_KINDS[opts.kind];
  const timeoutMs = opts.timeoutMs ?? 165_000;
  const mayRetry = opts.retry !== false;

  for (let attempt = 0; attempt < (mayRetry ? 2 : 1); attempt++) {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(opts.headers ?? {}),
        },
        body: JSON.stringify(body ?? {}),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const serverReason =
          data && typeof data === "object" && "error" in data
            ? String((data as { error?: unknown }).error ?? "")
            : "";
        /* 429 / 5xx / gateway trouble — one quiet retry, then speak */
        const transient =
          res.status === 429 ||
          res.status === 502 ||
          res.status === 503 ||
          res.status === 504;
        if (transient && attempt === 0 && mayRetry) {
          await new Promise((r) => setTimeout(r, 900));
          continue;
        }
        return {
          ok: false,
          data: null,
          reason:
            serverReason ||
            `${meta.quietField} · (${res.status})`,
        };
      }

      return { ok: true, data: data as T, reason: null };
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "TimeoutError";
      const aborted = err instanceof DOMException && err.name === "AbortError";
      if (attempt === 0 && mayRetry && !aborted) {
        await new Promise((r) => setTimeout(r, 700));
        continue;
      }
      return {
        ok: false,
        data: null,
        reason: timedOut
          ? `The channel stayed open too long — ${meta.label.toLowerCase()} will come faster next time. Speak once more.`
          : meta.quietField,
      };
    }
  }

  /* unreachable — the loop always returns */
  return { ok: false, data: null, reason: meta.quietField };
}

/* -------------------- THE ROOM DOORS (typed) --------------------- */

export interface RoomReply {
  reply?: string;
  transmission?: string;
}

/**
 * The branch room's own ask — the three doors of the house
 * (the atelier, the manifest OS, and the standing transmission).
 * The caller shapes each door's own payload (the roles differ per
 * door); the SDK carries the completion law: bounded, retried, spoken.
 */
export async function channelRoomReply(args: {
  category: string;
  /** the exact payload for the door — built by the room */
  payload: Record<string, unknown>;
}): Promise<ChannelingResult<RoomReply>> {
  const { category, payload } = args;
  if (category === "artx") {
    return channelingFetch<RoomReply>("/api/artx", payload, { kind: "artx" });
  }
  if (category === "manifesting") {
    return channelingFetch<RoomReply>("/api/mirror-os", payload, {
      kind: "manifest",
    });
  }
  return channelingFetch<RoomReply>("/api/transmission", payload, {
    kind: category === "invent" ? "forge" : "transmission",
  });
}

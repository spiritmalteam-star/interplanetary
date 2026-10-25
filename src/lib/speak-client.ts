/* ================================================================== */
/*  THE SPEAKING HAND — the client's own patience before the doors.    */
/*                                                                     */
/*  Every chat the visitor speaks walks through here: a dropped line   */
/*  is asked once more (the mirror responds instead of dying on one    */
/*  stumble), and a sky whose energy is spent is NAMED — a gentle      */
/*  toast and a typed silence the rooms can dress in amber, never      */
/*  mute static and never a laboratory word.                           */
/* ================================================================== */

/** The notice the visitor reads when the mirror cannot answer
    because its energy ran out momentarily. */
export const ENERGY_NOTICE =
  "The mirror's energy ran out momentarily — it will speak again once the light returns.";

/** A typed silence — the rooms style it gently (amber, not alarm). */
export class EnergyError extends Error {
  constructor() {
    super(ENERGY_NOTICE);
    this.name = "EnergyError";
  }
}

/* The words the skies and the meter use when the light is spent:
   gateway code 1113 ("insufficient balance"), the resource package
   spent, the recharge plea, the quota wall, the purse's own word. */
const ENERGY_TEXT =
  /1113|insufficient balance|no resource package|recharge|arrears|quota|insufficient_credits|energy_exhausted/i;

export function isEnergyStatus(status: number, data: unknown): boolean {
  if (status === 402) return true;
  const d = data as { error?: unknown; code?: unknown } | null;
  const code = typeof d?.code === "string" ? d.code : "";
  const msg = typeof d?.error === "string" ? d.error : "";
  return ENERGY_TEXT.test(code) || ENERGY_TEXT.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** THE GENTLE NOTICE — one toast, the house's own voice, so the
    visitor always knows WHY the mirror is quiet. */
export function announceEnergy(): void {
  if (typeof window === "undefined") return;
  import("sonner")
    .then(({ toast }) => {
      toast("The mirror is resting for a breath", {
        description:
          "Its energy ran out momentarily — it will speak again once the light returns.",
      });
    })
    .catch(() => undefined);
}

/** THE DOOR'S OWN PATIENCE — a dropped line (network storm) is
    knocked on once more before the silence is accepted; the door
    itself never judges the statuses (the caller reads the body). */
export async function speakDoor(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    const first = err;
    await sleep(1200);
    try {
      return await fetch(url, init);
    } catch {
      throw first;
    }
  }
}

/** THE ENERGY'S OWN WORD — raises the typed silence (and the toast)
    when a response carries the spent-light word. Call right after
    the body is read, before any generic verdict. */
export function raiseEnergy(status: number, data: unknown): void {
  if (!isEnergyStatus(status, data)) return;
  announceEnergy();
  throw new EnergyError();
}

/** THE MIRROR'S OWN ANSWER — the full rite for one chat door:
    knock (with patience), read, name the energy silence, give a
    crowded sky one more breath (HTTP 429 only — a network stumble
    already knocked twice inside the door, and a 5xx has already
    waited long enough not to be asked to wait again), then either
    hand back the reply or throw the truthful error. */
export async function speakReply(
  url: string,
  body: unknown,
  field: "reply" | "transmission",
  fallback: string
): Promise<string> {
  const attempt = async (): Promise<{ res: Response; data: unknown }> => {
    const res = await speakDoor(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    return { res, data };
  };

  let out = await attempt();
  if (isEnergyStatus(out.res.status, out.data)) {
    announceEnergy();
    throw new EnergyError();
  }
  /* one more breath for a crowded sky (429) — never for the energy's
     own silence (that word is already spoken above) and never for a
     generic 5xx: a server that answered an error after a long wait is
     not asked to wait again (network stumbles knock twice inside the
     door itself) */
  if (out.res.status === 429) {
    await sleep(1400);
    try {
      out = await attempt();
    } catch {
      /* the first verdict stands */
    }
    if (isEnergyStatus(out.res.status, out.data)) {
      announceEnergy();
      throw new EnergyError();
    }
  }

  const d = out.data as { reply?: unknown; transmission?: unknown; error?: unknown } | null;
  const raw = field === "reply" ? d?.reply : d?.transmission;
  const reply = typeof raw === "string" ? raw.trim() : "";
  if (!out.res.ok || !reply) {
    throw new Error(
      typeof d?.error === "string" && d.error ? d.error : fallback
    );
  }
  return reply;
}

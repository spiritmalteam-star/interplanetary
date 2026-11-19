import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  M.E. MEMORY — the five domains, with their borders.                */
/*                                                                     */
/*  1 personal · 2 conversation · 3 project · 4 community · 5 public   */
/*                                                                     */
/*  Every row belongs to ONE owner. No function accepts a userId       */
/*  other than the owner's for reading or writing the personal,        */
/*  conversational and project domains — the boundary is structural,   */
/*  not a hope. community and public are read-only placeholders for    */
/*  the future knowledge graph: writing there is refused. Retention:   */
/*  ttl honoured on read; a gentle cap of forty rows per domain.       */
/* ------------------------------------------------------------------ */

export const MEMORY_DOMAINS = [
  "personal",
  "conversation",
  "project",
  "community",
  "public",
] as const;

export type MemoryDomain = (typeof MEMORY_DOMAINS)[number];

const WRITABLE: readonly string[] = ["personal", "conversation", "project"];
const CAP_PER_DOMAIN = 40;

export interface RememberInput {
  domain: string;
  content: string;
  scopeKey?: string | null;
  sourceRef?: string | null;
  weight?: number;
  ttlHours?: number;
}

export async function remember(
  userId: string,
  input: RememberInput
): Promise<{ id: string }> {
  if (!WRITABLE.includes(input.domain)) {
    throw new Error(
      `the ${input.domain} domain is not a personal memory — it is written by its own system, not by recall`
    );
  }
  const content = input.content.trim().slice(0, 2000);
  if (!content) throw new Error("an empty memory is no memory");

  const expiresAt =
    input.ttlHours && input.ttlHours > 0
      ? new Date(Date.now() + input.ttlHours * 3600_000)
      : null;

  const row = await db.memoryItem.create({
    data: {
      userId,
      domain: input.domain,
      scopeKey: input.scopeKey?.slice(0, 120) ?? null,
      content,
      sourceRef: input.sourceRef?.slice(0, 200) ?? null,
      weight: Math.max(1, Math.min(9, Math.trunc(input.weight ?? 1))),
      expiresAt,
    },
  });

  // the cap law — release the oldest when the shelf overflows
  const overflow = await db.memoryItem.findMany({
    where: { userId, domain: input.domain },
    orderBy: [{ weight: "asc" }, { createdAt: "asc" }],
    skip: CAP_PER_DOMAIN,
    select: { id: true },
  });
  if (overflow.length > 0) {
    await db.memoryItem.deleteMany({
      where: { id: { in: overflow.map((r) => r.id) } },
    });
  }
  return { id: row.id };
}

export interface RecallInput {
  domain?: string | null;
  scopeKey?: string | null;
  q?: string | null;
  limit?: number;
}

export interface MemoryRow {
  id: string;
  domain: string;
  scopeKey: string | null;
  content: string;
  weight: number;
  createdAt: Date;
}

export async function recall(
  userId: string,
  input: RecallInput = {}
): Promise<MemoryRow[]> {
  const now = new Date();
  const rows = await db.memoryItem.findMany({
    where: {
      userId, // the ownership law — nothing else enters the query
      ...(input.domain ? { domain: input.domain } : {}),
      ...(input.scopeKey ? { scopeKey: input.scopeKey } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ weight: "desc" }, { createdAt: "desc" }],
    take: Math.min(Math.max(input.limit ?? 20, 1), 20),
  });
  const q = input.q?.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => r.content.toLowerCase().includes(q))
    : rows;
  return filtered.map((r) => ({
    id: r.id,
    domain: r.domain,
    scopeKey: r.scopeKey,
    content: r.content,
    weight: r.weight,
    createdAt: r.createdAt,
  }));
}

export async function forget(
  userId: string,
  selector: { id?: string; domain?: string; scopeKey?: string }
): Promise<number> {
  const result = await db.memoryItem.deleteMany({
    where: {
      userId, // only one's own memory ever burns
      ...(selector.id ? { id: selector.id } : {}),
      ...(selector.domain ? { domain: selector.domain } : {}),
      ...(selector.scopeKey ? { scopeKey: selector.scopeKey } : {}),
    },
  });
  return result.count;
}

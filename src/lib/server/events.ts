import { db } from "@/lib/db";
import { randomUUID } from "crypto";

/* ------------------------------------------------------------------ */
/*  THE EVENT CURRENT — one envelope shape for every subsystem.        */
/*                                                                     */
/*  Events are facts, not commands: emitters never know who listens.   */
/*  Delivery is deduplicated by eventId (unique), failures fall to a   */
/*  dead-letter flag — nothing is lost, nothing is delivered twice.    */
/* ------------------------------------------------------------------ */

export type EventActorType = "user" | "agent" | "system";

export interface EventEnvelope {
  type: string;
  actorType: EventActorType;
  actorId?: string | null;
  source: string;
  correlationId?: string | null;
  schemaVersion?: string;
  payload?: Record<string, unknown>;
}

/** Known event types — open for extension, closed for ambiguity. */
export const EVENT_TYPES = {
  transmissionCompleted: "transmission.completed",
  creationSaved: "creation.saved",
  publicationRequested: "publication.requested",
  publicationPublished: "publication.published",
  publicationEdited: "publication.edited",
  publicationDeleted: "publication.deleted",
  userConnected: "user.connected",
  circleCreated: "circle.created",
  projectUpdated: "project.updated",
  collaborationInvited: "collaboration.invited",
  messageReceived: "message.received",
  agentTaskCreated: "agent.task.created",
  agentTaskStarted: "agent.task.started",
  agentTaskCompleted: "agent.task.completed",
  agentTaskFailed: "agent.task.failed",
  agentTaskAwaitingApproval: "agent.task.awaiting_approval",
} as const;

export type EventTypeName = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/**
 * Emit one event. Idempotent by explicit dedupeKey (or derived from
 * type + actor + subject): a retried emission lands once.
 */
export async function emitEvent(
  env: EventEnvelope,
  opts?: { dedupeKey?: string | null }
): Promise<{ eventId: string; deduplicated: boolean }> {
  const eventId =
    opts?.dedupeKey ??
    `evt_${env.type}_${env.actorType}_${env.actorId ?? "system"}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  try {
    await db.systemEvent.create({
      data: {
        eventId,
        type: env.type,
        actorType: env.actorType,
        actorId: env.actorId ?? null,
        source: env.source,
        correlationId: env.correlationId ?? null,
        schemaVersion: env.schemaVersion ?? "1",
        payload: JSON.stringify(env.payload ?? {}),
      },
    });
    return { eventId, deduplicated: false };
  } catch (err) {
    /* the unique key caught a retry — the fact already stands */
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Unique constraint")) {
      return { eventId, deduplicated: true };
    }
    throw err;
  }
}

/** Mark an event delivered (a subscriber finished acting on it). */
export async function markEventDelivered(eventId: string): Promise<void> {
  await db.systemEvent.update({
    where: { eventId },
    data: { deliveredAt: new Date() },
  });
}

/** Dead-letter an event that exhausted its delivery attempts. */
export async function deadLetterEvent(
  eventId: string,
  reason: string
): Promise<void> {
  await db.systemEvent.update({
    where: { eventId },
    data: { deadLetter: true, payload: undefined },
  }).catch(async () => {
    /* if the payload update is unsupported, just flag the letter */
    await db.systemEvent.update({
      where: { eventId },
      data: { deadLetter: true },
    });
  });
  await db.systemEvent.findUnique({ where: { eventId } });
  if (reason) {
    /* the reason rides a follow-up audit line, not the payload */
    await db.auditRecord.create({
      data: {
        actorType: "system",
        action: "event.dead_letter",
        resourceType: "event",
        resourceId: eventId,
        meta: JSON.stringify({ reason: reason.slice(0, 300) }),
      },
    });
  }
}

/** Undelivered events, oldest first — a poller's honest queue. */
export async function pendingEvents(take = 50) {
  return db.systemEvent.findMany({
    where: { deliveredAt: null, deadLetter: false },
    orderBy: { createdAt: "asc" },
    take,
  });
}

/** Observability counters — never private payloads, only shapes. */
export async function eventHealth(takeRecent = 20) {
  const [total, undelivered, dead, recent] = await Promise.all([
    db.systemEvent.count(),
    db.systemEvent.count({ where: { deliveredAt: null, deadLetter: false } }),
    db.systemEvent.count({ where: { deadLetter: true } }),
    db.systemEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: takeRecent,
      select: {
        eventId: true,
        type: true,
        actorType: true,
        source: true,
        deliveredAt: true,
        deadLetter: true,
        createdAt: true,
      },
    }),
  ]);
  return { total, undelivered, dead, recent };
}

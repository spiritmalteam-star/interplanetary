import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { guardCreation } from "@/lib/server/creation-guard";
import { requestIp as requestIpOf } from "@/lib/server/rate-limit";
import { sharedRateLimit } from "@/lib/server/shared-rate-limit";

/* ------------------------------------------------------------------ */
/*  POST /api/creation/video/clip — THE GENERATIVE CINEMA'S OWN DOOR.  */
/*                                                                     */
/*  Mode B's one honest step: a scene's clip prompt enters, a real     */
/*  film task begins in the house's own sky, and this door polls it    */
/*  within the request's life (the clips are seconds long; the wait    */
/*  is tens of seconds). When the sky is slow the client simply asks   */
/*  again with the same task id — the task itself is the durable       */
/*  thing, the sky's own queue is the worker.                          */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TASKS = new Map<string, string>(); // jobId:sceneId → sky task id
const TASKS_MAX = 60;

/* THE PAID DOOR. A clip spends the house's sky (up to ~100 s per call),
   so: a real account by default (an anonymous cookie can be re-minted
   at will), flood-gates per visitor and per IP, and a tighter ceiling on
   FRESH clips than on polls of a running task. Set
   CREATION_VIDEO_REQUIRES_ACCOUNT=false to let anonymous visitors in
   again (they remain rate limited). */
const REQUIRES_ACCOUNT = process.env.CREATION_VIDEO_REQUIRES_ACCOUNT !== "false";
const FRESH_PER_VISITOR = { limit: 12, windowMs: 60 * 60 * 1000 };
const FRESH_PER_IP = { limit: 40, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const guard = await guardCreation(req, {
    bucket: "creation-clip",
    perVisitor: { limit: 240, windowMs: 10 * 60 * 1000 },
    perIp: { limit: 600, windowMs: 10 * 60 * 1000 },
    requireAccount: REQUIRES_ACCOUNT,
  });
  if (!guard.ok) return guard.res;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return guard.reply(NextResponse.json({ error: "unreadable body" }, { status: 400 }));
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.slice(0, 600).trim() : "";
  if (!prompt) return guard.reply(NextResponse.json({ error: "a clip prompt is needed" }, { status: 400 }));
  const jobId = typeof body.jobId === "string" ? body.jobId.slice(0, 64) : "";
  const sceneId = typeof body.sceneId === "string" ? body.sceneId.slice(0, 16) : "";
  const existingTask = typeof body.taskId === "string" ? body.taskId.slice(0, 80) : "";

  try {
    const zai = await ZAI.create();

    /* a task already rides for this scene — poll it instead of a new one */
    const memoKey = `${guard.userId}:${jobId}:${sceneId}`;
    const taskId = existingTask || TASKS.get(memoKey) || null;
    if (taskId) {
      const result = await zai.async.result.query(taskId);
      if (result.task_status === "SUCCESS") {
        const url =
          result.video_result?.[0]?.url ?? result.video_url ?? result.url ?? result.video ?? null;
        if (url) {
          TASKS.delete(memoKey);
          return guard.reply(NextResponse.json({ status: "ready", url, taskId }));
        }
      }
      if (result.task_status === "FAIL") {
        TASKS.delete(memoKey);
        return guard.reply(NextResponse.json({ status: "failed", taskId }));
      }
      return guard.reply(NextResponse.json({ status: "processing", taskId }));
    }

    /* a fresh clip — count it against the tighter hourly ceilings first */
    const freshIp = await sharedRateLimit("creation-clip-fresh-ip", requestIpOf(req), FRESH_PER_IP);
    const freshUser = await sharedRateLimit("creation-clip-fresh-user", guard.userId, FRESH_PER_VISITOR);
    if (!freshIp.ok || !freshUser.ok) {
      const wait = Math.max(freshIp.retryAfterSec, freshUser.retryAfterSec);
      return guard.reply(
        NextResponse.json(
          { error: "the film studio is resting — too many new clips this hour" },
          { status: 429, headers: { "Retry-After": String(wait) } }
        )
      );
    }

    /* a fresh clip — five seconds, the speed mode, one honest ask */
    const task = await zai.video.generations.create({
      prompt,
      quality: "speed",
      with_audio: false,
      duration: 5,
      fps: 30,
    });
    if (TASKS.size >= TASKS_MAX) {
      const oldest = TASKS.keys().next().value;
      if (oldest) TASKS.delete(oldest);
    }
    TASKS.set(memoKey, task.id);

    /* first poll — often the sky finishes within the request */
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const result = await zai.async.result.query(task.id);
      if (result.task_status === "SUCCESS") {
        const url =
          result.video_result?.[0]?.url ?? result.video_url ?? result.url ?? result.video ?? null;
        if (url) {
          TASKS.delete(memoKey);
          return guard.reply(NextResponse.json({ status: "ready", url, taskId: task.id }));
        }
      }
      if (result.task_status === "FAIL") {
        TASKS.delete(memoKey);
        return guard.reply(NextResponse.json({ status: "failed", taskId: task.id }));
      }
    }
    return guard.reply(NextResponse.json({ status: "processing", taskId: task.id }));
  } catch (err) {
    return guard.reply(
      NextResponse.json(
        { status: "failed", error: err instanceof Error ? err.message.slice(0, 200) : "the sky was silent" },
        { status: 200 }
      )
    );
  }
}

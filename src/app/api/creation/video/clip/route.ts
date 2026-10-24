import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

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

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.slice(0, 600).trim() : "";
  if (!prompt) return NextResponse.json({ error: "a clip prompt is needed" }, { status: 400 });
  const jobId = typeof body.jobId === "string" ? body.jobId.slice(0, 64) : "";
  const sceneId = typeof body.sceneId === "string" ? body.sceneId.slice(0, 16) : "";
  const existingTask = typeof body.taskId === "string" ? body.taskId.slice(0, 80) : "";

  try {
    const zai = await ZAI.create();

    /* a task already rides for this scene — poll it instead of a new one */
    const memoKey = `${jobId}:${sceneId}`;
    const taskId = existingTask || TASKS.get(memoKey) || null;
    if (taskId) {
      const result = await zai.async.result.query(taskId);
      if (result.task_status === "SUCCESS") {
        const url =
          result.video_result?.[0]?.url ?? result.video_url ?? result.url ?? result.video ?? null;
        if (url) {
          TASKS.delete(memoKey);
          return NextResponse.json({ status: "ready", url, taskId });
        }
      }
      if (result.task_status === "FAIL") {
        TASKS.delete(memoKey);
        return NextResponse.json({ status: "failed", taskId });
      }
      return NextResponse.json({ status: "processing", taskId });
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
          return NextResponse.json({ status: "ready", url, taskId: task.id });
        }
      }
      if (result.task_status === "FAIL") {
        TASKS.delete(memoKey);
        return NextResponse.json({ status: "failed", taskId: task.id });
      }
    }
    return NextResponse.json({ status: "processing", taskId: task.id });
  } catch (err) {
    return NextResponse.json(
      { status: "failed", error: err instanceof Error ? err.message.slice(0, 200) : "the sky was silent" },
      { status: 200 }
    );
  }
}

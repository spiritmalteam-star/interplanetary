import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  THE CSP EAR — collects the browser's report-only trial voices.     */
/*                                                                     */
/*  The Content-Security-Policy stands in Report-Only mode (the        */
/*  honest first step of the security directive §23): the page runs    */
/*  untouched, and every resource the future policy WOULD have blocked */
/*  is whispered here instead. The trial's harvest tells the owner     */
/*  exactly which allowances the real policy needs — measured, not     */
/*  guessed.                                                           */
/*                                                                     */
/*  Privacy law (§26): only the report's own structured fields are     */
/*  kept, query strings are stripped from every URL (a ?token= never   */
/*  reaches a log), each field is truncated, and the ear is braked     */
/*  (a per-process ceiling) so no flood can abuse it. No prose, no     */
/*  conversation content, no identifiers beyond what the report gives. */
/* ------------------------------------------------------------------ */

const MAX_BODY_BYTES = 8_192;
const MAX_REPORTS_PER_MINUTE = 120;

/* the ear's own brake — process-local, resets each minute */
let windowStart = Date.now();
let windowCount = 0;

function brakeOpen(): boolean {
  const now = Date.now();
  if (now - windowStart >= 60_000) {
    windowStart = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount <= MAX_REPORTS_PER_MINUTE;
}

/** origin + path only — a report URL never carries its query string */
function cleanUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  try {
    const u = new URL(raw);
    return `${u.origin}${u.pathname}`.slice(0, 200);
  } catch {
    return raw.replace(/[?#].*$/, "").slice(0, 200);
  }
}

function shortText(raw: unknown, max = 120): string {
  if (typeof raw !== "string") return "";
  /* keep the shape, drop anything that could carry a secret */
  return raw.replace(/[A-Za-z0-9_\-]{24,}/g, "[redacted]").slice(0, max);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!brakeOpen()) {
    return new NextResponse(null, { status: 204 });
  }

  const raw = await req.text().catch(() => "");
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  let report: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    report =
      (parsed["csp-report"] as Record<string, unknown> | undefined) ?? parsed;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  console.log(
    JSON.stringify({
      t: new Date().toISOString(),
      kind: "csp_report",
      documentUri: cleanUrl(report["document-uri"]),
      violatedDirective: shortText(report["violated-directive"]),
      effectiveDirective: shortText(report["effective-directive"]),
      blockedUri: cleanUrl(report["blocked-uri"]),
      disposition: shortText(report["disposition"]),
      sourceFile: cleanUrl(report["source-file"]),
      lineNumber:
        typeof report["line-number"] === "number" ? report["line-number"] : null,
      scriptSample: shortText(report["script-sample"], 60),
    })
  );

  return new NextResponse(null, { status: 204 });
}

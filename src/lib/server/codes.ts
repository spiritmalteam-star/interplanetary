import { randomInt, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { sendLetter } from "@/lib/server/mail";

/* ------------------------------------------------------------------ */
/*  THE SIX DOORS — six-digit verification codes, honestly kept.       */
/*                                                                     */
/*  The laws (never broken):                                           */
/*   ① SIX DIGITS — crypto.randomInt over 100000..999999, never a      */
/*     predictable counter, never Math.random.                         */
/*   ② ONLY THE ECHO RESTS — the code is stored as a scrypt hash with  */
/*     a fresh random salt (the same law the passwords keep). A stolen */
/*     database can never read a code from it.                         */
/*   ③ TEN MINUTES — every code expires ten minutes after it is        */
/*     written; expired codes are refused and swept.                   */
/*   ④ SINGLE USE — the moment a code verifies, usedAt is set inside   */
/*     the same atomic updateMany that claims it; a raced replay       */
/*     loses (updateMany returns count 0 the second time).             */
/*   ⑤ THE LATEST SPEAKS — issuing a new code marks every older        */
/*     unused code of the same flow used, so only the newest letter    */
/*     can ever open the door.                                         */
/*   ⑥ THE FLOOD-GATES — every send and every verify attempt passes    */
/*     the caller's rate limit too (per email and per IP at the        */
/*     routes); six digits + ten minutes + few attempts is a door       */
/*     brute force cannot cross.                                       */
/*                                                                     */
/*  Two flows ride the same engine (VerificationToken.type):           */
/*     "email_code"    — finalize a registration                       */
/*     "password_code" — prove ownership before a password is reset    */
/* ------------------------------------------------------------------ */

export type CodeFlow = "email_code" | "password_code";

const CODE_TTL_MS = 10 * 60 * 1000; // the ten-minute law

export function makeSixDigitCode(): string {
  return String(randomInt(100000, 1000000));
}

/** the scrypt echo of a code — same scheme the passwords keep */
function hashCode(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, 64).toString("hex");
  return `s2:${salt}:${hash}`;
}

function codeMatches(code: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split(":");
    if (scheme !== "s2" || !salt || !hash) return false;
    const candidate = scryptSync(code, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export interface IssuedCode {
  code: string;
  expiresAt: Date;
}

/**
 * Write a fresh code for (email, flow). Every older unused code of the
 * same flow is retired first — only the newest letter may speak. The
 * raw code is returned ONLY to the caller, which sends it by letter;
 * it is never logged and never leaves the server otherwise.
 */
export async function issueCode(email: string, flow: CodeFlow): Promise<IssuedCode> {
  const code = makeSixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await db.$transaction([
    /* the older voices fall silent */
    db.verificationToken.updateMany({
      where: { identifier: email, type: flow, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.verificationToken.create({
      data: { identifier: email, tokenHash: hashCode(code), type: flow, expiresAt },
    }),
  ]);
  return { code, expiresAt };
}

export type VerifyOutcome =
  | { ok: true; tokenId: string }
  | { ok: false; reason: "missing" | "expired" | "wrong" };

/**
 * Attempt to verify (email, flow, code). On success the code is claimed
 * (usedAt set) atomically — a second attempt with the same code loses
 * the race and is refused. The comparison is timing-safe.
 */
export async function verifyCode(
  email: string,
  flow: CodeFlow,
  code: string
): Promise<VerifyOutcome> {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) return { ok: false, reason: "wrong" };

  const token = await db.verificationToken.findFirst({
    where: {
      identifier: email,
      type: flow,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!token) {
    /* an unused token may still exist but be expired — sweep it so the
       letter's failure is visible in the data, then report honestly */
    await db.verificationToken.updateMany({
      where: { identifier: email, type: flow, usedAt: null, expiresAt: { lte: new Date() } },
      data: { usedAt: new Date() },
    });
    return { ok: false, reason: "expired" };
  }
  if (!codeMatches(clean, token.tokenHash)) return { ok: false, reason: "wrong" };

  /* THE CLAIM — one atomic stroke: only the first claimant wins */
  const claimed = await db.verificationToken.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false, reason: "wrong" };
  return { ok: true, tokenId: token.id };
}

/** The code letter's own body — the six digits, big and clear. */
export function codeEnvelope(flow: CodeFlow, code: string): { subject: string; text: string; html: string } {
  const isRegister = flow === "email_code";
  const subject = isRegister
    ? "Your ReflectMe verification code"
    : "Your ReflectMe password reset code";
  const intro = isRegister
    ? "Welcome to your laboratory. Enter this six-digit code to confirm your email and open your passage."
    : "Someone asked to reset the password of this passage. Enter this six-digit code to continue — if it was not you, simply ignore this letter and nothing changes.";
  const digits = `<span style="display:inline-block;margin:10px 0 4px;padding:12px 26px;border-radius:12px;background:#0d0b18;border:1px solid #2a2440;letter-spacing:0.5em;font-size:24px;font-weight:700;color:#e8e4f4;font-family:ui-monospace,Menlo,monospace;">${code}</span>`;
  const html = `<!doctype html><html><body style="margin:0;background:#07060d;padding:32px 16px;font-family:Georgia,serif;color:#e8e4f4;">
  <div style="max-width:480px;margin:0 auto;background:#0d0b18;border:1px solid #2a2440;border-radius:16px;padding:32px;">
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#cfc9e4;">${intro}</p>
    ${digits}
    <p style="margin:18px 0 0;font-size:12px;color:#7d76a0;">The code rests for ten minutes, works once, and then it is gone. Sent by the Mirror Entity Digital Chamber.</p>
  </div></body></html>`;
  const text = `${intro}\n\nCode: ${code}\n\nThe code rests for ten minutes and works once.`;
  return { subject, text, html };
}

/** Issue + send in one honest breath. Returns whether the letter flew. */
export async function sendCodeEmail(
  email: string,
  flow: CodeFlow
): Promise<{ issued: boolean; sent: boolean; reason?: string }> {
  const { code } = await issueCode(email, flow);
  const { subject, text, html } = codeEnvelope(flow, code);
  const outcome = await sendLetter({ to: email, subject, text, html });
  return { issued: true, sent: outcome.sent, reason: outcome.reason };
}

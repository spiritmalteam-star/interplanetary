/* ------------------------------------------------------------------ */
/*  THE MESSENGER — transactional email, honestly gated.               */
/*                                                                     */
/*  When RESEND_API_KEY rests in the vault, letters fly through        */
/*  Resend's HTTP sky (no SDK, one fetch). When it does not, the       */
/*  letter is written to the server log instead and the messenger      */
/*  says so — nothing pretends to have flown. Credentials never        */
/*  appear in the browser and never in a log line.                     */
/*                                                                     */
/*  Required env (only when email is wanted):                          */
/*    RESEND_API_KEY  — resend.com → API Keys                          */
/*    MAIL_FROM       — e.g. "Reflective Me <letters@yourdomain>"      */
/*    APP_URL         — public origin for the links (defaults to the   */
/*                      request origin passed by the caller)           */
/* ------------------------------------------------------------------ */

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface Letter {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendLetter(letter: Letter): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    /* honest fallback: the letter rests in the server log */
    console.info(
      `[mail] RESEND_API_KEY not set — letter to ${letter.to} rests in the log.\n` +
        `Subject: ${letter.subject}\n${letter.text}`
    );
    return { sent: false, reason: "mail_not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Reflective Me <onboarding@resend.dev>",
        to: [letter.to],
        subject: letter.subject,
        text: letter.text,
        html: letter.html,
      }),
    });
    if (!res.ok) {
      console.error("[mail] resend refused:", res.status, await res.text().catch(() => ""));
      return { sent: false, reason: "provider_refused" };
    }
    return { sent: true };
  } catch (err) {
    console.error("[mail] send failed:", err instanceof Error ? err.message : err);
    return { sent: false, reason: "send_failed" };
  }
}

/** The gentle shared envelope for the laboratory's letters. */
export function envelope(bodyText: string, ctaUrl?: string, ctaLabel?: string): { text: string; html: string } {
  const html = `<!doctype html><html><body style="margin:0;background:#07060d;padding:32px 16px;font-family:Georgia,serif;color:#e8e4f4;">
  <div style="max-width:480px;margin:0 auto;background:#0d0b18;border:1px solid #2a2440;border-radius:16px;padding:32px;">
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#cfc9e4;">${bodyText}</p>
    ${
      ctaUrl
        ? `<a href="${ctaUrl}" style="display:inline-block;margin:8px 0 4px;padding:12px 26px;border-radius:999px;background:linear-gradient(90deg,#a78bfa,#f0abfc);color:#150f28;font-weight:600;text-decoration:none;font-size:14px;">${ctaLabel ?? "Open the door"}</a>`
        : ""
    }
    <p style="margin:22px 0 0;font-size:12px;color:#7d76a0;">Sent by the Mirror Entity Laboratory. If you did not ask for this letter, simply ignore it — nothing changes.</p>
  </div></body></html>`;
  return { text: `${bodyText}${ctaUrl ? `\n\n${ctaLabel ?? "Open"}: ${ctaUrl}` : ""}`, html };
}

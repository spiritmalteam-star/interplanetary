/* ------------------------------------------------------------------ */
/*  THE PAYPAL PROVIDER — the vault's PayPal door, wrapped honestly.   */
/*  The keys live only in the env vault; the browser never sees one.   */
/*  Three honest verbs: configured, order, capture. Nothing else.      */
/* ------------------------------------------------------------------ */

export function paypalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  );
}

function apiBase(): string {
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

interface TokenVerdict {
  ok: boolean;
  token?: string;
  error?: string;
}

let cachedToken: { token: string; at: number } | null = null;

async function accessToken(): Promise<TokenVerdict> {
  /* the same key breathes for a little under an hour — cache five minutes */
  if (cachedToken && Date.now() - cachedToken.at < 5 * 60 * 1000) {
    return { ok: true, token: cachedToken.token };
  }
  const id = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  try {
    const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, error: `paypal auth rested (${res.status}): ${raw.slice(0, 200)}` };
    }
    const data = JSON.parse(raw) as { access_token?: string };
    if (!data.access_token) {
      return { ok: false, error: "paypal answered without a key" };
    }
    cachedToken = { token: data.access_token, at: Date.now() };
    return { ok: true, token: data.access_token };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "paypal auth failed" };
  }
}

export interface PaypalOrderInput {
  amountCents: number;
  currency: string;
  label: string;
  sku: string;
  localRef: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaypalOrder {
  ok: boolean;
  orderId?: string;
  approveUrl?: string;
  error?: string;
}

export async function createPaypalOrder(
  input: PaypalOrderInput
): Promise<PaypalOrder> {
  const auth = await accessToken();
  if (!auth.ok || !auth.token) {
    return { ok: false, error: auth.error ?? "paypal auth failed" };
  }
  const amount = (input.amountCents / 100).toFixed(2);
  try {
    const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: input.localRef,
            description: input.label.slice(0, 127),
            invoice_id: `me-${input.localRef}`.slice(0, 127),
            amount: {
              currency_code: input.currency.toUpperCase(),
              value: amount,
            },
          },
        ],
        application_context: {
          brand_name: "ReflectMe",
          user_action: "PAY_NOW",
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, error: `paypal order rested (${res.status}): ${raw.slice(0, 200)}` };
    }
    const order = JSON.parse(raw) as {
      id?: string;
      links?: { rel: string; href: string }[];
    };
    const approve = order.links?.find(
      (l) => l.rel === "approve" || l.rel === "payer-action"
    );
    if (!order.id || !approve) {
      return { ok: false, error: "paypal answered without an approval door" };
    }
    return { ok: true, orderId: order.id, approveUrl: approve.href };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "paypal order failed" };
  }
}

export interface PaypalCapture {
  ok: boolean;
  completed?: boolean;
  captureId?: string;
  amountCents?: number;
  error?: string;
}

export async function capturePaypalOrder(
  orderId: string
): Promise<PaypalCapture> {
  const auth = await accessToken();
  if (!auth.ok || !auth.token) {
    return { ok: false, error: auth.error ?? "paypal auth failed" };
  }
  try {
    const res = await fetch(
      `${apiBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const raw = await res.text();
    let body: {
      status?: string;
      purchase_units?: {
        payments?: {
          captures?: { id?: string; status?: string; amount?: { value?: string; currency_code?: string } }[];
        };
      }[];
    } = {};
    try {
      body = JSON.parse(raw);
    } catch {
      /* the raw words stand */
    }
    if (!res.ok) {
      /* an order already captured answers ORDER_ALREADY_CAPTURED —
         that is not a failure, it is the truth arriving twice */
      if (/ALREADY_CAPTURED/i.test(raw)) {
        return { ok: true, completed: true, captureId: orderId };
      }
      if (/INSTRUMENT_DECLINED|PAYER_ACTION_REQUIRED/i.test(raw)) {
        return { ok: false, error: "the payment has not landed yet" };
      }
      return { ok: false, error: `paypal capture rested (${res.status}): ${raw.slice(0, 200)}` };
    }
    const capture = body.purchase_units?.[0]?.payments?.captures?.[0];
    const amountValue = capture?.amount?.value
      ? Math.round(parseFloat(capture.amount.value) * 100)
      : undefined;
    return {
      ok: true,
      completed: body.status === "COMPLETED",
      captureId: capture?.id,
      amountCents: amountValue,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "paypal capture failed" };
  }
}

export async function paypalOrderStatus(
  orderId: string
): Promise<{ ok: boolean; completed?: boolean; error?: string }> {
  const auth = await accessToken();
  if (!auth.ok || !auth.token) {
    return { ok: false, error: auth.error ?? "paypal auth failed" };
  }
  try {
    const res = await fetch(
      `${apiBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );
    if (!res.ok) return { ok: false, error: `paypal read rested (${res.status})` };
    const order = (await res.json()) as { status?: string };
    return { ok: true, completed: order.status === "COMPLETED" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "paypal read failed" };
  }
}

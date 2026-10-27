import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/* ------------------------------------------------------------------ */
/*  THE SECRET BOX — AES-256-GCM at rest for the deposit economy.      */
/*                                                                     */
/*  The keeper's payment sources (Stripe keys, PayPal secrets, custom  */
/*  API credentials) never rest in plain text: encrypt() seals them    */
/*  into { iv, tag, data } hex JSON stored in the PaymentSource row,   */
/*  and decrypt() opens them SERVER-SIDE ONLY. Zero knowledge leaves   */
/*  the server: no response, no log, no client ever sees a byte —      */
/*  every list/GET answers only with the masked hint ("••••1234").     */
/*                                                                     */
/*  THE KEY'S LAW (documented tradeoff):                               */
/*   1. CREDENTIALS_KEY (env, 32+ chars) is the intended passphrase —  */
/*      derived through scrypt (N=16384) with the fixed app salt.      */
/*   2. If it is absent, the key is derived from AUTH_SECRET with the  */
/*      same salt — stable across restarts, so stored ciphertexts      */
/*      keep opening. THE TRADEOFF: rotating AUTH_SECRET (or changing  */
/*      CREDENTIALS_KEY) breaks every stored ciphertext — GCM fails    */
/*      auth on open. This is accepted by design: the fuel desk's UI   */
/*      offers re-entry (delete + re-add a source), and secrets are    */
/*      re-enterable while credit ledgers are not.                     */
/*   3. In development with neither secret set, a fixed dev fallback   */
/*      keeps the desk usable; in production the box refuses to seal   */
/*      with a publicly known key and the route answers honestly.      */
/* ------------------------------------------------------------------ */

const APP_SALT = "reflectme.secret-box.v1"; // fixed app salt — derivation, not secrecy
const DEV_FALLBACK = "mirror-entity-secret-box-dev-key";

let cachedKey: Buffer | null = null;

/** The 32-byte AES key, derived once per warm process. */
function boxKey(): Buffer {
  if (cachedKey) return cachedKey;
  let passphrase =
    (process.env.CREDENTIALS_KEY && process.env.CREDENTIALS_KEY.length >= 32
      ? process.env.CREDENTIALS_KEY
      : null) ??
    (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16
      ? process.env.AUTH_SECRET
      : null);

  if (!passphrase) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "The secret box has no key — set CREDENTIALS_KEY (32+ chars) in the environment vault."
      );
    }
    passphrase = DEV_FALLBACK; // development only — never sealed into production
  }
  cachedKey = scryptSync(passphrase, APP_SALT, 32);
  return cachedKey;
}

/** Seals a plaintext credential string into the storable hex-JSON box. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", boxKey(), iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: data.toString("hex"),
  });
}

/** Opens the box — server-only. A tampered or re-keyed box throws
    (GCM auth failure), it never returns garbage. */
export function decryptSecret(box: string): string {
  const parsed = JSON.parse(box) as { iv: string; tag: string; data: string };
  const decipher = createDecipheriv(
    "aes-256-gcm",
    boxKey(),
    Buffer.from(parsed.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, "hex"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(parsed.data, "hex")),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}

/** The masked shape a stored credential may show: the first value's
    own tail ("••••" + last 4). This string is computed ONCE at
    creation and kept in the row's hint column — the list never
    decrypts anything. */
export function maskHintFromCredentials(credentials: Record<string, string>): string {
  const first = Object.values(credentials).find((v) => typeof v === "string" && v.length >= 4);
  if (!first) return "••••";
  return "••••" + first.slice(-4);
}

/** The credentials' parsed shape guard — every value must be a string,
    every key a short sane name, the whole under a size ceiling. */
export function sanitizeCredentials(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof k !== "string" || k.length === 0 || k.length > 64) return null;
    if (typeof v !== "string" || v.length === 0 || v.length > 2048) return null;
    out[k] = v;
  }
  if (Object.keys(out).length === 0) return null;
  return out;
}

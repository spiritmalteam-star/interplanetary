#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  THE SCHEMA KEEPER — picks the right Prisma schema for the sky.     */
/*                                                                     */
/*  ONE CANONICAL SHAPE, TWO SKINS:                                    */
/*    - prisma/schema.prisma           → the canonical shapes (sqlite   */
/*                                       atelier) — the ONLY file a    */
/*                                       human ever edits;             */
/*    - prisma/schema.postgres.prisma  → the cloud twin (postgresql),  */
/*                                       DERIVED from the canonical    */
/*                                       file right here, every time   */
/*                                       a postgres sky is chosen.     */
/*                                                                     */
/*  Why derived and never hand-kept: the twin once drifted behind the  */
/*  canonical file — the cloud's generated client was left without the */
/*  newer accessors (db.agentRecord === undefined) and every passage   */
/*  that touched them fell with "Cannot read properties of undefined   */
/*  (reading 'upsert')". A derived twin can never drift: the shapes    */
/*  are copied, only the datasource provider is swapped.               */
/*                                                                     */
/*  DATABASE_URL decides: postgres:// / postgresql:// → the postgres   */
/*  twin (refreshed on the spot); anything else → sqlite. The chosen   */
/*  path is printed and handed to Prisma via --schema by the caller.   */
/*                                                                     */
/*  Usage:                                                             */
/*    node scripts/select-schema.mjs                       (prints it) */
/*    PRISMA_SCHEMA=$(node scripts/select-schema.mjs) prisma generate  */
/* ------------------------------------------------------------------ */

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const url = process.env.DATABASE_URL || "";
const isPg = /^postgres(ql)?:\/\//i.test(url.trim());
const canonical = "prisma/schema.prisma";
const twin = "prisma/schema.postgres.prisma";

if (!existsSync(canonical)) {
  console.error(`[select-schema] canonical schema missing: ${canonical}`);
  process.exit(1);
}

if (!isPg) {
  if (!existsSync(canonical)) {
    console.error(`[select-schema] chosen schema missing: ${canonical}`);
    process.exit(1);
  }
  process.stdout.write(canonical);
  process.exit(0);
}

/* THE CLOUD TWIN, DERIVED — the canonical shapes with the datasource
   provider swapped to postgresql. Nothing else may differ. The twin
   is rewritten only when its content would actually change, so a
   read-only checkout never stumbles and a build cache stays warm. */
const TWIN_BANNER = `// ---------------------------------------------------------------------------
// THIS SCHEMA IS THE CLOUD TWIN OF prisma/schema.prisma (sqlite) — GENERATED,
// never hand-edited: scripts/select-schema.mjs derives it from the canonical
// file on every postgres build, so the two can never drift again. Every
// model, every field, every index is the canonical one; only the datasource
// provider below is swapped. (A hand-kept twin once drifted behind the
// canonical shapes and the cloud's client lost its accessors — every passage
// that touched them fell with "Cannot read properties of undefined".)
// ---------------------------------------------------------------------------

`;

try {
  const source = readFileSync(canonical, "utf8");
  const swapped = source.replace(
    /datasource\s+db\s*\{[^}]*\}/,
    `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  );
  if (swapped === source) {
    console.error(
      "[select-schema] the datasource block could not be swapped — the twin would lie. Refusing to hand a false schema to prisma."
    );
    process.exit(1);
  }
  const derived = TWIN_BANNER + swapped;
  const current = existsSync(twin) ? readFileSync(twin, "utf8") : null;
  if (current !== derived) {
    writeFileSync(twin, derived);
    console.error(
      "[select-schema] the cloud twin was refreshed from the canonical schema (drift repaired)."
    );
  }
  process.stdout.write(twin);
} catch (err) {
  console.error(
    "[select-schema] the twin could not be derived:",
    err instanceof Error ? err.message : err
  );
  /* a stale twin is still better than no schema — but it is named loudly */
  if (existsSync(twin)) {
    console.error("[select-schema] falling back to the COMMITTED twin (it may be stale).");
    process.stdout.write(twin);
    process.exit(0);
  }
  process.exit(1);
}

#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  THE SCHEMA KEEPER — picks the right Prisma schema for the sky.     */
/*                                                                     */
/*  The laboratory keeps two schemas of the same shapes:               */
/*    - prisma/schema.prisma          → sqlite (the sandbox atelier)   */
/*    - prisma/schema.postgres.prisma → postgresql (the cloud)         */
/*                                                                     */
/*  DATABASE_URL decides: postgres:// / postgresql:// → the postgres   */
/*  schema; anything else → sqlite. The chosen path is printed and     */
/*  handed to Prisma via --schema by the caller.                       */
/*                                                                     */
/*  Usage:                                                             */
/*    node scripts/select-schema.mjs                       (prints it) */
/*    PRISMA_SCHEMA=$(node scripts/select-schema.mjs) prisma generate  */
/* ------------------------------------------------------------------ */

import { existsSync } from "node:fs";

const url = process.env.DATABASE_URL || "";
const isPg = /^postgres(ql)?:\/\//i.test(url.trim());
const picked = isPg
  ? "prisma/schema.postgres.prisma"
  : "prisma/schema.prisma";

if (!existsSync(picked)) {
  console.error(`[select-schema] chosen schema missing: ${picked}`);
  process.exit(1);
}
process.stdout.write(picked);

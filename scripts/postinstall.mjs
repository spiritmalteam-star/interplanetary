#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  Postinstall: generate the Prisma client from the schema that       */
/*  matches DATABASE_URL (postgres in the cloud, sqlite in the         */
/*  atelier). Never fails the install when the database rests —        */
/*  a missing schema only quiets the client generation.                */
/* ------------------------------------------------------------------ */

import { execSync } from "node:child_process";

try {
  const schema = execSync("node scripts/select-schema.mjs", {
    encoding: "utf8",
  }).trim();
  console.log(`[postinstall] prisma generate --schema ${schema}`);
  execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });
} catch (err) {
  console.warn(
    "[postinstall] prisma generate skipped:",
    err instanceof Error ? err.message : err
  );
}

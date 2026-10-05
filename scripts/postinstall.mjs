#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  Postinstall (the schema-keeper):                                   */
/*  1. generate the Prisma client from the schema that matches         */
/*     DATABASE_URL (postgres in the cloud, sqlite in the atelier);    */
/*  2. push the schema to the database — THE PASSAGE TABLES. Without   */
/*     this step a fresh cloud database holds no User table and every  */
/*     register / sign-in request falls (the laboratory itself keeps   */
/*     answering statelessly, which is why the break stayed hidden).   */
/*  Neither step ever fails the install when the database rests.       */
/* ------------------------------------------------------------------ */

import { execSync } from "node:child_process";

function run(cmd, label) {
  try {
    console.log(`[postinstall] ${label}`);
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch (err) {
    console.warn(
      `[postinstall] ${label} skipped:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

const schema = run("node scripts/select-schema.mjs", "select schema")
  ? execSync("node scripts/select-schema.mjs", { encoding: "utf8" }).trim()
  : null;

if (schema) {
  run(`npx prisma generate --schema ${schema}`, "prisma generate");

  /* the tables — only when a database is actually wired (Vercel sets
     DATABASE_URL in its vault; a local atelier sets it in .env) */
  const hasDb = Boolean(process.env.DATABASE_URL);
  if (hasDb) {
    const dataLossFlag = process.env.DB_PUSH_ACCEPT_DATA_LOSS === "true"
      ? " --accept-data-loss"
      : "";
    run(
      `npx prisma db push --schema ${schema} --skip-generate${dataLossFlag}`,
      "prisma db push (ensure the passage tables)"
    );
  } else {
    console.log(
      "[postinstall] DATABASE_URL not set in this step — db push deferred to runtime"
    );
  }
}

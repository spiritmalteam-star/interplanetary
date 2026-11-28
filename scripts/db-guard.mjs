#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  THE SCHEMA GUARD — replaces `prisma db push --accept-data-loss`.   */
/*                                                                     */
/*  Computes what the live database lacks relative to the schema and   */
/*  applies ONLY additive statements (new tables, columns, indexes).   */
/*  Anything that could remove or rewrite data (DROP, type changes,    */
/*  renames) is NEVER executed — it is listed in the build log for a   */
/*  human to review. Orphaned legacy columns and tables simply stay.   */
/*  A failing statement is logged and skipped; the build never fails   */
/*  because of the database, exactly as before.                        */
/*                                                                     */
/*  Usage: node scripts/db-guard.mjs <schema-path> [--dry-run]         */
/* ------------------------------------------------------------------ */
import { execFileSync } from "node:child_process";
import { plan } from "./db-guard-lib.mjs";

const schema = process.argv[2];
const dry = process.argv.includes("--dry-run");
const url = process.env.DATABASE_URL;
if (!schema || !url) {
  console.log("[db-guard] no schema or DATABASE_URL — nothing to do");
  process.exit(0);
}
const prisma = (args, input) =>
  execFileSync("npx", ["prisma", ...args], { encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"], env: process.env });

let script = "";
try {
  script = prisma(["migrate", "diff", "--from-url", url, "--to-schema-datamodel", schema, "--script"]);
} catch (err) {
  console.warn("[db-guard] could not read the live schema — nothing applied:", String(err.stderr || err.message).slice(0, 300));
  process.exit(0);
}
const { additive, blocked } = plan(script);
console.log(`[db-guard] ${additive.length} additive statement(s), ${blocked.length} blocked (never auto-applied)`);
for (const b of blocked) console.warn("[db-guard] BLOCKED (review by hand):", b.replace(/\s+/g, " ").slice(0, 160));
let applied = 0;
for (const s of additive) {
  if (dry) { console.log("[db-guard] would apply:", s.replace(/\s+/g, " ").slice(0, 120)); continue; }
  try {
    prisma(["db", "execute", "--url", url, "--stdin"], s);
    applied++;
  } catch (err) {
    console.warn("[db-guard] skipped a failing additive statement:", String(err.stderr || err.message).slice(0, 200));
  }
}
console.log(`[db-guard] applied ${applied}/${additive.length}`);

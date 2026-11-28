/* THE SCHEMA GUARD'S JUDGE — pure functions, no I/O.
   Splits a Prisma `migrate diff --script` into statements and sorts
   each one: ADDITIVE (can never remove or rewrite customer data) or
   BLOCKED (anything that could). Blocked statements are never run
   automatically; they are reported for a human to review. */

export function splitStatements(script) {
  const out = [];
  let cur = [];
  for (const line of String(script).split("\n")) {
    if (/^\s*--/.test(line)) continue; // comments (-- CreateTable, warnings)
    cur.push(line);
    if (/;\s*$/.test(line)) {
      const s = cur.join("\n").trim();
      if (s) out.push(s);
      cur = [];
    }
  }
  const rest = cur.join("\n").trim();
  if (rest) out.push(rest);
  return out;
}

const norm = (s) => s.replace(/\s+/g, " ").trim().toUpperCase();

export function classify(statement) {
  const s = norm(statement);
  if (/^CREATE TABLE\b/.test(s)) return "additive";
  if (/^CREATE (UNIQUE )?INDEX\b/.test(s)) return "additive";
  if (/^CREATE TYPE\b/.test(s)) return "additive";
  if (/^ALTER TYPE .* ADD VALUE\b/.test(s)) return "additive";
  if (/^ALTER TABLE .* ADD COLUMN\b/.test(s)) return "additive";
  if (/^ALTER TABLE .* ADD CONSTRAINT\b/.test(s)) return "additive";
  if (/^ALTER TABLE .* ALTER COLUMN .* DROP NOT NULL\b/.test(s)) return "additive";
  return "blocked";
}

/* A multi-clause ALTER (ADD COLUMN ..., DROP COLUMN ...) hides a drop
   behind an additive prefix — anything containing a destructive word
   is blocked whatever it starts with. */
export function judge(statement) {
  const s = norm(statement);
  if (/\b(DROP|TRUNCATE|DELETE|RENAME|USING)\b/.test(s)) return "blocked";
  return classify(statement);
}

export function plan(script) {
  const statements = splitStatements(script);
  return {
    additive: statements.filter((s) => judge(s) === "additive"),
    blocked: statements.filter((s) => judge(s) === "blocked"),
  };
}

// TypeScript ratchet: the set of type errors may only SHRINK. Fails on any error not in the committed baseline,
// and tells you when a baseline entry has been fixed (so the baseline is tightened, never loosened by accident).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const [, , log, baselinePath, mode] = process.argv;
// "file(line,col): error TSxxxx: message" -> key without line numbers, so edits elsewhere in a file don't churn the baseline
const keyOf = (l) => { const m = l.match(/^(?:##\[error\])?(\S+?)\(\d+,\d+\): error (TS\d+): (.{0,120})/); return m ? `${m[1]} ${m[2]} ${m[3]}` : null; };
const now = [...new Set(readFileSync(log, "utf8").split("\n").map(keyOf).filter(Boolean))].sort();
if (mode === "write") { writeFileSync(baselinePath, now.join("\n") + "\n"); console.log(`baseline written: ${now.length}`); process.exit(0); }
const base = existsSync(baselinePath) ? readFileSync(baselinePath, "utf8").split("\n").filter(Boolean) : [];
const fresh = now.filter((k) => !base.includes(k)), fixed = base.filter((k) => !now.includes(k));
console.log(`type errors: ${now.length} now, ${base.length} in baseline`);
if (fixed.length) console.log(`FIXED (remove from baseline):\n  ${fixed.join("\n  ")}`);
if (fresh.length) { console.error(`NEW type errors (not allowed):\n  ${fresh.join("\n  ")}`); process.exit(1); }

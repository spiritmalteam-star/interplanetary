import test from "node:test";
import assert from "node:assert/strict";
import { plan, judge, splitStatements } from "../../scripts/db-guard-lib.mjs";

const SCRIPT = `-- CreateTable
CREATE TABLE "Thing" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Thing_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "GatheringPost" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- DropIndex
DROP INDEX "old_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "legacy";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "x" TEXT, DROP COLUMN "y";

-- CreateIndex
CREATE UNIQUE INDEX "Thing_id_key" ON "Thing"("id");

-- DropTable
DROP TABLE "Orphan";

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amountCents" SET DATA TYPE BIGINT;
`;

test("splits statements and ignores comments", () => {
  assert.equal(splitStatements(SCRIPT).length, 8);
});
test("only additive statements are approved", () => {
  const p = plan(SCRIPT);
  assert.equal(p.additive.length, 3);
  assert.ok(p.additive.every((s) => /^(CREATE|ALTER TABLE "GatheringPost")/.test(s)));
});
test("drops, type changes and hidden drops are blocked", () => {
  const p = plan(SCRIPT);
  assert.equal(p.blocked.length, 5);
  assert.equal(judge('ALTER TABLE "User" ADD COLUMN "x" TEXT, DROP COLUMN "y";'), "blocked");
  assert.equal(judge('ALTER TABLE "Payment" ALTER COLUMN "amountCents" SET DATA TYPE BIGINT;'), "blocked");
  assert.equal(judge('DROP TABLE "Orphan";'), "blocked");
  assert.equal(judge('TRUNCATE "User";'), "blocked");
  assert.equal(judge('DELETE FROM "User";'), "blocked");
});
test("empty diff plans nothing", () => {
  const p = plan("-- This is an empty migration.\n");
  assert.deepEqual(p, { additive: [], blocked: [] });
});

// Seeds a THROWAWAY CI database only (refuses anything that is not a local sqlite file).
import { PrismaClient } from "@prisma/client";
if (!String(process.env.DATABASE_URL || "").startsWith("file:")) { console.error("refusing: not a local sqlite db"); process.exit(2); }
const email = process.argv[2];
const db = new PrismaClient();
const u = await db.user.findUnique({ where: { email } });
if (!u) { console.error("no such user"); process.exit(3); }
const mk = (data) => db.payment.create({ data });
await mk({ userId: u.id, stripeId: "cs_test_a", type: "subscription", amountCents: 2500, status: "complete" });
await mk({ userId: "buyer-two", stripeId: "cs_test_b", type: "credit_pack", amountCents: 1000, status: "complete" });
await mk({ userId: "buyer-three", stripeId: "cs_test_c", type: "credit_pack", amountCents: 5000, status: "open" });
await mk({ userId: u.id, stripeId: "comp_test_d", type: "complimentary", amountCents: 0, status: "complete" });
for (const [ok, lat] of [[true, 400], [true, 600], [false, 1000]])
  await db.usageEvent.create({ data: { userId: u.id, operation: "transmission", provider: "zai", model: "glm-4.6", inputTokens: 100, outputTokens: 200, latencyMs: lat, success: ok } });
await db.creditLedger.create({ data: { userId: u.id, actionType: "CHAT", creditsDeducted: -2, rawCostUsd: 0.5 } });
await db.creditLedger.create({ data: { userId: u.id, actionType: "CHAT", creditsDeducted: -1 } });
console.log("seeded"); await db.$disconnect();

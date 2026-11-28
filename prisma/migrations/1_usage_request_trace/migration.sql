-- additive only: per-request trace columns on UsageEvent
ALTER TABLE "UsageEvent" ADD COLUMN "requestId" TEXT;
ALTER TABLE "UsageEvent" ADD COLUMN "httpStatus" INTEGER;
ALTER TABLE "UsageEvent" ADD COLUMN "attempts" INTEGER;
ALTER TABLE "UsageEvent" ADD COLUMN "fallbackUsed" BOOLEAN;
ALTER TABLE "UsageEvent" ADD COLUMN "requestedModel" TEXT;
ALTER TABLE "UsageEvent" ADD COLUMN "deployment" TEXT;
CREATE INDEX "UsageEvent_requestId_idx" ON "UsageEvent"("requestId");

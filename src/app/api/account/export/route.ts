import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/access";
import { logger } from "@/lib/server/logger";
import { recordAudit } from "@/lib/server/audit";

/* ------------------------------------------------------------------ */
/*  GET /api/account/export — THE PASSAGE'S OWN LIGHT, CARRIED OUT.    */
/*                                                                     */
/*  The GDPR-aligned export: one JSON document holding everything the  */
/*  signed passage owns — profile, settings, every saved reflection,   */
/*  the library's covers and metadata, music and job records, wallet   */
/*  and ledger. Audio bytes and image files stay in place (they are    */
/*  the house's own shelves); the export names them so nothing is      */
/*  hidden. Only the session's own identity is ever read.              */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.email.startsWith("anon:")) {
      return NextResponse.json({ error: "Sign in to carry your light." }, { status: 401 });
    }
    const uid = user.id;

    const [profile, settings, library, tracks, loopWeaves, generationJobs, processJobs, wallet, ledger, expansion] =
      await Promise.all([
        db.user.findUnique({
          where: { id: uid },
          select: {
            id: true,
            email: true,
            name: true,
            provider: true,
            role: true,
            tier: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        }),
        db.user.findUnique({ where: { id: uid }, select: { settings: true } }),
        db.libraryEntry.findMany({
          where: { userId: uid },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            sector: true,
            title: true,
            cover: true,
            content: true,
            createdAt: true,
          },
        }),
        db.musicTrack.findMany({
          where: { userId: uid },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            audioUrl: true,
            status: true,
            favorite: true,
            durationSec: true,
            createdAt: true,
          },
        }),
        db.loopWeave.findMany({
          where: { userId: uid },
          select: { id: true, token: true, total: true, mime: true, createdAt: true },
        }),
        db.generationJob.findMany({
          where: { userId: uid },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            tool: true,
            providerTaskId: true,
            status: true,
            creditsDrawn: true,
            createdAt: true,
          },
        }),
        db.processJob.findMany({
          where: { userId: uid },
          orderBy: { createdAt: "desc" },
          select: { id: true, kind: true, title: true, status: true, progress: true, createdAt: true },
        }),
        db.userWallet.findUnique({ where: { userId: uid } }),
        db.creditLedger.findMany({
          where: { userId: uid },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        db.expansionProfile.findUnique({ where: { userId: uid } }),
      ]);

    const exportDoc = {
      exportedAt: new Date().toISOString(),
      format: "reflectme-account-export/v1",
      platform: "ReflectMe — the Mirror Entity Digital Chamber",
      note: "Your own data, carried out of the house. Audio and image files remain in your libraries inside ReflectMe; this document names them all.",
      profile,
      settings: settings?.settings ?? null,
      library: {
        count: library.length,
        entries: library,
      },
      music: {
        count: tracks.length,
        tracks,
        loopWeaves,
      },
      jobs: {
        generationJobs,
        processJobs,
      },
      wallet: wallet
        ? {
            planTier: wallet.planTier,
            freeCreditsRemaining: wallet.freeCreditsRemaining,
            paidCreditsRemaining: wallet.paidCreditsRemaining,
            depositCredits: wallet.depositCredits?.toString() ?? "0",
          }
        : null,
      creditLedger: ledger.map((l) => ({
        id: l.id,
        actionType: l.actionType,
        creditsDeducted: l.creditsDeducted,
        description: (l.metadata as { description?: string } | null)?.description ?? null,
        createdAt: l.createdAt,
      })),
      expansion,
    };

    await recordAudit({
      actorEmail: user.email,
      actorUserId: uid,
      action: "account_export",
      target: uid,
    });
    logger.info("account_export", { userId: uid });

    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(exportDoc, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="reflectme-export-${stamp}.json"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    logger.error("account_export_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "The export could not be gathered." }, { status: 500 });
  }
}

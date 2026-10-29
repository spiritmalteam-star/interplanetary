"use client";

import { useEffect } from "react";
import { CheckCircle2, Loader2, Store, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  useMarketPublish,
  type MarketKind,
} from "@/lib/market-publish";

/* ------------------------------------------------------------------ */
/*  THE PUBLISH HAND — one small button that stands beside every       */
/*  creation in the house (a finished book, a woven song, a vision,    */
/*  a study). One touch offers the work to the market: the passage is  */
/*  asked first when the visitor walks anonymously, then the Mirror    */
/*  writes its words and the offering goes live — all of it where the  */
/*  visitor stands, never a travel, and cancellable until it hangs.    */
/* ------------------------------------------------------------------ */

export function PublishToMarket({
  kind,
  refId,
  refKind = "library",
  title,
  excerpt,
  cover,
  audioUrl,
  localFile,
  durationSec,
  pages,
  compact = false,
  testId,
}: {
  kind: MarketKind;
  refId: string;
  refKind?: "library" | "music";
  title?: string;
  excerpt?: string;
  cover?: string | null;
  audioUrl?: string | null;
  localFile?: string | null;
  durationSec?: number | null;
  pages?: number | null;
  /** the small dress — a bare round hand for tight rows */
  compact?: boolean;
  testId?: string;
}) {
  const t = useT();
  const listing = useMarketPublish((s) => s.byRef[refId]);
  const loadMine = useMarketPublish((s) => s.loadMine);
  const loaded = useMarketPublish((s) => s.loaded);
  const publish = useMarketPublish((s) => s.publish);
  const cancel = useMarketPublish((s) => s.cancel);

  useEffect(() => {
    if (!loaded) void loadMine();
  }, [loaded, loadMine, refId]);

  const status = listing?.status;

  if (status === "live") {
    return (
      <span
        data-testid={testId ? `${testId}-live` : "publish-live"}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#e9d5ff]"
        style={{
          background: "linear-gradient(120deg, rgba(88,28,135,0.5), rgba(168,85,247,0.32))",
          boxShadow: "inset 0 0 0 1px rgba(216,180,254,0.4)",
        }}
      >
        <CheckCircle2 className="size-3" aria-hidden="true" />
        {t("In the Market")}
      </span>
    );
  }

  if (status === "publishing") {
    return (
      <span
        data-testid={testId ? `${testId}-progress` : "publish-progress"}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c4b5fd]"
        style={{
          background: "rgba(76,29,149,0.28)",
          boxShadow: "inset 0 0 0 1px rgba(196,181,253,0.35)",
        }}
      >
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        {t("Publishing")}
        <button
          type="button"
          onClick={() => listing && void cancel(listing.id)}
          aria-label={t("Cancel the publishing")}
          title={t("Cancel the publishing")}
          data-testid={testId ? `${testId}-cancel` : "publish-cancel"}
          className="focus-glow ml-0.5 rounded-full p-0.5 text-[#c4b5fd] transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-2.5" aria-hidden="true" />
        </button>
      </span>
    );
  }

  /* no listing (or a cancelled one) — the offering hand itself */
  if (compact) {
    return (
      <button
        type="button"
        onClick={() =>
          void publish(kind, refId, refKind, {
            title,
            excerpt,
            cover,
            audioUrl,
            localFile,
            durationSec,
            pages,
          })
        }
        aria-label={t("Publish to Market")}
        title={t("Publish to Market")}
        data-testid={testId ?? "publish-hand"}
        className="focus-glow flex size-7 items-center justify-center rounded-full text-[#e9d5ff] transition-all duration-300 hover:brightness-110"
        style={{
          background: "linear-gradient(120deg, rgba(76,29,149,0.75), rgba(168,85,247,0.55))",
          boxShadow: "inset 0 0 0 1px rgba(216,180,254,0.4)",
        }}
      >
        <Store className="size-3.5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        void publish(kind, refId, refKind, {
          title,
          excerpt,
          cover,
          audioUrl,
          localFile,
          durationSec,
          pages,
        })
      }
      data-testid={testId ?? "publish-hand"}
      className={cn(
        "focus-glow inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#f3e8ff] transition-all duration-300 hover:brightness-110"
      )}
      style={{
        background: "linear-gradient(120deg, #4c1d95, #7e22ce 60%, #a855f7)",
        boxShadow: "0 2px 14px -4px rgba(168,85,247,0.6), inset 0 0 0 1px rgba(216,180,254,0.35)",
      }}
    >
      <Store className="size-3" aria-hidden="true" />
      {t("Publish to Market")}
    </button>
  );
}

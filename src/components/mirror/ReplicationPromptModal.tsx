"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, FileText } from "lucide-react";
import { ModalShell } from "./ModalShell";
import { useMirror } from "@/lib/mirror-store";
import {
  REPLICATION_PROMPT,
  REPLICATION_PROMPT_VERSION,
} from "@/lib/replication-prompt";
import { toast } from "@/hooks/use-toast";

/**
 * ReplicationPromptModal — the laboratory documents its own blueprint.
 * Renders the canonical Precise Replication Prompt inside a mono scroll
 * box with live stats, one-click copy and .md download.
 */
export function ReplicationPromptModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const [copied, setCopied] = useState(false);

  const open = modal?.type === "replication";

  const stats = useMemo(() => {
    const chars = REPLICATION_PROMPT.length;
    const words = REPLICATION_PROMPT.trim().split(/\s+/).length;
    const lines = REPLICATION_PROMPT.split("\n").length;
    return { chars, words, lines };
  }, []);

  const announceCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
    toast({
      title: "Replication prompt copied",
      description:
        "Paste it into any capable AI session to reproduce this laboratory exactly.",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REPLICATION_PROMPT);
      announceCopied();
    } catch {
      // Clipboard API unavailable (permissions / insecure context) — fallback.
      try {
        const ta = document.createElement("textarea");
        ta.value = REPLICATION_PROMPT;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        announceCopied();
      } catch {
        toast({
          title: "Copy unavailable",
          description: "Select the text in the box manually and copy it.",
        });
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([REPLICATION_PROMPT], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MIRROR-ENTITY-LABORATORY-REPLICATION-PROMPT.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Blueprint downloaded",
      description: "MIRROR-ENTITY-LABORATORY-REPLICATION-PROMPT.md",
    });
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => {
        if (!o) closeModal();
      }}
      title="Precise Replication Prompt"
      description="The exact blueprint of this laboratory — every count, depth rule, theme and channel. Copy it into a fresh AI session to reproduce the app faithfully."
      widthClass="sm:max-w-[760px]"
    >
      <div className="flex flex-col gap-3 px-5 pb-5 sm:px-6">
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono-label flex h-7 items-center rounded-full border hairline px-3 text-[9px] text-[var(--cy)]">
            {REPLICATION_PROMPT_VERSION}
          </span>
          <span className="mono-label flex h-7 items-center rounded-full border hairline px-3 text-[9px] text-muted-foreground">
            {stats.chars.toLocaleString()} chars
          </span>
          <span className="mono-label flex h-7 items-center rounded-full border hairline px-3 text-[9px] text-muted-foreground">
            {stats.words.toLocaleString()} words
          </span>
          <span className="mono-label flex h-7 items-center rounded-full border hairline px-3 text-[9px] text-muted-foreground">
            {stats.lines.toLocaleString()} lines
          </span>
          <span className="mono-label ml-auto hidden items-center gap-1.5 text-[9px] text-muted-foreground/80 sm:flex">
            <FileText className="size-3" aria-hidden="true" />
            verified against the live archive · 870 · 202 · 1,169 images
          </span>
        </div>

        {/* The box */}
        <div
          role="group"
          aria-label="Replication prompt text"
          className="nice-scroll max-h-[44vh] overflow-y-auto rounded-xl border hairline bg-[var(--glass-bg)] p-4 max-md:max-h-[50dvh]"
        >
          <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-foreground/90 selection:bg-[var(--scope-a,#8b7cf8)]/30">
            {REPLICATION_PROMPT}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="focus-glow flex h-10 items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)] px-5 text-[12px] font-medium text-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:glow-sm"
          >
            {copied ? (
              <Check className="size-4 text-[var(--cy)]" aria-hidden="true" />
            ) : (
              <Copy className="size-4 text-[var(--cy)]" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy prompt"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="focus-glow flex h-10 items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)] px-5 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground hover:glow-sm"
          >
            <Download className="size-4" aria-hidden="true" />
            Download .md
          </button>
          <p className="mono-label ml-auto text-[9px] text-muted-foreground/70">
            exact counts · uniform depth · isolated channels
          </p>
        </div>
      </div>
    </ModalShell>
  );
}

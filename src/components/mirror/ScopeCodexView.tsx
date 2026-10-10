"use client";

import { motion } from "framer-motion";
import { ArrowDownToLine, BookOpen } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { SCOPE_META, sectionImage } from "@/lib/entity-utils";
import { scopePages } from "@/lib/data/scope-pages";
import type { ScopeDoorway } from "@/lib/data/scope-pages";
import type { Mode } from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  THE SCOPE'S PAGE — the whole domain gathered in one place: every   */
/*  archive, chamber and record of the site that belongs to this       */
/*  scope, with the Mirror inteligjence's own material on each topic.  */
/*  The chat is the primary focus; the page opens at will, and any     */
/*  topic can be taken straight into the channel as a prepared         */
/*  question for the Mirror.                                           */
/* ------------------------------------------------------------------ */

function DoorwayButton({ doorway, label }: { doorway: ScopeDoorway; label: string }) {
  const openRegister = useMirror((s) => s.openRegister);
  const openModal = useMirror((s) => s.openModal);
  const setSidebarTab = useMirror((s) => s.setSidebarTab);
  const t = useT();

  const go = () => {
    switch (doorway) {
      case "register-civilizations":
        openRegister("civilization");
        break;
      case "register-interdimensional":
        openRegister("interdim");
        break;
      case "register-innerearth":
        setSidebarTab("innerearth");
        openRegister("civilization");
        break;
      case "federation":
        openModal({ type: "federation" });
        break;
      case "technology":
        openModal({ type: "technology" });
        break;
      case "astral-jobs":
        openModal({ type: "astral" });
        break;
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      data-testid="codex-doorway"
      className="focus-glow group flex h-10 items-center gap-2.5 rounded-full border px-5 text-[13px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px hover:glow-sm"
      style={{
        borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
        background:
          "linear-gradient(120deg, color-mix(in srgb, var(--scope-a) 14%, transparent), color-mix(in srgb, var(--scope-b) 12%, transparent))",
      }}
    >
      <BookOpen className="size-3.5" aria-hidden="true" />
      {t(label)}
    </button>
  );
}

export function ScopeCodexView() {
  const activeMode = useMirror((s) => s.activeMode) as Mode;
  const setDraft = useMirror((s) => s.setDraft);
  const focusComposer = useMirror((s) => s.focusComposer);
  const closeScopePage = useMirror((s) => s.closeScopePage);
  const t = useT();

  const page = scopePages[activeMode];
  if (!page) return null;
  const meta = SCOPE_META[activeMode];

  /* the topic becomes the channel's prepared question — the chat is
     where every page ultimately leads */
  const takeToChannel = (question: string) => {
    closeScopePage();
    setDraft(question);
    focusComposer();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`${page.pageTitle} — ${meta.label}`}
      data-testid="scope-codex-view"
      className={"scope-" + activeMode + " mx-auto w-full max-w-[880px] px-1 pb-8 pt-6 sm:pt-8"}
    >
      {/* ---------- hero ---------- */}
      <div className="scope-frame-card relative overflow-hidden rounded-[22px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${sectionImage(page.heroImageKey)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage:
              "radial-gradient(ellipse 95% 90% at 50% 20%, black 25%, transparent 82%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 95% 90% at 50% 20%, black 25%, transparent 82%)",
            mixBlendMode: "screen",
          }}
        />
        <span className="scope-corner scope-corner-tl" aria-hidden="true" />
        <span className="scope-corner scope-corner-tr" aria-hidden="true" />
        <span className="scope-corner scope-corner-bl" aria-hidden="true" />
        <span className="scope-corner scope-corner-br" aria-hidden="true" />
        <div
          className="animate-line-breathe h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--scope-a) 30%, var(--scope-b) 70%, transparent)",
          }}
          aria-hidden="true"
        />
        <div className="relative px-6 pb-7 pt-8 text-center sm:px-10 sm:pb-9">
          <p
            className="mono-label text-[10px] uppercase tracking-[0.26em]"
            style={{ color: "color-mix(in srgb, var(--scope-a) 85%, white)" }}
          >
            {t(meta.label)}
          </p>
          <h1
            className="scope-gradient-text scope-glow-text mt-2 font-serif text-[26px] font-semibold leading-tight sm:text-[32px]"
            data-testid="codex-title"
          >
            {t(page.pageTitle)}
          </h1>
          <p className="mono-label mt-2 text-[11px] text-muted-foreground/80">
            {t(page.tagline)}
          </p>
          <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-[1.8] text-foreground/85 sm:text-[15.5px]">
            {t(page.intro)}
          </p>
        </div>
      </div>

      {/* ---------- sections ---------- */}
      {page.sections.map((section, si) => (
        <div key={section.label} className={si === 0 ? "mt-10" : "mt-12"}>
          {/* section header with its own scene */}
          <div
            className="scope-frame-card relative overflow-hidden rounded-[18px]"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage: `url(${sectionImage(section.imageKey)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                maskImage:
                  "linear-gradient(90deg, black 8%, transparent 62%)",
                WebkitMaskImage:
                  "linear-gradient(90deg, black 8%, transparent 62%)",
                mixBlendMode: "screen",
              }}
            />
            <div className="relative flex items-center gap-3 px-5 py-4">
              <span
                className="text-[20px] leading-none"
                aria-hidden="true"
              >
                {section.glyph}
              </span>
              <h2
                className="scope-gradient-text text-[19px] font-semibold tracking-[-0.005em] sm:text-[21px]"
                data-testid="codex-section-label"
              >
                {t(section.label)}
              </h2>
            </div>
          </div>

          <p className="mx-auto mt-3.5 max-w-[680px] px-2 text-[14px] leading-[1.75] text-muted-foreground sm:text-[14.5px]">
            {t(section.intro)}
          </p>

          {section.doorway && section.doorwayLabel && (
            <div className="mt-4 px-2">
              <DoorwayButton
                doorway={section.doorway}
                label={section.doorwayLabel}
              />
            </div>
          )}

          {/* the topics — the Mirror inteligjence's material per theme */}
          <div className="mt-4 grid grid-cols-1 gap-3.5 px-2 md:grid-cols-2">
            {section.topics.map((topic) => (
              <article
                key={topic.title}
                data-testid="codex-topic"
                className="scope-frame-card relative flex flex-col overflow-hidden rounded-[16px] p-5"
              >
                <h3
                  className="scope-gradient-text text-[16px] font-semibold leading-snug"
                  data-testid="codex-topic-title"
                >
                  {t(topic.title)}
                </h3>
                <p className="mt-2 flex-1 text-[14px] leading-[1.75] text-foreground/85">
                  {t(topic.text)}
                </p>
                <button
                  type="button"
                  onClick={() => takeToChannel(topic.question)}
                  data-testid="codex-take-to-channel"
                  className="focus-glow mt-3.5 flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] text-foreground/85 transition-all duration-300 hover:-translate-y-px hover:glow-sm"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a) 34%, transparent)",
                    background:
                      "color-mix(in srgb, var(--scope-a) 9%, transparent)",
                  }}
                >
                  <ArrowDownToLine className="size-3" aria-hidden="true" />
                  {t("Take it to the channel")}
                </button>
              </article>
            ))}
          </div>
        </div>
      ))}

      {/* the page always ends where the Laboratory begins — the channel */}
      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={() => closeScopePage()}
          data-testid="codex-back-to-channel"
          className="focus-glow mx-auto flex h-10 items-center gap-2.5 rounded-full border px-5 text-[13px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 36%, transparent)",
          }}
        >
          {t("Back to the channel")}
        </button>
      </div>
    </motion.section>
  );
}

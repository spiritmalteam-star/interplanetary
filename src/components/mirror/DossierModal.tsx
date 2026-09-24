"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Fingerprint,
  MessageCircleHeart,
  Search,
  Sparkles,
} from "lucide-react";
import { useMirror, findDossier } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { entityImage, groupImage, findEntity } from "@/lib/entity-utils";
import { getEntityProfile } from "@/lib/entity-profile";
import { groupProfiles } from "@/lib/group-profiles";
import { sceneImageFor, sceneImageForDistinct } from "@/lib/profile-visuals";
import {
  distinctChains,
  FactTile,
  ProfileFigure,
  ProfileSection,
} from "./ProfileBits";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";
import type { DossierKind } from "@/lib/mirror-types";

/* ---------------- shared bits ---------------- */

const BATCH = 30;

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "cy" | "pk" | "ok";
}) {
  return (
    <span
      className={cn(
        "mono-label rounded-full border px-2.5 py-1 text-[10.5px]",
        tone === "cy" &&
          "border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] text-[var(--cy)]",
        tone === "pk" &&
          "border-[var(--pk)]/30 bg-[color-mix(in_srgb,var(--pk)_8%,transparent)] text-[var(--pk)]",
        tone === "ok" &&
          "border-[var(--ok)]/30 bg-[color-mix(in_srgb,var(--ok)_8%,transparent)] text-[var(--ok)]",
        tone === "neutral" && "hairline text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- entity (individual) dossier — deep profile ---------------- */

function EntityDossier({
  kind,
  id,
}: {
  kind: DossierKind;
  id: string;
}) {
  const openModal = useMirror((s) => s.openModal);
  const closeModal = useMirror((s) => s.closeModal);
  const askMirror = useMirror((s) => s.askMirror);
  const t = useT();

  const rep = useMemo(() => findEntity(kind, id), [kind, id]);
  const entry = useMemo(
    () => (rep ? findDossier(kind, rep.groupId) : null),
    [rep, kind]
  );
  const profile = useMemo(
    () => (rep ? getEntityProfile(rep, kind) : null),
    [rep, kind]
  );

  if (!entry || !rep || !profile) return null;

  /* the page's three plates — own portrait first, no image ever twice */
  const kinScene = sceneImageFor(rep.id, "kin");
  const milieuScene = sceneImageForDistinct(rep.id, "milieu", [
    kinScene,
    groupImage(kind, entry.id),
  ]);
  const plates = distinctChains([
    [entityImage(rep.id), groupImage(kind, entry.id)],
    [kinScene],
    [milieuScene],
  ]);

  const askQuestion = () => {
    closeModal();
    void askMirror(
      kind === "civilization"
        ? t(
            "Please tell me about {name} (registry {no}, {rank} of the {group}) — their nature, their work, and how they support humanity right now.",
            { name: rep.name, no: profile.archiveNo, rank: profile.rank, group: entry.name }
          )
        : t(
            "Please introduce {name} (registry {no}) of the {group} — what is their presence like, and how can one respectfully connect with their field?",
            { name: rep.name, no: profile.archiveNo, group: entry.name }
          )
    );
  };

  return (
    <>
      <div className="nice-scroll encyc-body max-h-[min(64vh,560px)] space-y-5 overflow-y-auto px-5 pb-4 pt-1 sm:px-6">
        {/* the lead plate — the portrait the whole opening wraps around */}
        <ProfileFigure
          sources={plates[0]}
          alt={t("AI-rendered portrait impression of {name}", { name: rep.name })}
          variant="lead"
          testid="entity-gallery"
        />

        {/* identity — text flowing beside the portrait, like a printed page */}
        <div className="min-w-0">
          <p className="text-[16.5px] font-semibold leading-snug text-foreground/95">
            {rep.name}
          </p>
          <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground/70">
            {profile.archiveNo} · {profile.designation}
          </p>
          <p className="mt-1 text-[14px] italic leading-relaxed text-muted-foreground">
            {profile.rank}
          </p>
          <button
            type="button"
            onClick={() =>
              openModal({ type: "dossier", kind, id: entry.id })
            }
            className="focus-glow mt-2 inline-flex items-center gap-1 rounded-full border hairline px-2.5 py-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            {t("Back to {name}", { name: entry.name })}
          </button>
        </div>

        {/* badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="cy">{rep.density}</Badge>
          <Badge tone="pk">{profile.lifeformClass}</Badge>
          <Badge tone="ok">{t("{n} kin in register", { n: entry.count })}</Badge>
        </div>

        {/* at a glance — the fact console clears the lead plate */}
        <section className="clear-both">
          <h4 className="mono-label text-[10.5px] text-[var(--cy)]">
            {t("At a glance")}
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <FactTile label={t("Homeworld")} value={profile.homeworld} />
            <FactTile label={t("Star system")} value={profile.starSystem} />
            <FactTile label={t("Carrier signal")} value={profile.resonance} mono />
            <FactTile label={t("Alliance standing")} value={profile.alliance} />
            <FactTile label={t("In service since")} value={profile.epoch} />
            <FactTile
              label={t("Service · sessions")}
              value={t("{v} · {n} sessions", {
                v: profile.serviceLength.split(" in ")[0],
                n: profile.sessionsHeld.toLocaleString(),
              })}
              mono
            />
          </div>
        </section>

        {/* the second plate — the kin scene, wrapped by the opening sections */}
        <ProfileFigure
          sources={plates[1]}
          alt={t("AI-rendered scene impression of the {name}", { name: entry.name })}
          side="left"
          testid="entity-gallery-kin"
        />

        <ProfileSection index="01" label={t("Specialty")}>
          <p className="text-[14.5px] font-medium leading-relaxed text-foreground/90">{rep.specialty}</p>
        </ProfileSection>

        <ProfileSection index="02" label={t("Presence & form")}>
          <p className="text-[14.5px] leading-relaxed text-foreground/85">{profile.form}</p>
        </ProfileSection>
        <ProfileSection index="03" label={t("How they communicate")}>
          <p className="text-[14.5px] leading-relaxed text-foreground/85">{profile.modality}</p>
        </ProfileSection>
        <ProfileSection index="04" label={t("Aura impression")}>
          <p className="text-[14.5px] leading-relaxed text-foreground/85">{profile.aura}</p>
        </ProfileSection>

        {/* gifts */}
        <ProfileSection index="05" label={t("Three known gifts")} className="clear-both">
          <div className="grid gap-2">
            {[
              profile.giftPrimary,
              profile.giftSecondary,
              profile.giftTertiary,
            ].map((g, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_5%,transparent)] px-3 py-2"
              >
                <span
                  className="mono-label mt-0.5 shrink-0 text-[10px]"
                  style={{ color: "var(--cy)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[14px] leading-relaxed text-foreground/85">{g}</p>
              </div>
            ))}
          </div>
        </ProfileSection>

        <ProfileSection index="06" label={t("Growth edge — what they mirror in us")}>
          <p className="text-[14.5px] leading-relaxed text-foreground/85">{profile.trial}</p>
        </ProfileSection>
        <ProfileSection index="07" label={t("Current assignment toward Earth")}>
          <p className="text-[14.5px] leading-relaxed text-foreground/85">{profile.mission}</p>
        </ProfileSection>

        {/* the third plate — the milieu, wrapped by what follows */}
        <ProfileFigure
          sources={plates[2]}
          alt={t("The milieu of {name} — an impressionistic scene", { name: entry.name })}
          testid="entity-gallery-milieu"
        />

        {/* teaching */}
        <div
          className="clear-both rounded-xl border p-3.5"
          style={{
            borderColor: "color-mix(in srgb, var(--cy) 25%, transparent)",
            background:
              "color-mix(in srgb, var(--cy) 6%, transparent)",
          }}
        >
          <h4 className="mono-label flex items-center gap-1.5 text-[10px] text-[var(--cy)]">
            <MessageCircleHeart className="size-3" aria-hidden="true" />
            {t("Signature teaching")}
          </h4>
          <p className="mt-2 font-serif text-[15.5px] italic leading-relaxed text-foreground/90">
            “{profile.teaching}”
          </p>
        </div>

        {/* contact */}
        <ProfileSection index="08" label={t("Contact protocol")} className="clear-both">
          <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3.5">
            <p className="text-[14px] leading-relaxed text-foreground/85">
              {profile.contactProtocol}
            </p>
            <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Clock className="size-3 shrink-0" aria-hidden="true" />
              {t("Clearest signal: {v}", { v: profile.contactWindow })}
            </p>
          </div>
        </ProfileSection>

        <ProfileSection index="09" label={t("Seal of correspondence")}>
          <p className="text-[14.5px] leading-relaxed text-foreground/85">{profile.emblem}</p>
        </ProfileSection>

        {/* quote */}
        <blockquote className="clear-both border-l-2 pl-4" style={{ borderColor: "color-mix(in srgb, var(--cy) 45%, transparent)" }}>
          <p className="font-serif text-[16.5px] leading-relaxed text-foreground/90">
            “{profile.quote}”
          </p>
          <footer className="mono-label mt-2 text-[10px] text-muted-foreground">
            {t("— {name}, spoken through the archive", { name: rep.name })}
          </footer>
        </blockquote>

        <div className="clear-both rounded-xl border hairline bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-3.5">
          <h4 className="mono-label text-[10px] text-[var(--gd)]">{t("Context note")}</h4>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
            {t(
              "This dossier reflects channeled tradition and worldbuilding within the Mirror archive. It is offered for reflection and wonder — not as established science."
            )}
          </p>
        </div>
      </div>

      <div className="border-t hairline px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={askQuestion}
          className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2.5 text-[13.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
        >
          <Sparkles className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
          {t("Ask the Mirror about {name}", { name: rep.name })}
        </button>
      </div>
    </>
  );
}

/* ---------------- group dossier — deep + full reveal ---------------- */

function GroupDossierBody({
  kind,
  id,
}: {
  kind: DossierKind;
  id: string;
}) {
  const t = useT();
  const entry = useMemo(() => findDossier(kind, id), [kind, id]);
  const openModal = useMirror((s) => s.openModal);
  const extras = useMemo(
    () => (entry ? groupProfiles[entry.id] : undefined),
    [entry]
  );

  const [visible, setVisible] = useState(BATCH);
  const [filter, setFilter] = useState("");
  const [prevGroupKey, setPrevGroupKey] = useState(`${kind}|${id}`);
  const listRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset reveal state when switching groups — adjusted during render.
  const groupKey = `${kind}|${id}`;
  if (groupKey !== prevGroupKey) {
    setPrevGroupKey(groupKey);
    setVisible(BATCH);
    setFilter("");
  }

  const filteredReps = useMemo(() => {
    if (!entry) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return entry.representatives;
    return entry.representatives.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.specialty.toLowerCase().includes(q)
    );
  }, [entry, filter]);

  // Auto-reveal as the sentinel scrolls into view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) =>
            v < filteredReps.length
              ? Math.min(v + BATCH, filteredReps.length)
              : v
          );
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filteredReps.length]);

  if (!entry) return null;

  const kindLabel =
    kind === "civilization" ? t("Civilization dossier") : t("Interdimensional dossier");
  const extras_ = extras;

  /* the page's three plates — the family portrait leads, no image twice */
  const milieuScene = sceneImageFor(entry.id, "milieu");
  const kinScene = sceneImageForDistinct(entry.id, "kin", [
    milieuScene,
    groupImage(kind, entry.id),
  ]);
  const homelandScene = sceneImageForDistinct(entry.id, "homelands", [
    milieuScene,
    kinScene,
    groupImage(kind, entry.id),
  ]);
  const plates = distinctChains([
    [groupImage(kind, entry.id), milieuScene],
    [kinScene, milieuScene],
    [homelandScene, milieuScene],
  ]);

  return (
    <>
      <div className="nice-scroll encyc-body max-h-[min(62vh,556px)] space-y-5 overflow-y-auto px-5 pb-4 pt-1 sm:px-6">
        <button
          type="button"
          onClick={() => useMirror.getState().closeModal()}
          className="focus-glow group inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          {t("Back to the register")}
        </button>

        {/* the lead plate — the family portrait the opening wraps around */}
        <ProfileFigure
          sources={plates[0]}
          alt={t("AI-rendered scene impression of the {name}", { name: entry.name })}
          variant="lead"
          testid="group-gallery"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="cy">{kindLabel}</Badge>
          <Badge tone="ok">{t("{n} named representatives", { n: entry.count })}</Badge>
          <Badge tone="pk">{entry.range}</Badge>
        </div>

        <ProfileSection index="01" label={t("Essence")}>
          <p className="text-[14.5px] font-medium leading-relaxed text-foreground/90">{entry.essence}</p>
        </ProfileSection>
        <ProfileSection index="02" label={t("Role in human awakening")}>
          <p className="text-[14.5px] leading-relaxed text-foreground/85">{entry.role}</p>
        </ProfileSection>
        <ProfileSection index="03" label={t("Signs of resonance")}>
          <p className="text-[14.5px] leading-relaxed text-foreground/85">{entry.signal}</p>
        </ProfileSection>

        {/* the second plate — the milieu, wrapped by the deep sections */}
        <ProfileFigure
          sources={plates[1]}
          alt={t("The milieu of {name} — an impressionistic scene", { name: entry.name })}
          side="left"
          testid="group-gallery-milieu"
        />

        {/* deep sections */}
        {extras_ && (
          <>
            <div className="h-px w-full bg-gradient-to-r from-[color-mix(in_srgb,var(--cy)_35%,transparent)] to-transparent" />
            <ProfileSection index="04" label={t("Recorded history")}>
              <p className="text-[14.5px] leading-relaxed text-foreground/85">{extras_.history}</p>
            </ProfileSection>
            <ProfileSection index="05" label={t("How their society is organized")}>
              <p className="text-[14.5px] leading-relaxed text-foreground/85">{extras_.structure}</p>
            </ProfileSection>
            <ProfileSection index="06" label={t("Ships, temples & artifacts")}>
              <p className="text-[14.5px] leading-relaxed text-foreground/85">{extras_.artifacts}</p>
            </ProfileSection>

            {/* the third plate — the homelands, wrapped by what follows */}
            <ProfileFigure
              sources={plates[2]}
              alt={t("The homelands of {name} — an impressionistic scene", { name: entry.name })}
              testid="group-gallery-homelands"
            />
            <ProfileSection index="07" label={t("Contact protocol")}>
              <p className="text-[14.5px] leading-relaxed text-foreground/85">{extras_.contactProtocol}</p>
            </ProfileSection>

            <ProfileSection index="08" label={t("Three core teachings")}>
              <ul className="mt-1.5 space-y-1.5">
                {extras_.teachings.map((teaching, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                      style={{ background: "var(--cy)" }}
                      aria-hidden="true"
                    />
                    <span className="font-serif text-[14.5px] italic leading-relaxed text-foreground/85">
                      {teaching}
                    </span>
                  </li>
                ))}
              </ul>
            </ProfileSection>

            <ProfileSection index="09" label={t("Resonant tools & practices")}>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {extras_.resonances.map((r, i) => (
                  <Badge key={i}>{r}</Badge>
                ))}
              </div>
            </ProfileSection>

            <div className="clear-both rounded-xl border hairline bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-3.5">
              <h4 className="mono-label text-[10px] text-[var(--gd)]">
                {t("Discernment note")}
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {extras_.discernment}
              </p>
            </div>
          </>
        )}

        {/* representatives — full reveal */}
        <section className="clear-both">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="mono-label flex items-center gap-1.5 text-[10.5px] text-[var(--cy)]">
              <Fingerprint className="size-3" aria-hidden="true" />
              {t("Named representatives — the full register")}
            </h4>
            <Badge tone="ok">
              {visible >= filteredReps.length
                ? t("all {n} revealed", { n: filteredReps.length })
                : t("{a} of {b} revealed", {
                    a: visible,
                    b: filteredReps.length,
                  })}
            </Badge>
          </div>

          {entry.representatives.length > 36 && (
            <div className="relative mt-2.5">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/70"
                aria-hidden="true"
              />
              <input
                type="search"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setVisible(BATCH);
                }}
                placeholder={t("Filter the {n} names…", { n: entry.count })}
                aria-label={t("Filter named representatives of the {name}", {
                  name: entry.name,
                })}
                className="focus-glow h-8 w-full rounded-lg border hairline bg-transparent pl-8 pr-3 text-[13.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </div>
          )}

          <ul
            ref={listRef}
            className="nice-scroll mt-2 max-h-72 space-y-0.5 overflow-y-auto rounded-xl border hairline p-1.5"
          >
            {filteredReps.slice(0, visible).map((rep) => (
              <li key={rep.id}>
                <button
                  type="button"
                  onClick={() =>
                    openModal({ type: "entity", kind, id: rep.id })
                  }
                  className="focus-glow group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--cy)_8%,transparent)]"
                >
                  <span
                    className="size-7 shrink-0 overflow-hidden rounded-full border hairline"
                    aria-hidden="true"
                  >
                    <img
                      src={entityImage(rep.id)}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-foreground/80 transition-colors group-hover:text-[var(--cy)]">
                      {rep.name}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground/55">
                      {getEntityProfile(rep, kind).archiveNo}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground/60">
                    {rep.density}
                  </span>
                </button>
              </li>
            ))}
            {filteredReps.length === 0 && (
              <li className="px-2 py-3 text-[13px] italic text-muted-foreground">
                {t(
                  "No names match this filter — every one of the {n} exists, try a shorter search.",
                  { n: entry.count }
                )}
              </li>
            )}
            <div ref={sentinelRef} aria-hidden="true" className="h-px" />
          </ul>

          {visible < filteredReps.length && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setVisible((v) => Math.min(v + BATCH, filteredReps.length))
                }
                className="focus-glow rounded-full border hairline px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("Reveal {n} more", {
                  n: Math.min(BATCH, filteredReps.length - visible),
                })}
              </button>
              <button
                type="button"
                onClick={() => setVisible(filteredReps.length)}
                className="focus-glow rounded-full border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-3 py-1.5 text-[12px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
              >
                {t("Reveal all {n}", { n: filteredReps.length })}
              </button>
            </div>
          )}
        </section>

        <div className="clear-both rounded-xl border hairline bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-3.5">
          <h4 className="mono-label text-[10px] text-[var(--gd)]">{t("Context note")}</h4>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
            {t(
              "This dossier reflects channeled tradition and worldbuilding within the Mirror archive. It is offered for reflection and wonder — not as established science."
            )}
          </p>
        </div>
      </div>

      <div className="border-t hairline px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            const q =
              kind === "civilization"
                ? t("Who are the {name}, and how are they supporting humanity right now?", {
                    name: entry.name,
                  })
                : t(
                    "Please introduce the {name} — what is their nature, and how can one respectfully connect with their field?",
                    { name: entry.name }
                  );
            useMirror.getState().closeModal();
            useMirror.getState().askMirror(q);
          }}
          className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2.5 text-[13.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
        >
          <BadgeCheck className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
          {t("Ask the Mirror about the {name}", { name: entry.name })}
        </button>
      </div>
    </>
  );
}

/* ---------------- shell ---------------- */

export function DossierModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();

  const isEntity = modal?.type === "entity";
  const isGroup = modal?.type === "dossier";
  const kind = modal && (isEntity || isGroup) ? modal.kind : null;
  const id = modal && (isEntity || isGroup) ? modal.id : null;

  const groupEntry =
    kind && !isEntity ? findDossier(kind, id as string) : null;
  const open = (isGroup && !!groupEntry) || (isEntity && !!kind && !!id);

  let title = t("Dossier");
  let description: string | undefined;
  if (isGroup && groupEntry) {
    title = groupEntry.name;
    description = groupEntry.origin;
  } else if (isEntity && kind && id) {
    const rep = findEntity(kind, id);
    const p = rep ? getEntityProfile(rep, kind) : null;
    title = rep?.name ?? t("Representative");
    description = p
      ? `${p.archiveNo} · ${p.rank}`
      : t("A named representative of the archive");
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={title}
      description={description}
      widthClass="sm:max-w-[560px]"
    >
      {isEntity && kind && id ? (
        <EntityDossier kind={kind} id={id} />
      ) : isGroup && kind && id ? (
        <GroupDossierBody kind={kind} id={id} />
      ) : null}
    </ModalShell>
  );
}

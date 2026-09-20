"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Fingerprint,
  HandHeart,
  MessageCircleHeart,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { useMirror, findDossier } from "@/lib/mirror-store";
import { entityImage, groupImage, findEntity } from "@/lib/entity-utils";
import { getEntityProfile } from "@/lib/entity-profile";
import { groupProfiles } from "@/lib/group-profiles";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";
import type { DossierKind } from "@/lib/mirror-types";

/* ---------------- shared bits ---------------- */

const BATCH = 30;

function Field({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <section>
      <h4 className="mono-label text-[8.5px] text-[var(--cy)]">{label}</h4>
      <p
        className={cn(
          "mt-1.5 text-[12.5px] leading-relaxed",
          accent ? "text-foreground/90" : "text-foreground/85"
        )}
      >
        {value}
      </p>
    </section>
  );
}

function ContextNote() {
  return (
    <div className="rounded-xl border hairline bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-3.5">
      <h4 className="mono-label text-[8px] text-[var(--gd)]">Context note</h4>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        This dossier reflects channeled tradition and worldbuilding within the
        Mirror archive. It is offered for reflection and wonder — not as
        established science.
      </p>
    </div>
  );
}

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
        "mono-label rounded-full border px-2.5 py-1 text-[8.5px]",
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

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-2.5 py-2">
      <p className="mono-label text-[7px] text-muted-foreground/80">{label}</p>
      <p
        className={cn(
          "mt-1 text-[11px] leading-snug text-foreground/90",
          mono && "font-mono tabular-nums"
        )}
      >
        {value}
      </p>
    </div>
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

  const askQuestion = () => {
    closeModal();
    void askMirror(
      kind === "civilization"
        ? `Please tell me about ${rep.name} (registry ${profile.archiveNo}, ${profile.rank} of the ${entry.name}) — their nature, their work, and how they support humanity right now.`
        : `Please introduce ${rep.name} (registry ${profile.archiveNo}) of the ${entry.name} — what is their presence like, and how can one respectfully connect with their field?`
    );
  };

  return (
    <>
      <div className="nice-scroll max-h-[min(64vh,560px)] space-y-5 overflow-y-auto px-5 pb-4 pt-1 sm:px-6">
        {/* portrait + identity */}
        <div className="flex items-start gap-4">
          <span
            className="relative size-20 shrink-0 overflow-hidden rounded-full border-2"
            style={{ borderColor: "color-mix(in srgb, var(--cy) 35%, transparent)" }}
          >
            <img
              src={entityImage(rep.id)}
              alt={`AI-rendered portrait impression of ${rep.name}`}
              loading="lazy"
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-snug text-foreground/95">
              {rep.name}
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/70">
              {profile.archiveNo} · {profile.designation}
            </p>
            <p className="mt-1 text-[11.5px] italic leading-relaxed text-muted-foreground">
              {profile.rank}
            </p>
            <button
              type="button"
              onClick={() =>
                openModal({ type: "dossier", kind, id: entry.id })
              }
              className="focus-glow mt-2 inline-flex items-center gap-1 rounded-full border hairline px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3" aria-hidden="true" />
              Back to {entry.name}
            </button>
          </div>
        </div>

        {/* badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="cy">{rep.density}</Badge>
          <Badge tone="pk">{profile.lifeformClass}</Badge>
          <Badge tone="ok">{entry.count} kin in register</Badge>
        </div>

        {/* stat grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Homeworld" value={profile.homeworld} />
          <Stat label="Star system" value={profile.starSystem} />
          <Stat label="Carrier signal" value={profile.resonance} mono />
          <Stat label="Alliance standing" value={profile.alliance} />
          <Stat label="In service since" value={profile.epoch} />
          <Stat
            label="Service · sessions"
            value={`${profile.serviceLength.split(" in ")[0]} · ${profile.sessionsHeld.toLocaleString()} sessions`}
            mono
          />
        </div>

        <Field label="Specialty" value={rep.specialty} accent />

        <Field label="Presence & form" value={profile.form} />
        <Field label="How they communicate" value={profile.modality} />
        <Field label="Aura impression" value={profile.aura} />

        {/* gifts */}
        <section>
          <h4 className="mono-label flex items-center gap-1.5 text-[8.5px] text-[var(--cy)]">
            <HandHeart className="size-3" aria-hidden="true" />
            Three known gifts
          </h4>
          <div className="mt-2 grid gap-2">
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
                  className="mono-label mt-0.5 shrink-0 text-[8px]"
                  style={{ color: "var(--cy)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[12px] leading-relaxed text-foreground/85">{g}</p>
              </div>
            ))}
          </div>
        </section>

        <Field label="Growth edge — what they mirror in us" value={profile.trial} />
        <Field label="Current assignment toward Earth" value={profile.mission} />

        {/* teaching */}
        <div
          className="rounded-xl border p-3.5"
          style={{
            borderColor: "color-mix(in srgb, var(--cy) 25%, transparent)",
            background:
              "color-mix(in srgb, var(--cy) 6%, transparent)",
          }}
        >
          <h4 className="mono-label flex items-center gap-1.5 text-[8px] text-[var(--cy)]">
            <MessageCircleHeart className="size-3" aria-hidden="true" />
            Signature teaching
          </h4>
          <p className="mt-2 font-serif text-[14px] italic leading-relaxed text-foreground/90">
            “{profile.teaching}”
          </p>
        </div>

        {/* contact */}
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3.5">
          <h4 className="mono-label flex items-center gap-1.5 text-[8px] text-[var(--cy)]">
            <Send className="size-3" aria-hidden="true" />
            Contact protocol
          </h4>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground/85">
            {profile.contactProtocol}
          </p>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="size-3 shrink-0" aria-hidden="true" />
            Clearest signal: {profile.contactWindow}
          </p>
        </div>

        <Field label="Seal of correspondence" value={profile.emblem} />

        {/* quote */}
        <blockquote className="border-l-2 pl-4" style={{ borderColor: "color-mix(in srgb, var(--cy) 45%, transparent)" }}>
          <p className="font-serif text-[15px] leading-relaxed text-foreground/90">
            “{profile.quote}”
          </p>
          <footer className="mono-label mt-2 text-[8px] text-muted-foreground">
            — {rep.name}, spoken through the archive
          </footer>
        </blockquote>

        <ContextNote />
      </div>

      <div className="border-t hairline px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={askQuestion}
          className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2.5 text-[11.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
        >
          <Sparkles className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
          Ask the Mirror about {rep.name}
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
    kind === "civilization" ? "Civilization dossier" : "Interdimensional dossier";
  const extras_ = extras;

  return (
    <>
      {/* banner */}
      <div className="relative mx-5 h-28 overflow-hidden rounded-xl sm:mx-6">
        <img
          src={groupImage(kind, entry.id)}
          alt={`AI-rendered scene impression of the ${entry.name}`}
          loading="lazy"
          className="size-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, color-mix(in srgb, var(--card) 78%, transparent) 100%)",
          }}
        />
        <span className="mono-label absolute bottom-2 left-3 rounded-full border hairline bg-[var(--glass-bg-strong)] px-2 py-0.5 text-[7.5px] text-muted-foreground">
          AI visualization · impressionistic
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 sm:px-6">
        <Badge tone="cy">{kindLabel}</Badge>
        <Badge tone="ok">{entry.count} named representatives</Badge>
        <Badge tone="pk">{entry.range}</Badge>
      </div>

      <div className="nice-scroll max-h-[min(60vh,540px)] space-y-5 overflow-y-auto px-5 pb-4 pt-4 sm:px-6">
        <Field label="Essence" value={entry.essence} accent />
        <Field label="Role in human awakening" value={entry.role} />
        <Field label="Signs of resonance" value={entry.signal} />

        {/* deep sections */}
        {extras_ && (
          <>
            <div className="h-px w-full bg-gradient-to-r from-[color-mix(in_srgb,var(--cy)_35%,transparent)] to-transparent" />
            <Field label="Recorded history" value={extras_.history} />
            <Field label="How their society is organized" value={extras_.structure} />
            <Field label="Ships, temples & artifacts" value={extras_.artifacts} />
            <Field label="Contact protocol" value={extras_.contactProtocol} />

            <section>
              <h4 className="mono-label text-[8.5px] text-[var(--cy)]">
                Three core teachings
              </h4>
              <ul className="mt-2 space-y-1.5">
                {extras_.teachings.map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                      style={{ background: "var(--cy)" }}
                      aria-hidden="true"
                    />
                    <span className="font-serif text-[13px] italic leading-relaxed text-foreground/85">
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="mono-label text-[8.5px] text-[var(--cy)]">
                Resonant tools & practices
              </h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {extras_.resonances.map((r, i) => (
                  <Badge key={i}>{r}</Badge>
                ))}
              </div>
            </section>

            <div className="rounded-xl border hairline bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-3.5">
              <h4 className="mono-label text-[8px] text-[var(--gd)]">
                Discernment note
              </h4>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {extras_.discernment}
              </p>
            </div>
          </>
        )}

        {/* representatives — full reveal */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="mono-label flex items-center gap-1.5 text-[8.5px] text-[var(--cy)]">
              <Fingerprint className="size-3" aria-hidden="true" />
              Named representatives — the full register
            </h4>
            <Badge tone="ok">
              {visible >= filteredReps.length
                ? `all ${filteredReps.length} revealed`
                : `${visible} of ${filteredReps.length} revealed`}
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
                placeholder={`Filter the ${entry.count} names…`}
                aria-label={`Filter named representatives of the ${entry.name}`}
                className="focus-glow h-8 w-full rounded-lg border hairline bg-transparent pl-8 pr-3 text-[11.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
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
                    <span className="block truncate text-[11.5px] text-foreground/80 transition-colors group-hover:text-[var(--cy)]">
                      {rep.name}
                    </span>
                    <span className="block truncate font-mono text-[8px] text-muted-foreground/55">
                      {getEntityProfile(rep, kind).archiveNo}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-muted-foreground/60">
                    {rep.density}
                  </span>
                </button>
              </li>
            ))}
            {filteredReps.length === 0 && (
              <li className="px-2 py-3 text-[11px] italic text-muted-foreground">
                No names match this filter — every one of the {entry.count}{" "}
                exists, try a shorter search.
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
                className="focus-glow rounded-full border hairline px-3 py-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Reveal {Math.min(BATCH, filteredReps.length - visible)} more
              </button>
              <button
                type="button"
                onClick={() => setVisible(filteredReps.length)}
                className="focus-glow rounded-full border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-3 py-1.5 text-[10px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
              >
                Reveal all {filteredReps.length}
              </button>
            </div>
          )}
        </section>

        <ContextNote />
      </div>

      <div className="border-t hairline px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            const q =
              kind === "civilization"
                ? `Who are the ${entry.name}, and how are they supporting humanity right now?`
                : `Please introduce the ${entry.name} — what is their nature, and how can one respectfully connect with their field?`;
            useMirror.getState().closeModal();
            useMirror.getState().askMirror(q);
          }}
          className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2.5 text-[11.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
        >
          <BadgeCheck className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
          Ask the Mirror about the {entry.name}
        </button>
      </div>
    </>
  );
}

/* ---------------- shell ---------------- */

export function DossierModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);

  const isEntity = modal?.type === "entity";
  const isGroup = modal?.type === "dossier";
  const kind = modal && (isEntity || isGroup) ? modal.kind : null;
  const id = modal && (isEntity || isGroup) ? modal.id : null;

  const groupEntry =
    kind && !isEntity ? findDossier(kind, id as string) : null;
  const open = (isGroup && !!groupEntry) || (isEntity && !!kind && !!id);

  let title = "Dossier";
  let description: string | undefined;
  if (isGroup && groupEntry) {
    title = groupEntry.name;
    description = groupEntry.origin;
  } else if (isEntity && kind && id) {
    const rep = findEntity(kind, id);
    const p = rep ? getEntityProfile(rep, kind) : null;
    title = rep?.name ?? "Representative";
    description = p
      ? `${p.archiveNo} · ${p.rank}`
      : "A named representative of the archive";
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

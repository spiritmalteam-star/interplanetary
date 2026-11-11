"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type MeState,
  GP_HAND,
  GP_INPUT,
  RoomLabel,
  MakerMark,
  netFetch,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE VISITOR'S OWN ROOM — the introduction, the fields of curiosity */
/*  and craft, the quiet counts. Rich profiles without vanity: no      */
/*  entanglement numbers, no ranks — only what a maker chooses to wear.*/
/* ------------------------------------------------------------------ */

export default function ProfileSheet({
  me,
  onSaved,
  onClose,
}: {
  me: MeState | null;
  onSaved: (me: MeState) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(me?.name ?? "");
  const [bio, setBio] = useState(me?.bio ?? "");
  const [interests, setInterests] = useState((me?.interests ?? []).join(", "));
  const [disciplines, setDisciplines] = useState((me?.disciplines ?? []).join(", "));
  const [visibility, setVisibility] = useState<"public" | "private">(
    me?.visibility === "private" ? "private" : "public"
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (me) {
      setName(me.name);
      setBio(me.bio ?? "");
      setInterests(me.interests.join(", "));
      setDisciplines(me.disciplines.join(", "));
    }
  }, [me]);

  const save = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const data = await netFetch<{ me: MeState }>("/api/network/me", {
        method: "PATCH",
        body: {
          name: name.trim() || undefined,
          bio: bio.trim() || undefined,
          interests: interests.trim() || undefined,
          disciplines: disciplines.trim() || undefined,
          visibility,
        },
      });
      onSaved(data.me);
      setNote(t("The introduction rests as it was written."));
    } catch (err) {
      setNote(err instanceof Error ? err.message : t("The introduction could not be written."));
    } finally {
      setBusy(false);
    }
  }, [busy, name, bio, interests, disciplines, visibility, onSaved, t]);

  return (
    <div className="flex h-full flex-col px-3 pb-6 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto w-full max-w-[640px]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Keep shaping")}
          className="focus-glow flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-3.5 py-2 text-[12px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        >
          ← {t("The Gathering")}
        </button>
      </div>

      <div className="gp-scroll mx-auto w-full max-w-[640px] flex-1 overflow-y-auto pb-16 pt-4">
        <div className="gp-card rounded-[26px] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <MakerMark name={me?.name ?? "·"} size={44} />
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-cinzel)] text-[16px] font-semibold text-[#3d3428]">
                {me?.name ?? "…"}
              </p>
              <p className="text-[11px] text-[#a2947c]">
                {me
                  ? `${me.counts.posts} ${t("offerings")} · ${me.counts.circles} ${t("circles")} · ${me.counts.projects} ${t("works together")} · ${me.counts.connections} ${t("connections")}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <RoomLabel>{t("The name you wear here")}</RoomLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              aria-label={t("The name you wear here")}
              data-testid="profile-name"
              className={cn(GP_INPUT, "mt-2")}
            />
            <RoomLabel>{t("Your introduction")}</RoomLabel>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder={t("A few honest words about who you are and what moves you…")}
              aria-label={t("Your introduction")}
              data-testid="profile-bio"
              className={cn(GP_INPUT, "gp-scroll mt-2 resize-none")}
            />
            <RoomLabel>{t("Fields of curiosity")}</RoomLabel>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              maxLength={300}
              placeholder={t("consciousness, astronomy, old maps… (comma-separated)")}
              aria-label={t("Fields of curiosity")}
              data-testid="profile-interests"
              className={cn(GP_INPUT, "mt-2")}
            />
            <RoomLabel>{t("Creative disciplines")}</RoomLabel>
            <input
              value={disciplines}
              onChange={(e) => setDisciplines(e.target.value)}
              maxLength={300}
              placeholder={t("poetry, watercolor, synthesis… (comma-separated)")}
              aria-label={t("Creative disciplines")}
              data-testid="profile-disciplines"
              className={cn(GP_INPUT, "mt-2")}
            />

            <RoomLabel>{t("Who may read your introduction")}</RoomLabel>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                aria-pressed={visibility === "public"}
                className={cn(
                  "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                  visibility === "public"
                    ? "border-[#cbb98d] bg-white text-[#5c5344]"
                    : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                )}
              >
                {t("Everyone in the network")}
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                aria-pressed={visibility === "private"}
                className={cn(
                  "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                  visibility === "private"
                    ? "border-[#cbb98d] bg-white text-[#5c5344]"
                    : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                )}
              >
                {t("Only circles I keep")}
              </button>
            </div>

            {note && (
              <p className="mt-3 text-center text-[12px] italic text-[#8a6f46]" role="status">
                {note}
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy || (name.trim().length > 0 && name.trim().length < 2)}
                className={GP_HAND}
                data-testid="profile-save"
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("Keep this introduction")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

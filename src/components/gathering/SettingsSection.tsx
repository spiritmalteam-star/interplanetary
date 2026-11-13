"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, BellRing, Eye, Loader2, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type MeState,
  type NetworkPrefsState,
  GP_CARD,
  GP_GHOST,
  RoomLabel,
  MakerMark,
  netFetch,
  relativeTime,
  useFlashNote,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  SETTINGS — how the gathering reaches the visitor, and where its    */
/*  doors stand. The bell's own manners, the introduction's visibility, */
/*  the quiet walls, and two honest lines about the data: nothing      */
/*  hidden, nothing exaggerated.                                       */
/* ------------------------------------------------------------------ */

interface BlockedRow {
  id: string;
  name: string;
  since: string;
}

const PREF_ROWS: Array<{ key: keyof NetworkPrefsState; label: string }> = [
  { key: "resonance", label: "Resonances on your work" },
  { key: "echoes", label: "Echoes and replies" },
  { key: "connections", label: "Introductions and follows" },
  { key: "library", label: "Community updates" },
];

const DEFAULT_PREFS: NetworkPrefsState = {
  resonance: true,
  echoes: true,
  connections: true,
  library: true,
};

export default function SettingsSection({
  active,
  me,
  onSaved,
}: {
  active: boolean;
  me: MeState | null;
  onSaved: (me: MeState) => void;
}) {
  const t = useT();
  const bellNote = useFlashNote();
  const wallsNote = useFlashNote();

  /* the bell — local manners, kept true with the server on every hand */
  const [prefs, setPrefs] = useState<NetworkPrefsState>(me?.prefs ?? DEFAULT_PREFS);
  const [prefsBusy, setPrefsBusy] = useState(false);

  /* visibility */
  const [vis, setVis] = useState<"public" | "private">(
    me?.visibility === "private" ? "private" : "public"
  );
  const [visBusy, setVisBusy] = useState(false);

  /* the quiet walls */
  const [blocked, setBlocked] = useState<BlockedRow[] | null>(null);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    setPrefs(me.prefs ?? DEFAULT_PREFS);
    setVis(me.visibility === "private" ? "private" : "public");
  }, [me]);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    (async () => {
      setBlockedLoading(true);
      try {
        const data = await netFetch<{ blocked: BlockedRow[] }>("/api/network/safety");
        if (!alive) return;
        setBlocked(data.blocked);
        setBlockedError(null);
      } catch (err) {
        if (alive)
          setBlockedError(err instanceof Error ? err.message : t("The walls could not be read."));
      } finally {
        if (alive) setBlockedLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, t]);

  const setPref = useCallback(
    async (key: keyof NetworkPrefsState) => {
      const merged: NetworkPrefsState = { ...prefs, [key]: !prefs[key] };
      setPrefs(merged);
      setPrefsBusy(true);
      try {
        const data = await netFetch<{ me: MeState }>("/api/network/me", {
          method: "PATCH",
          body: { prefs: merged },
        });
        onSaved(data.me);
        bellNote.flash(t("The bell retunes itself."));
      } catch (err) {
        setPrefs(prefs); /* the old manner stands */
        bellNote.flash(err instanceof Error ? err.message : t("The bell could not be retuned."));
      } finally {
        setPrefsBusy(false);
      }
    },
    [bellNote, onSaved, prefs, t]
  );

  const changeVis = useCallback(
    async (next: "public" | "private") => {
      if (next === vis || visBusy) return;
      const prev = vis;
      setVis(next);
      setVisBusy(true);
      try {
        const data = await netFetch<{ me: MeState }>("/api/network/me", {
          method: "PATCH",
          body: { visibility: next },
        });
        onSaved(data.me);
      } catch (err) {
        setVis(prev); /* the old door stands */
        bellNote.flash(err instanceof Error ? err.message : t("The door could not be turned."));
      } finally {
        setVisBusy(false);
      }
    },
    [bellNote, onSaved, vis, visBusy]
  );

  const unblock = useCallback(
    async (id: string) => {
      setUnblockingId(id);
      try {
        const data = await netFetch<{ blocked: BlockedRow[] }>("/api/network/safety", {
          method: "POST",
          body: { action: "unblock", userId: id },
        });
        setBlocked(data.blocked);
        wallsNote.flash(t("The wall opens — the door stands quiet again."));
      } catch (err) {
        wallsNote.flash(err instanceof Error ? err.message : t("The wall could not be opened."));
      } finally {
        setUnblockingId(null);
      }
    },
    [wallsNote, t]
  );

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain pb-24">
      <div className="mx-auto max-w-[860px] px-4 pt-4 sm:px-6 sm:pt-6">
        <RoomLabel>{t("the gathering · settings")}</RoomLabel>
        <h2 className="mt-1.5 font-[family-name:var(--font-cinzel)] text-[20px] font-semibold text-[#3d3428]">
          {t("Settings")}
        </h2>
        <p className="mt-2 max-w-[640px] font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#8a7c64]">
          {t("How the gathering reaches you — and where its doors stand.")}
        </p>

        {/* ---------- block 1 · the bell ---------- */}
        <div className={cn(GP_CARD, "mt-5 p-5")} data-testid="gath-setting-bell">
          <div className="flex items-center gap-2">
            <BellRing className="size-4 text-[#a16207]" aria-hidden="true" />
            <RoomLabel>{t("The bell")}</RoomLabel>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {PREF_ROWS.map((row) => {
              const on = prefs[row.key];
              return (
                <button
                  key={row.key}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => void setPref(row.key)}
                  disabled={prefsBusy}
                  data-testid={`gath-setting-pref-${row.key}`}
                  className="focus-glow flex items-center gap-3 rounded-[16px] border border-[#e8dfc9] bg-white px-4 py-3 text-left transition-colors duration-300 hover:border-[#d3c39c] disabled:opacity-55"
                >
                  <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-[#3d3428]">
                    {t(row.label)}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-6 w-10 shrink-0 items-center rounded-full px-0.5 transition-colors duration-300",
                      on ? "bg-[#a16207]" : "bg-[#e4d9bd]"
                    )}
                  >
                    <span
                      className={cn(
                        "size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(122,103,70,0.45)] transition-transform duration-300",
                        on ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          {bellNote.note && (
            <p className="mt-2.5 text-[12px] italic text-[#8a6f46]" role="status">
              {bellNote.note}
            </p>
          )}
        </div>

        {/* ---------- block 2 · visibility ---------- */}
        <div className={cn(GP_CARD, "mt-4 p-5")} data-testid="gath-setting-visibility">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-[#7c5cad]" aria-hidden="true" />
            <RoomLabel>{t("Visibility")}</RoomLabel>
            {visBusy && <Loader2 className="size-3.5 animate-spin text-[#a2947c]" aria-hidden="true" />}
          </div>
          <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label={t("Visibility")}>
            <button
              type="button"
              role="radio"
              aria-checked={vis === "public"}
              onClick={() => void changeVis("public")}
              disabled={visBusy}
              data-testid="gath-setting-vis-public"
              className={cn(
                "focus-glow flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left text-[12.5px] font-semibold transition-colors duration-300 disabled:opacity-55",
                vis === "public"
                  ? "border-[#cbb98d] bg-white text-[#3d3428]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                  vis === "public" ? "border-[#a16207]" : "border-[#d3c39c]"
                )}
              >
                {vis === "public" && <span className="size-2 rounded-full bg-[#a16207]" />}
              </span>
              {t("Public — your introduction can be discovered")}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={vis === "private"}
              onClick={() => void changeVis("private")}
              disabled={visBusy}
              data-testid="gath-setting-vis-private"
              className={cn(
                "focus-glow flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left text-[12.5px] font-semibold transition-colors duration-300 disabled:opacity-55",
                vis === "private"
                  ? "border-[#cbb98d] bg-white text-[#3d3428]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                  vis === "private" ? "border-[#a16207]" : "border-[#d3c39c]"
                )}
              >
                {vis === "private" && <span className="size-2 rounded-full bg-[#a16207]" />}
              </span>
              {t("Private — only your offerings speak")}
            </button>
          </div>
        </div>

        {/* ---------- block 3 · quiet walls ---------- */}
        <div className={cn(GP_CARD, "mt-4 p-5")} data-testid="gath-setting-walls">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#5f7a52]" aria-hidden="true" />
            <RoomLabel>{t("Quiet walls")}</RoomLabel>
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#8a7c64]">
            {t("Blocked presences cannot reach you in any room.")}
          </p>
          {blockedLoading && blocked === null && (
            <p className="mt-3 flex items-center gap-2 text-[12px] text-[#a2947c]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              {t("The walls are being read…")}
            </p>
          )}
          {blockedError && (
            <p className="mt-3 text-[12px] text-[#b45309]" role="alert">
              {blockedError}
            </p>
          )}
          {blocked !== null && blocked.length === 0 && !blockedError && (
            <p className="mt-3 rounded-[14px] border border-[#e8dfc9] bg-white px-4 py-3 text-center font-[family-name:var(--font-literata)] text-[12px] italic text-[#a2947c]">
              {t("No walls stand — every door is open.")}
            </p>
          )}
          {blocked !== null && blocked.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {blocked.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-2.5 rounded-[14px] border border-[#e8dfc9] bg-white px-3 py-2.5"
                >
                  <MakerMark name={b.name} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-[#3d3428]">
                      {b.name}
                    </span>
                    <span className="block text-[10.5px] text-[#a2947c]">
                      {t("since")} {relativeTime(b.since, t)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void unblock(b.id)}
                    disabled={unblockingId === b.id}
                    className={cn(GP_GHOST, "shrink-0 px-3 py-1.5 text-[11px]")}
                    data-testid="gath-setting-unblock"
                  >
                    {unblockingId === b.id && (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    )}
                    {t("Open the wall")}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {wallsNote.note && (
            <p className="mt-2.5 text-[12px] italic text-[#8a6f46]" role="status">
              {wallsNote.note}
            </p>
          )}
        </div>

        {/* ---------- block 4 · your data ---------- */}
        <div className={cn(GP_CARD, "mt-4 p-5")} data-testid="gath-setting-data">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-[#8a6f46]" aria-hidden="true" />
            <RoomLabel>{t("Your data")}</RoomLabel>
          </div>
          <p className="mt-2 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.75] text-[#5c5344]">
            {t("The account room of the house keeps export and deletion — nothing is hidden there.")}
          </p>
          <p className="mt-2 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.75] text-[#5c5344]">
            {t(
              "Reports and appeals: every report reaches the moderation queue; the guidelines explain what happens next."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BellRing,
  Loader2,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type MeState,
  type NetworkPrefsState,
  GP_HAND,
  GP_ICON_BTN,
  GP_INPUT,
  RoomLabel,
  MakerMark,
  netFetch,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE VISITOR'S OWN ROOM — the introduction, the fields of curiosity */
/*  and craft, the bell's own manners, the closed doors, the quiet     */
/*  counts. A professional presence, without vanity: everything here   */
/*  is the maker's own truth, worn or removed at their own hand.       */
/*                                                                     */
/*  THE TWO PROFILES ARE ONE — a signed-in maker carries the landing   */
/*  passage's own name and email into the hall; a quiet guest wears    */
/*  the astral name the circle minted for them, and nothing personal   */
/*  rests anywhere in this room.                                       */
/* ------------------------------------------------------------------ */

interface BlockedRow {
  id: string;
  name: string;
  since: string;
}

const PREF_ROWS: Array<{
  key: keyof NetworkPrefsState;
  label: string;
  body: string;
}> = [
  {
    key: "resonance",
    label: "Standing with your words",
    body: "The bell rings when someone resonates with an offering of yours.",
  },
  {
    key: "echoes",
    label: "Echoes of your words",
    body: "The bell rings when someone answers an offering of yours.",
  },
  {
    key: "connections",
    label: "Introductions",
    body: "The bell rings for connection requests and their answers.",
  },
  {
    key: "library",
    label: "Circles and workshops",
    body: "The bell rings for the circles', projects' and library's own news.",
  },
];

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

  /* the bell's own manners — each switch speaks at once */
  const [prefs, setPrefs] = useState<NetworkPrefsState>(
    me?.prefs ?? { resonance: true, echoes: true, connections: true, library: true }
  );
  const [prefsBusy, setPrefsBusy] = useState(false);

  /* the closed doors — the visitor's own walls */
  const [blocked, setBlocked] = useState<BlockedRow[] | null>(null);

  useEffect(() => {
    if (me) {
      setName(me.name);
      setBio(me.bio ?? "");
      setInterests(me.interests.join(", "));
      setDisciplines(me.disciplines.join(", "));
      setVisibility(me.visibility === "private" ? "private" : "public");
      setPrefs(me.prefs ?? { resonance: true, echoes: true, connections: true, library: true });
    }
  }, [me]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await netFetch<{ blocked: BlockedRow[] }>("/api/network/safety");
        if (alive) setBlocked(data.blocked);
      } catch {
        if (alive) setBlocked([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  const setPref = useCallback(
    async (key: keyof NetworkPrefsState, next: boolean) => {
      const optimistic = { ...prefs, [key]: next };
      setPrefs(optimistic);
      setPrefsBusy(true);
      try {
        await netFetch("/api/network/me", {
          method: "PATCH",
          body: { prefs: { [key]: next } },
        });
      } catch {
        setPrefs(prefs); /* the old manner stands */
      } finally {
        setPrefsBusy(false);
      }
    },
    [prefs]
  );

  const unblock = useCallback(
    async (id: string) => {
      setBlocked((prev) => prev?.filter((b) => b.id !== id) ?? prev);
      try {
        await netFetch("/api/network/safety", {
          method: "POST",
          body: { action: "unblock", userId: id },
        });
      } catch {
        void id; /* the wall returns on the next reading */
      }
    },
    []
  );

  const since = me?.since
    ? new Date(me.since).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  const stats: Array<[number | string, string]> = me
    ? [
        [me.counts.posts, t("offerings")],
        [me.counts.circles, t("circles")],
        [me.counts.projects, t("works together")],
        [me.counts.connections, t("connections")],
      ]
    : [];

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
        {/* ---------- the presence head — banner, mark, identity ---------- */}
        <div className="gp-card overflow-hidden rounded-[26px]" data-testid="gathering-profile-head">
          <div
            aria-hidden="true"
            className="h-20 w-full"
            style={{
              background:
                "linear-gradient(168deg, #f6efe1 0%, #efe4cd 55%, #e8dabc 100%)",
            }}
          />
          <div className="px-5 pb-5 sm:px-6">
            <div className="-mt-9 flex items-end gap-3">
              <MakerMark name={me?.name ?? "·"} size={64} />
              <div className="min-w-0 pb-1">
                <p className="truncate font-[family-name:var(--font-cinzel)] text-[17px] font-semibold text-[#3d3428]">
                  {me?.name ?? "…"}
                </p>
                <p className="truncate text-[11.5px] text-[#8a7c64]">
                  {me?.email
                    ? `${t("The landing passage")} · ${me.email}`
                    : t("An astral name, minted by the circle")}
                </p>
              </div>
            </div>

            {since && (
              <p className="mono-label mt-3 text-[8.5px] uppercase tracking-[0.18em] text-[#a2947c]">
                {t("In the hall since")} {since}
              </p>
            )}

            {/* the quiet counts — the presence's own shape */}
            <div className="mt-4 grid grid-cols-4 gap-2" data-testid="gathering-profile-stats">
              {stats.map(([n, label]) => (
                <div
                  key={label}
                  className="rounded-[14px] border border-[#eee5d0] bg-white px-2 py-2.5 text-center"
                >
                  <p className="text-[15px] font-semibold tabular-nums text-[#3d3428]">{n}</p>
                  <p className="mono-label mt-0.5 text-[7.5px] uppercase tracking-[0.14em] text-[#a2947c]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- the introduction ---------- */}
        <div className="gp-card mt-4 rounded-[26px] p-5 sm:p-6">
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

        {/* ---------- the bell's own manners ---------- */}
        <div className="gp-card mt-4 rounded-[26px] p-5 sm:p-6" data-testid="gathering-profile-bell">
          <div className="flex items-center gap-2">
            <BellRing className="size-4 text-[#a16207]" aria-hidden="true" />
            <RoomLabel>{t("The bell's manners")}</RoomLabel>
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
                  onClick={() => void setPref(row.key, !on)}
                  data-testid={`gathering-pref-${row.key}`}
                  className="focus-glow flex items-center gap-3 rounded-[16px] border border-[#e8dfc9] bg-white px-4 py-3 text-left transition-colors duration-300 hover:border-[#d3c39c]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold text-[#3d3428]">
                      {t(row.label)}
                    </span>
                    <span className="block text-[11px] leading-relaxed text-[#8a7c64]">
                      {t(row.body)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-all duration-300",
                      on
                        ? "justify-end border-[#cbb98d] bg-[#a16207]/25"
                        : "justify-start border-[#e4d9bd] bg-[#f1e8d5]"
                    )}
                  >
                    <span className="size-3.5 rounded-full bg-white shadow-[0_1px_3px_rgba(122,103,70,0.45)]" />
                  </span>
                </button>
              );
            })}
          </div>
          {prefsBusy && (
            <p className="mt-2 text-right text-[10.5px] italic text-[#a2947c]">
              <Loader2 className="mr-1 inline size-3 animate-spin" aria-hidden="true" />
              {t("The bell listens…")}
            </p>
          )}
        </div>

        {/* ---------- the closed doors — privacy & safety ---------- */}
        <div className="gp-card mt-4 rounded-[26px] p-5 sm:p-6" data-testid="gathering-profile-walls">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#5f7a52]" aria-hidden="true" />
            <RoomLabel>{t("The closed doors")}</RoomLabel>
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#8a7c64]">
            {t(
              "A closed door silences a maker for you alone — their words, their echoes, their hand never reach your rooms."
            )}
          </p>
          {blocked === null ? (
            <p className="mt-3 flex items-center gap-2 text-[12px] text-[#a2947c]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              {t("The walls are being read…")}
            </p>
          ) : blocked.length === 0 ? (
            <p className="mt-3 rounded-[14px] border border-[#e8dfc9] bg-white px-4 py-3 text-center text-[12px] italic text-[#a2947c]">
              {t("No door stands closed — every maker's word may reach you.")}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {blocked.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-2.5 rounded-[14px] border border-[#e8dfc9] bg-white px-3 py-2.5"
                >
                  <MakerMark name={b.name} size={30} />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#3d3428]">
                    {b.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => void unblock(b.id)}
                    aria-label={`${t("Open the door again")} — ${b.name}`}
                    title={t("Open the door again")}
                    className={GP_ICON_BTN + " size-8"}
                  >
                    <UserX className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

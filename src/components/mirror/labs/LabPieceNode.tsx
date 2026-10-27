"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Check, MessageCircle, Pencil, Trash2, X } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  LAB_STATUSES,
  STATUS_META,
  type LabConfig,
  type LabNodeStatus,
  type LabPieceData,
} from "./lab-config";
import type { LabPieceNode } from "./lab-draft";

/* ------------------------------------------------------------------ */
/*  THE LAB PIECE — one glass card on the obsidian bench. The kind's   */
/*  own accent dot names it, the status dot tells its standing, and    */
/*  the note whispers under. Selected, it glows in its own accent.     */
/*  Double-click (or the small pencil — the mobile way in, always      */
/*  visible) opens the piece's own inline editor: a name, a note, a    */
/*  status row, and three honest hands — keep, lay the pen down,       */
/*  remove — plus the ask hand that carries the piece to the Mirror.   */
/* ------------------------------------------------------------------ */

/** the lab's quiet hand — shared between the canvas and its pieces
    (editing state and data edits flow down without touching node data) */
export type LabHands = {
  editingId: string | null;
  openEditor: (id: string | null) => void;
  updateData: (id: string, patch: Partial<LabPieceData>) => void;
  removeNode: (id: string) => void;
  /** the ask hand — carries this one piece's words to the room's chat */
  askAboutPiece: (id: string) => void;
  /** the piece the bench summary asks to be seen (centered + opened) */
  focusId: string | null;
};

export const LabHandsContext = createContext<LabHands>({
  editingId: null,
  openEditor: () => undefined,
  updateData: () => undefined,
  removeNode: () => undefined,
  askAboutPiece: () => undefined,
  focusId: null,
});

export const LabConfigContext = createContext<LabConfig | null>(null);

export function useLabHands(): LabHands {
  return useContext(LabHandsContext);
}

/** the piece's width — one fixed width, so a name's length never
    shifts the bench under the visitor's hand */
export const PIECE_WIDTH = 188;

export function LabPiece({ id, data, selected }: NodeProps<LabPieceNode>) {
  const t = useT();
  const config = useContext(LabConfigContext);
  const { editingId, openEditor, updateData, focusId } = useLabHands();
  const meta = config?.kinds[data.kind];
  const statusMeta = STATUS_META[data.status];
  const StatusIcon = statusMeta.icon;
  const editing = editingId === id;

  /* the piece's own light — the kind's accent, mixed honestly; the
     summary's focus asks for a breath of the lab's own light */
  const accentStyle = selected
    ? {
        borderColor: `color-mix(in srgb, ${meta?.accent ?? "#9aa0a6"} 60%, transparent)`,
        boxShadow: `0 0 14px -6px color-mix(in srgb, ${meta?.accent ?? "#9aa0a6"} 55%, transparent)`,
      }
    : focusId === id
      ? {
          borderColor:
            "color-mix(in srgb, var(--scope-a, var(--gd)) 55%, transparent)",
          boxShadow:
            "0 0 16px -7px color-mix(in srgb, var(--scope-a, var(--gd)) 60%, transparent)",
        }
      : undefined;

  if (editing) {
    return <PieceEditor id={id} data={data} />;
  }

  return (
    <div
      className="glass-strong group relative rounded-xl px-3 py-2.5"
      style={{ width: PIECE_WIDTH, ...accentStyle }}
      data-testid={`${config?.testPrefix ?? "lab"}-piece`}
      data-kind={data.kind}
      data-status={data.status}
    >
      <Handle
        type="target"
        position={Position.Top}
        aria-label={t("Connect into this piece")}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        aria-label={t("Connect from this piece")}
      />

      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{
            background: meta?.accent ?? "#9aa0a6",
            boxShadow: `0 0 8px -2px color-mix(in srgb, ${meta?.accent ?? "#9aa0a6"} 70%, transparent)`,
          }}
        />
        <span className="mono-label min-w-0 flex-1 truncate text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
          {t(meta?.label ?? data.kind)}
        </span>
        {/* THE STANDING HAND — one tap cycles the piece's status:
            draft → active → done → draft */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            updateData(id, {
              status:
                LAB_STATUSES[
                  (LAB_STATUSES.indexOf(data.status) + 1) % LAB_STATUSES.length
                ],
            });
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t("Status: {s} — tap to change", {
            s: t(statusMeta.label),
          })}
          title={t("Status: {s} — tap to change", { s: t(statusMeta.label) })}
          data-testid={`${config?.testPrefix ?? "lab"}-piece-status`}
          className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full transition-opacity duration-200 hover:bg-foreground/8 sm:opacity-0 sm:group-hover:opacity-100"
          style={{ color: statusMeta.color }}
        >
          <StatusIcon className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openEditor(id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t("Edit this piece")}
          title={t("Edit this piece")}
          data-testid={`${config?.testPrefix ?? "lab"}-piece-edit`}
          className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-opacity duration-200 hover:bg-foreground/8 hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Pencil className="size-3" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-1 line-clamp-2 break-words text-[12.5px] font-medium leading-snug text-foreground">
        {data.name}
      </p>
      {data.note.trim() ? (
        <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted-foreground/85">
          {data.note}
        </p>
      ) : (
        <p className="mt-0.5 flex items-center gap-1 text-[11px] italic leading-relaxed text-muted-foreground/55">
          {(() => {
            const Icon = meta?.icon;
            return Icon ? (
              <Icon className="size-3" aria-hidden="true" />
            ) : null;
          })()}
          {t("A word for the note…")}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE PIECE'S EDITOR — the card opens into a small desk: a name,     */
/*  a note, the status row, and the honest hands — keep, lay the pen   */
/*  down, remove — and the ask hand that carries the piece's words     */
/*  into the room's conversation, where the Mirror answers about it.   */
/*  nodrag / nowheel keep the desk still while the bench breathes.     */
/* ------------------------------------------------------------------ */

function PieceEditor({ id, data }: { id: string; data: LabPieceData }) {
  const t = useT();
  const config = useContext(LabConfigContext);
  const { openEditor, updateData, removeNode, askAboutPiece } = useLabHands();
  const meta = config?.kinds[data.kind];
  const [name, setName] = useState(data.name);
  const [note, setNote] = useState(data.note);
  const [status, setStatus] = useState<LabNodeStatus>(data.status);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    /* the desk opens with the name chosen, ready to be replaced */
    const raf = window.requestAnimationFrame(() => {
      nameRef.current?.focus();
      nameRef.current?.select();
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const close = () => openEditor(null);

  const keep = () => {
    updateData(id, {
      name: name.trim() || meta?.label || "Piece",
      note: note.trim(),
      status,
    });
    close();
  };

  return (
    <div
      className="glass-strong nodrag nowheel relative rounded-xl px-3 py-2.5"
      style={{
        width: PIECE_WIDTH + 28,
        borderColor: `color-mix(in srgb, ${meta?.accent ?? "#9aa0a6"} 45%, transparent)`,
      }}
      data-testid={`${config?.testPrefix ?? "lab"}-piece-editor`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      role="form"
      aria-label={t("Edit this piece")}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ background: meta?.accent ?? "#9aa0a6" }}
        />
        <span className="mono-label min-w-0 flex-1 truncate text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
          {t(meta?.label ?? data.kind)}
        </span>
      </div>

      <Input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            keep();
          } else if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
        }}
        maxLength={80}
        placeholder={t("The piece's name")}
        aria-label={t("The piece's name")}
        data-testid={`${config?.testPrefix ?? "lab"}-piece-name`}
        className="mt-1.5 h-8 rounded-lg px-2.5 text-[12.5px] shadow-none"
      />
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
        }}
        maxLength={600}
        rows={3}
        placeholder={t("What it means, how it works, what it proves…")}
        aria-label={t("The piece's note")}
        data-testid={`${config?.testPrefix ?? "lab"}-piece-note`}
        className="nice-scroll mt-1.5 min-h-[58px] resize-none rounded-lg px-2.5 py-1.5 text-[11.5px] leading-relaxed shadow-none"
      />

      {/* THE STATUS ROW — the piece's standing, one small tap each */}
      <div
        role="radiogroup"
        aria-label={t("The piece's standing")}
        className="mt-1.5 flex items-center gap-1"
      >
        {LAB_STATUSES.map((s) => {
          const sMeta = STATUS_META[s];
          const SIcon = sMeta.icon;
          const chosen = status === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={chosen}
              onClick={() => setStatus(s)}
              data-testid={`${config?.testPrefix ?? "lab"}-status-${s}`}
              className={cn(
                "focus-glow flex h-7 flex-1 items-center justify-center gap-1 rounded-full border text-[10.5px] transition-colors duration-300",
                chosen
                  ? "font-medium"
                  : "text-muted-foreground/70 hover:bg-foreground/5"
              )}
              style={
                chosen
                  ? {
                      borderColor: `color-mix(in srgb, ${sMeta.color} 45%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${sMeta.color} 13%, transparent)`,
                      color: sMeta.color,
                    }
                  : { borderColor: "rgba(255,255,255,0.08)" }
              }
            >
              <SIcon className="size-3" aria-hidden="true" />
              {t(sMeta.label)}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-1">
        <Button
          type="button"
          variant="primary"
          onClick={keep}
          data-testid={`${config?.testPrefix ?? "lab"}-piece-save`}
          className="h-8 flex-1 rounded-lg px-2 text-[12px]"
        >
          <Check className="size-3.5" aria-hidden="true" />
          {t("Keep")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={close}
          aria-label={t("Lay the pen down")}
          title={t("Lay the pen down")}
          className="size-8 rounded-lg p-0"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            removeNode(id);
            close();
          }}
          aria-label={t("Remove this piece")}
          title={t("Remove this piece")}
          data-testid={`${config?.testPrefix ?? "lab"}-piece-remove`}
          className="size-8 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </div>

      {/* THE ASK HAND — the piece's words carried to the room's chat,
          where the Mirror answers about this very piece */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => askAboutPiece(id)}
        data-testid={`${config?.testPrefix ?? "lab"}-piece-ask`}
        className="mt-1.5 h-8 w-full rounded-lg border border-white/12 bg-white/8 px-2 text-[12px] text-white/85 hover:bg-white/14"
      >
        <MessageCircle className="size-3.5" aria-hidden="true" />
        {t(config?.askPiece ?? "Ask about this piece")}
      </Button>
    </div>
  );
}

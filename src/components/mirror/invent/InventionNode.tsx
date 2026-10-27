"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { KIND_META, type InventionNode, type InventionNodeData } from "./lab-types";

/* ------------------------------------------------------------------ */
/*  THE LAB PIECE — one glass card on the obsidian bench. The kind's   */
/*  own accent dot and icon name it; the note whispers under it.       */
/*  Selected, it glows in its own accent. Double-click (or the small   */
/*  pencil — the mobile way in, always visible) opens the piece's      */
/*  own inline editor: a name, a note, three honest hands.             */
/* ------------------------------------------------------------------ */

/** the lab's quiet hand — shared between the canvas and its pieces
    (editing state and data edits flow down without touching node data) */
export type LabHands = {
  editingId: string | null;
  openEditor: (id: string | null) => void;
  updateData: (id: string, patch: Partial<InventionNodeData>) => void;
  removeNode: (id: string) => void;
};

export const LabContext = createContext<LabHands>({
  editingId: null,
  openEditor: () => undefined,
  updateData: () => undefined,
  removeNode: () => undefined,
});

export function useLabHands(): LabHands {
  return useContext(LabContext);
}

/* THE PIECE'S WIDTH — one fixed width, so a name's length never
   shifts the bench under the visitor's hand */
export const PIECE_WIDTH = 188;

export function InventionPiece({ id, data, selected }: NodeProps<InventionNode>) {
  const t = useT();
  const { editingId, openEditor } = useLabHands();
  const meta = KIND_META[data.kind];
  const Icon = meta.icon;
  const editing = editingId === id;

  /* the piece's own light — the accent, mixed honestly */
  const accentStyle = selected
    ? {
        borderColor: `color-mix(in srgb, ${meta.accent} 60%, transparent)`,
        boxShadow: `0 0 14px -6px color-mix(in srgb, ${meta.accent} 55%, transparent)`,
      }
    : undefined;

  if (editing) {
    return <PieceEditor id={id} data={data} />;
  }

  return (
    <div
      className="glass-strong group relative rounded-xl px-3 py-2.5"
      style={{ width: PIECE_WIDTH, ...accentStyle }}
      data-testid="invention-piece"
      data-kind={data.kind}
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
            background: meta.accent,
            boxShadow: `0 0 8px -2px color-mix(in srgb, ${meta.accent} 70%, transparent)`,
          }}
        />
        <span className="mono-label min-w-0 flex-1 truncate text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
          {t(meta.label)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openEditor(id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t("Edit this piece")}
          title={t("Edit this piece")}
          data-testid="invention-piece-edit"
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
          <Icon className="size-3" aria-hidden="true" />
          {t("A word for the note…")}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE PIECE'S EDITOR — the card opens into a small desk: a name,     */
/*  a note, and three honest hands (keep, lay the pen down, remove).   */
/*  nodrag / nowheel keep the desk still while the bench breathes.     */
/* ------------------------------------------------------------------ */

function PieceEditor({ id, data }: { id: string; data: InventionNodeData }) {
  const t = useT();
  const { openEditor, updateData, removeNode } = useLabHands();
  const meta = KIND_META[data.kind];
  const [name, setName] = useState(data.name);
  const [note, setNote] = useState(data.note);
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
      name: name.trim() || meta.label,
      note: note.trim(),
    });
    close();
  };

  return (
    <div
      className="glass-strong nodrag nowheel relative rounded-xl px-3 py-2.5"
      style={{
        width: PIECE_WIDTH + 28,
        borderColor: `color-mix(in srgb, ${meta.accent} 45%, transparent)`,
      }}
      data-testid="invention-piece-editor"
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
          style={{ background: meta.accent }}
        />
        <span className="mono-label min-w-0 flex-1 truncate text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
          {t(meta.label)}
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
        data-testid="invention-piece-name"
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
        data-testid="invention-piece-note"
        className="nice-scroll mt-1.5 min-h-[58px] resize-none rounded-lg px-2.5 py-1.5 text-[11.5px] leading-relaxed shadow-none"
      />

      <div className="mt-2 flex items-center gap-1">
        <Button
          type="button"
          variant="primary"
          onClick={keep}
          data-testid="invention-piece-save"
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
          data-testid="invention-piece-remove"
          className="size-8 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/** the kind's accent dot — dropdown items and the legend share it */
export function KindDot({
  kind,
  className,
}: {
  kind: keyof typeof KIND_META;
  className?: string;
}) {
  const meta = KIND_META[kind];
  return (
    <span
      aria-hidden="true"
      className={cn("size-2 shrink-0 rounded-full", className)}
      style={{ background: meta.accent }}
    />
  );
}

"use client";

/* ------------------------------------------------------------------ */
/*  THE INK DESK'S OWN PEN — MirrorManuscriptEditor.                   */
/*                                                                     */
/*  A professional rich-text editor for the book's leaves, dressed as  */
/*  the reading room itself: Literata on paper, the book's own ink,    */
/*  a minimal ghost toolbar (weight, slant, the chapter's headings,    */
/*  lists, a quote, and the two undo hands). Tiptap under the silk.    */
/*                                                                     */
/*  THE TWO FORMS: every change is handed back as BOTH rich HTML       */
/*  (for the page's own keeping) and clean plain text (for the voice,  */
/*  the binding press, the loose-leaf press and the shelf — all the    */
/*  hands that already read plain paragraphs), plus the character      */
/*  count the desk's quiet label speaks.                               */
/*                                                                     */
/*  UNCONTROLLED BY CONTRACT: `content` is the initial manuscript      */
/*  only; the pen keeps its own state while it writes. To load a       */
/*  different leaf, the parent remounts (key by page) — never feed     */
/*  the editor its own output.                                         */
/* ------------------------------------------------------------------ */

import { useEffect, useReducer, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CharacterCount } from "@tiptap/extension-character-count";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./manuscript-editor.css";

export interface MirrorManuscriptEditorProps {
  /** The initial manuscript (rich HTML, or migrated plain text). Read once. */
  content: string;
  /** Every change: rich HTML, clean plain text, and the character count. */
  onUpdate?: (html: string, text: string, charCount: number) => void;
  /** The gentle invitation shown on an empty page. */
  placeholder?: string;
  /** The reading room's own silence — the pen rests, the words stay. */
  readOnly?: boolean;
  className?: string;
  /** How the desk counts out loud (defaults to 1,204 · 6,712 shaping). */
  formatNumber?: (n: number) => string;
}

/** The CharacterCount extension's storage, as the desk reads it. */
interface CountStorage {
  characters(): number;
  words(): number;
}

const countStorage = (editor: Editor): CountStorage =>
  editor.storage.characterCount as unknown as CountStorage;

/* one ghost hand in the toolbar — 44px on touch, 36px at the desk,
   scope-tinted while its mark is active */
function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      disabled={disabled}
      /* the press must not take the caret's place — the selection stays */
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "h-11 w-11 text-muted-foreground sm:h-9 sm:w-9",
        active &&
          "bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_13%,transparent)] text-[color:var(--scope-a,var(--gd))] hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_20%,transparent)]"
      )}
    >
      {children}
    </Button>
  );
}

export default function MirrorManuscriptEditor({
  content,
  onUpdate,
  placeholder,
  readOnly = false,
  className,
  formatNumber,
}: MirrorManuscriptEditorProps) {
  /* the toolbar's active marks and the quiet count ride a transaction
     tick — no continuous animation, only the work the pen itself does */
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const editor = useEditor({
    /* never steal the reading room's breath: no autofocus on mount,
       and no SSR render (also the StrictMode double-mount guard) */
    immediatelyRender: false,
    autofocus: false,
    editable: !readOnly,
    content: content || "",
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      ...(placeholder
        ? [Placeholder.configure({ placeholder })]
        : []),
      CharacterCount,
    ],
    onUpdate: ({ editor }) => {
      onUpdateRef.current?.(
        editor.getHTML(),
        editor.getText({ blockSeparator: "\n\n" }),
        countStorage(editor).characters()
      );
    },
    onTransaction: () => bump(),
  });

  /* the reading room's silence, worn the moment it is asked for */
  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable === !readOnly) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  const words = editor ? countStorage(editor).words() : 0;
  const characters = editor ? countStorage(editor).characters() : 0;
  const fmt = formatNumber ?? ((n: number) => n.toLocaleString("en-US"));

  return (
    <div
      className={cn("manuscript-editor", className)}
      data-readonly={readOnly ? "true" : undefined}
    >
      {!readOnly && editor && (
        <div
          className="manuscript-toolbar"
          role="toolbar"
          aria-label="Writing tools"
        >
          <ToolButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" aria-hidden="true" />
          </ToolButton>
          <ToolButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" aria-hidden="true" />
          </ToolButton>
          <ToolButton
            label={
              editor.isActive("heading", { level: 2 })
                ? "Heading level 3"
                : editor.isActive("heading", { level: 3 })
                  ? "Plain text"
                  : "Heading level 2"
            }
            active={
              editor.isActive("heading", { level: 2 }) ||
              editor.isActive("heading", { level: 3 })
            }
            onClick={() => {
              if (editor.isActive("heading", { level: 3 })) {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              } else if (editor.isActive("heading", { level: 2 })) {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              } else {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              }
            }}
          >
            <Heading2 className="size-4" aria-hidden="true" />
          </ToolButton>
          <ToolButton
            label="Bulleted list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" aria-hidden="true" />
          </ToolButton>
          <ToolButton
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" aria-hidden="true" />
          </ToolButton>
          <ToolButton
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="size-4" aria-hidden="true" />
          </ToolButton>
          <ToolButton
            label="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="size-4" aria-hidden="true" />
          </ToolButton>
          <ToolButton
            label="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="size-4" aria-hidden="true" />
          </ToolButton>
        </div>
      )}
      <EditorContent
        editor={editor}
        className="manuscript-editor-frame manuscript-editor-scroll"
      />
      <p className="mono-label manuscript-count text-[10px] uppercase tracking-[0.18em]" data-testid="manuscript-count">
        {fmt(words)} {words === 1 ? "word" : "words"} · {fmt(characters)}{" "}
        {characters === 1 ? "character" : "characters"}
      </p>
    </div>
  );
}

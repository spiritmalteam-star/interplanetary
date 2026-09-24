"use client";

/* ------------------------------------------------------------------ */
/*  Client attachment helpers — the Mirror receives more than words.   */
/*  Every chat input may carry ONE image and up to THREE documents     */
/*  (PDF, Excel, Word). Images travel as data URLs (the vision field   */
/*  sees them server-side); documents are extracted by /api/parse-doc  */
/*  and travel as faithful text.                                       */
/* ------------------------------------------------------------------ */

export interface ChatAttachment {
  id: string;
  kind: "image" | "document";
  name: string;
  size: number;
  /** Images only — data URL used for preview and server-side vision. */
  dataUrl?: string;
  /** Documents only — extracted text returned by /api/parse-doc. */
  text?: string;
  /** Documents only — extraction in flight. */
  reading?: boolean;
}

export const MAX_IMAGES = 1;
export const MAX_DOCUMENTS = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOC_BYTES = 12 * 1024 * 1024; // 12 MB

export const IMAGE_ACCEPT = "image/*";
export const DOC_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx";
export const FULL_ACCEPT = `${IMAGE_ACCEPT},${DOC_ACCEPT}`;

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i;
const DOC_EXT = /\.(pdf|docx?|xlsx?)$/i;

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}

export function isDocFile(file: File): boolean {
  return (
    DOC_EXT.test(file.name) ||
    file.type === "application/pdf" ||
    file.type.includes("wordprocessingml") ||
    file.type.includes("spreadsheetml") ||
    file.type.includes("ms-excel")
  );
}

let attachmentCounter = 0;
const nextAttachmentId = () =>
  `att-${Date.now().toString(36)}-${(attachmentCounter++).toString(36)}`;

export function readFileAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(blob);
  });
}

/** Ask the field to extract one document's faithful text. */
export async function parseDocument(
  file: File
): Promise<{ name: string; kind: string; text: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/parse-doc", { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as {
    name?: string;
    kind?: string;
    text?: string;
    error?: string;
  } | null;
  if (!res.ok || !data?.text) {
    throw new Error(data?.error ?? "That document could not be read.");
  }
  return { name: data.name ?? file.name, kind: data.kind ?? "document", text: data.text };
}

/** Classify + shape one picked file into an attachment (or null). */
export function makeAttachment(file: File): {
  attachment: ChatAttachment;
  kind: "image" | "document";
} | null {
  if (isImageFile(file)) {
    return {
      kind: "image",
      attachment: {
        id: nextAttachmentId(),
        kind: "image",
        name: file.name,
        size: file.size,
      },
    };
  }
  if (isDocFile(file)) {
    return {
      kind: "document",
      attachment: {
        id: nextAttachmentId(),
        kind: "document",
        name: file.name,
        size: file.size,
        reading: true,
      },
    };
  }
  return null;
}

/** The payload the chat endpoints understand. */
export function attachmentsToPayload(attachments: ChatAttachment[]): {
  image?: string;
  documents?: { name: string; text: string }[];
} | null {
  const image = attachments.find((a) => a.kind === "image" && a.dataUrl);
  const documents = attachments
    .filter((a) => a.kind === "document" && a.text && a.text.trim())
    .map((a) => ({ name: a.name, text: a.text as string }));
  if (!image && documents.length === 0) return null;
  return {
    ...(image ? { image: image.dataUrl } : {}),
    ...(documents.length > 0 ? { documents } : {}),
  };
}

export function hasPendingAttachments(attachments: ChatAttachment[]): boolean {
  return attachments.some(
    (a) => a.reading || (a.kind === "image" && !a.dataUrl) || (a.kind === "document" && !a.text)
  );
}

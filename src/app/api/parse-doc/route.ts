import { NextRequest, NextResponse } from "next/server";
import { meterRoute } from "@/lib/server/meter";

/* ------------------------------------------------------------------ */
/*  POST /api/parse-doc — one file becomes faithful text.              */
/*  PDF (pdf-parse), Word (.docx — mammoth), Excel (.xls/.xlsx —       */
/*  SheetJS). The extracted text travels back so the chat endpoints    */
/*  can fold it into the visitor's message.                            */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB per document

interface ParseResult {
  name: string;
  kind: "pdf" | "word" | "excel";
  text: string;
}

function kindOf(name: string, mime: string): "pdf" | "word" | "excel" | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "word";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  if (mime.includes("wordprocessingml")) return "word";
  if (mime.includes("spreadsheetml") || mime.includes("ms-excel")) return "excel";
  return null;
}

async function parsePdf(buffer: Buffer): Promise<string> {
  /* unpdf — a bundler-safe pdfjs build (pdf-parse breaks under webpack). */
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join("\n") : text)
    .replace(/\u0000/g, "")
    .trim();
}

async function parseWord(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return (result.value ?? "").trim();
}

async function parseExcel(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheets: string[] = [];
  for (const sheetName of workbook.SheetNames.slice(0, 12)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim();
    if (csv) sheets.push(`[sheet: ${sheetName}]\n${csv}`);
  }
  return sheets.join("\n\n").trim();
}

export const POST = meterRoute("parse_doc", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No document arrived." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "That file is too large." },
        { status: 413 }
      );
    }

    const kind = kindOf(file.name, file.type);
    if (!kind) {
      return NextResponse.json(
        { error: "Only image, PDF, Excel or Word files are received." },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    try {
      if (kind === "pdf") text = await parsePdf(buffer);
      else if (kind === "word") text = await parseWord(buffer);
      else text = await parseExcel(buffer);
    } catch (err) {
      console.error("[api/parse-doc] extraction failed:", err);
      return NextResponse.json(
        { error: "That document could not be read." },
        { status: 422 }
      );
    }

    /* Scanned PDFs and image-only Word files carry no extractable text. */
    if (!text || text.replace(/\s+/g, "").length < 8) {
      return NextResponse.json(
        { error: "That document could not be read." },
        { status: 422 }
      );
    }

    const result: ParseResult = {
      name: file.name,
      kind,
      text: text.slice(0, 40000),
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/parse-doc]", err);
    return NextResponse.json(
      { error: "That document could not be read." },
      { status: 500 }
    );
  }
}

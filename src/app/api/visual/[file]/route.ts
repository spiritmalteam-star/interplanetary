import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/* ------------------------------------------------------------------ */
/*  The atelier's gallery — serves one painted visualization.          */
/*  Paintings live outside public/ and are streamed per request,      */
/*  so freshly generated artwork is available instantly in dev and    */
/*  production alike. `?download=1` offers the file as a download.     */
/* ------------------------------------------------------------------ */

const ART_DIR = path.join(process.cwd(), ".visualizations");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  /* strict name check — only our own painting names may pass */
  if (!/^[a-z0-9-]+\.png$/i.test(file)) {
    return NextResponse.json({ error: "Not found" }, { status: 400 });
  }

  const filePath = path.join(ART_DIR, file);
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const buffer = fs.readFileSync(filePath);
    const download = req.nextUrl.searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=86400, immutable",
        ...(download
          ? {
              "Content-Disposition": `attachment; filename="mirror-entity-${file}"`,
            }
          : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The painting could not be retrieved." },
      { status: 500 }
    );
  }
}

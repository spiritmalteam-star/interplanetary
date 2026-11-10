/*  THE STEADY SECRET'S DOOR — the router.
 *
 *  Next.js compiles this file for BOTH runtimes (nodejs and edge), so
 *  not a single Node-only import may appear here — not even behind a
 *  runtime guard (Turbopack reads the module statically). The whole
 *  boot's work lives in ./instrumentation-node, which is pulled only
 *  when the process actually walks the Node runtime.
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("./instrumentation-node");
}

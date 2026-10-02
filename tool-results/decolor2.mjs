import fs from "fs";
const map = [
  ["#0d0718", "#0d0d0e"],                        // star play tarot face
  ["#1a0f2e", "#1b1b1c"],                        // remedy panel tint
  ["#1a1206", "#101010"],                        // mirroros chat send ink
  ["#08050f", "#0a0a0b"],                        // visualization card veils
  ["#0a0716", "#0b0b0c"],                        // visualization card gradient
  ["#120a24", "#161617"],                        // visualization card gradient
  ["#8b7cf8", "#6b6b74"],                        // replication fallback
  ["#b05e76", "#52525b"],                        // rose → ink (remedy, transmission)
  ["#2f8a6e", "#71717a"],                        // herb green → ink
  ["#d4af37", "#71717a"],                        // gold → ink (remedy const)
  ["#1b1b1f", "#1b1b1c"],                        // text-hero light ramp alignment
  ["#45454c", "#45454d"],
];
const files = [
  "src/components/mirror/StarPlayModal.tsx",
  "src/components/mirror/RemedyLayer.tsx",
  "src/components/mirror/MirrorOSChat.tsx",
  "src/components/mirror/TransmissionView.tsx",
  "src/components/mirror/VisualizationCard.tsx",
  "src/components/mirror/ReplicationPromptModal.tsx",
  "src/app/globals.css",
];
for (const f of files) {
  let src = fs.readFileSync(f, "utf8");
  let n = 0;
  for (const [from, to] of map) {
    const parts = src.split(from);
    if (parts.length > 1) { n += parts.length - 1; src = parts.join(to); }
  }
  fs.writeFileSync(f, src);
  console.log(f.padEnd(52), n);
}
console.log("DONE");

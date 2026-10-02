import fs from "fs";

// exact-string color map — old colored value → smooth grayscale equivalent
const map = [
  // dream button violet
  ["#8f6bff", "var(--sp-b)"],
  // communion void / near-black tints
  ["#0a0010", "#0a0a0b"],
  ["#0a0616", "#0b0b0c"],
  ["#05030e", "#0a0a0b"],
  ["#040209", "#080809"],
  ["#120a2a", "#161617"],
  ["#0a0716", "#111112"],
  ["#070409", "#0a0a0b"],
  ["#0c0806", "#0d0d0e"],
  ["#1a1108", "#141415"],
  ["#0c0806 78%", "#0d0d0e 78%"],
  // communion scope vars (violet/teal/gold of longing)
  ["#7b2d8e", "#8a8a89"],
  ["#00d4aa", "#c2c2c1"],
  ["#d4af37", "#c9c9c8"],
  // parchment / gold text inks
  ["#efe9ff", "#f2f2f1"],
  ["rgba(238, 230, 255, 0.5)", "rgba(255, 255, 255, 0.5)"],
  ["rgba(255, 252, 242, 0.92)", "rgba(255, 255, 255, 0.92)"],
  ["rgba(255, 252, 242, 0.88)", "rgba(255, 255, 255, 0.88)"],
  ["#f4eede", "#efefee"],
  ["#f5efdf", "#eeedec"],
  ["#d9cdb2", "#d2d2d1"],
  ["#e9dcba", "#dededc"],
  ["rgba(255, 248, 224, 0.55)", "rgba(255, 255, 255, 0.55)"],
  ["rgba(140, 104, 48, 0.22)", "rgba(255, 255, 255, 0.12)"],
  ["rgba(112, 82, 36, 0.5)", "rgba(255, 255, 255, 0.12)"],
  ["rgba(112, 82, 36, 0.4)", "rgba(255, 255, 255, 0.2)"],
  ["rgba(112, 82, 36, 0.28)", "rgba(255, 255, 255, 0.16)"],
  ["#7a5a1e", "#8a8a89"],
  ["#6f5412", "#5f5f5e"],
  ["#4a3313", "#4b4b4a"],
  ["#3a2b18", "#2e2e2d"],
  ["#33241a", "#2b2b2a"],
  ["#2a2136", "#2b2b2a"],
  ["#1d1430", "#1e1e1d"],
  ["#241a10", "#262625"],
  ["#8a6a2f", "#8a8a89"],
  ["#5c3a20", "#5a5a59"],
  ["#b06a2c", "#8a8a89"],
  // starfield star hues
  ["#BFE9FF", "#e6e6e5"],
  ["#F5E3D0", "#f7f7f6"],
  // live call / listen whites with lavender tint
  ["#f5f2ff", "#f5f5f4"],
  ["#0b0714", "#0c0c0d"],
];

const files = [
  "src/app/globals.css",
  "src/components/mirror/StarField.tsx",
  "src/components/mirror/LiveCall.tsx",
  "src/components/mirror/ChatInputExtras.tsx",
  "src/components/mirror/CommunionView.tsx",
  "src/components/mirror/AkashicView.tsx",
  "src/components/mirror/StarPlayModal.tsx",
];

for (const f of files) {
  let src = fs.readFileSync(f, "utf8");
  let n = 0;
  for (const [from, to] of map) {
    const parts = src.split(from);
    if (parts.length > 1) { n += parts.length - 1; src = parts.join(to); }
  }
  fs.writeFileSync(f, src);
  console.log(f.padEnd(50), n, "replacements");
}
console.log("DONE");

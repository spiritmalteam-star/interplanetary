import fs from "fs";

function edit(f, pairs) {
  let src = fs.readFileSync(f, "utf8");
  for (const [from, to] of pairs) {
    if (!src.includes(from)) { console.log(f, "MISS:", from.slice(0, 40)); continue; }
    src = src.split(from).join(to);
  }
  fs.writeFileSync(f, src);
  console.log(f, "ok");
}

// Send → Feather (the quill writes, the plane is retired)
edit("src/components/mirror/QueryComposer.tsx", [
  ['import { Send } from "lucide-react";', 'import { Feather } from "lucide-react";'],
  ["<Send className=\"size-3.5\"", "<Feather className=\"size-3.5\""],
]);
edit("src/components/mirror/MirrorOSChat.tsx", [
  ['import { Orbit, RefreshCw, Send } from "lucide-react";', 'import { Feather, Orbit, RefreshCw } from "lucide-react";'],
  ["<Send className=\"size-3.5\"", "<Feather className=\"size-3.5\""],
]);
edit("src/components/mirror/ChatInputExtras.tsx", [
  ["  Send,\n", "  Feather,\n  Send,\n"], // keep Send import if referenced elsewhere? check below
  ["<Send className={iconSize}", "<Feather className={iconSize}"],
]);
edit("src/components/mirror/InventView.tsx", [
  ["<Send className=\"size-3.5\"", "<Feather className=\"size-3.5\""],
  ["<Send className=\"size-4\"", "<Feather className=\"size-4\""],
]);
edit("src/components/mirror/CommunionView.tsx", [
  ["SendHorizontal", "Feather"],
  ["<Feather className=\"size-4\"", "<Feather className=\"size-4\""],
]);

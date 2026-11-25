"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Atom,
  BookOpen,
  BookOpenText,
  CalendarClock,
  CircleQuestionMark,
  Compass,
  Feather,
  FlaskConical,
  Hammer,
  ImagePlus,
  LayoutGrid,
  Leaf,
  Library,
  Mic,
  MessagesSquare,
  Play,
  ScrollText,
  Settings2,
  Sparkles,
  UserRound,
  Users,
  Volume2,
  Waypoints,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useMirror, type ToolTabKey } from "@/lib/mirror-store";

/* ------------------------------------------------------------------ */
/*  THE WORKPLACE LAB — every room of the Gathering carries its own    */
/*  bench. One flask hand on the crown opens a room's lab: a shelf of  */
/*  tools and services cut for the work that happens there — rooms to  */
/*  walk, ateliers to open in the main house, hands that begin real    */
/*  actions. Nothing decorative: every tool does its work.             */
/* ------------------------------------------------------------------ */

type LabAction =
  | { room: string }              /* walk to another room of the Gathering */
  | { tool: ToolTabKey }          /* open a workspace of the main house */
  | { publish: true };            /* carry a finished work in */

interface LabTool {
  icon: LucideIcon;
  label: string;
  line: string;
  action: LabAction;
}

const TOOL = (
  icon: LucideIcon,
  label: string,
  line: string,
  action: LabAction
): LabTool => ({ icon, label, line, action });

/* the main house's shared ateliers — open in the shell behind the hall */
const house = {
  dreambook: () => TOOL(BookOpen, "The Dream Book", "Weave and bind living volumes", { tool: "dreambook" }),
  akashic: () => TOOL(Sparkles, "The Akashic Halls", "Ask the deep record", { tool: "akashic" }),
  lightcodes: () => TOOL(Waypoints, "Light Codes", "Frequencies the eye can hear", { tool: "lightcodes" }),
  artx: () => TOOL(ImagePlus, "Art X", "Paint with the mirror's hand", { tool: "artx" }),
  quantum: () => TOOL(Atom, "ParticleX", "Walk the quantum shift", { tool: "quantum" }),
  healx: () => TOOL(Leaf, "HealX", "The remedy garden's bench", { tool: "healx" }),
  invent: () => TOOL(Wrench, "Invent", "Draft the tool that is missing", { tool: "invent" }),
  mirroros: () => TOOL(Settings2, "Mirror OS", "The system's own console", { tool: "mirroros" }),
  library: () => TOOL(Library, "The Library", "Every kept work on one shelf", { tool: "library" }),
  scopes: () => TOOL(Sparkles, "Scopes", "The observatory's lenses", { tool: "scopes" }),
  spatial: () => TOOL(LayoutGrid, "Spatial", "Ideas in constellations", { tool: "spatial" }),
  video: () => TOOL(Play, "The Film Room", "Motion made from words", { tool: "video" }),
};

const ROOM_LINE: Record<string, string> = {
  gathering: "The open hall — every offering, one cloth.",
  mirror: "The Mirror Laboratory — think beside the mirror.",
  create: "The creation street — begin, shape, carry in.",
  labs: "Workplace Labs — seven benches of the house.",
  discover: "Explore — makers, shelves and doors.",
  possibilities: "The realm — works walked full screen.",
  questions: "Living Questions — what the network asks.",
  circles: "Resonance Circles — small rooms of practice.",
  laboratory: "The Laboratory — benches and mirrors.",
  library: "Creation Commons — the house's kept works.",
  collaborate: "Workshops — weave an offering further.",
  intentions: "Collective Intentions — vows on the atlas.",
  live: "Gather Live — what breathes right now.",
  encounters: "Connections — the makers you walk with.",
  messages: "Inbox — the hall's quiet letters.",
  saved: "Saved — the works you keep.",
  myspace: "My Space — your own house.",
  settings: "Settings — the hall's manners.",
  guidelines: "Guidelines — the hall's promise.",
};

export function labToolsFor(room: string): LabTool[] {
  switch (room) {
    case "gathering":
      return [
        TOOL(Feather, "Share a reflection", "Speak into the open hall", { room: "gathering" }),
        TOOL(BookOpen, "Publish a finished work", "Carry what you made into the hall", { publish: true }),
        TOOL(Play, "The Possibilities Realm", "Walk the works full screen", { room: "possibilities" }),
        house.library(),
        TOOL(CircleQuestionMark, "Living Questions", "Ask, answer, weigh", { room: "questions" }),
        TOOL(Users, "Resonance Circles", "Small rooms of practice", { room: "circles" }),
      ];
    case "mirror":
      return [
        house.dreambook(),
        house.akashic(),
        house.lightcodes(),
        house.mirroros(),
        house.scopes(),
        house.spatial(),
      ];
    case "create":
      return [
        TOOL(BookOpen, "Publish a finished work", "Carry a finished work into the hall", { publish: true }),
        house.artx(),
        house.dreambook(),
        house.invent(),
        house.video(),
        house.library(),
      ];
    case "labs":
      return [
        house.artx(),
        house.dreambook(),
        house.invent(),
        house.quantum(),
        house.healx(),
        TOOL(Hammer, "The Forge & the Smithy", "Both benches live in this room", { room: "labs" }),
      ];
    case "discover":
      return [
        TOOL(Play, "The Possibilities Realm", "The house's works, full screen", { room: "possibilities" }),
        TOOL(Users, "Resonance Circles", "Find your small room", { room: "circles" }),
        TOOL(Sparkles, "Connections", "Meet the makers", { room: "encounters" }),
        TOOL(CircleQuestionMark, "Living Questions", "What the network asks", { room: "questions" }),
        TOOL(CalendarClock, "Gather Live", "What breathes right now", { room: "live" }),
      ];
    case "possibilities":
      return [
        TOOL(BookOpen, "Publish a finished work", "The realm grows when you hang", { publish: true }),
        TOOL(Waypoints, "The open hall", "The same works, the gallery way", { room: "gathering" }),
        house.library(),
        house.artx(),
      ];
    case "questions":
      return [
        TOOL(CircleQuestionMark, "Ask a living question", "The room itself holds the asking hand", { room: "questions" }),
        TOOL(Users, "Resonance Circles", "Weigh the questions together", { room: "circles" }),
        TOOL(Waypoints, "The open hall", "Where answers become offerings", { room: "gathering" }),
        TOOL(Flame, "Collective Intentions", "Vow what you will do", { room: "intentions" }),
      ];
    case "circles":
      return [
        TOOL(Users, "Resonance Circles", "Join, form, walk away", { room: "circles" }),
        TOOL(MessagesSquare, "Inbox", "The circle's quiet letters", { room: "messages" }),
        TOOL(Sparkles, "Connections", "The makers you may invite", { room: "encounters" }),
        TOOL(Waypoints, "The open hall", "The circles' offerings hang here", { room: "gathering" }),
      ];
    case "laboratory":
      return [
        TOOL(FlaskConical, "The Laboratory", "Benches, mirrors, reviews", { room: "laboratory" }),
        TOOL(Sparkles, "The Mirror Laboratory", "Think beside the mirror", { room: "mirror" }),
        house.healx(),
        house.quantum(),
        TOOL(Wrench, "Invent", "Draft the missing tool", { tool: "invent" }),
      ];
    case "library":
      return [
        house.library(),
        house.dreambook(),
        house.artx(),
        TOOL(BookOpen, "Publish from the shelf", "A kept work may hang in the hall", { publish: true }),
      ];
    case "collaborate":
      return [
        TOOL(LayoutGrid, "Workshops", "Weave an offering further", { room: "collaborate" }),
        TOOL(CircleQuestionMark, "Living Questions", "Find hands that ask alike", { room: "questions" }),
        TOOL(Users, "Resonance Circles", "The small rooms of practice", { room: "circles" }),
        TOOL(Flame, "Collective Intentions", "Speak the vow together", { room: "intentions" }),
      ];
    case "intentions":
      return [
        TOOL(Flame, "Collective Intentions", "The atlas of vows", { room: "intentions" }),
        TOOL(Waypoints, "The open hall", "Vows become offerings here", { room: "gathering" }),
        TOOL(Users, "Resonance Circles", "Hold each other to it", { room: "circles" }),
      ];
    case "live":
      return [
        TOOL(CalendarClock, "Gather Live", "The now of the network", { room: "live" }),
        TOOL(Waypoints, "The open hall", "What was just offered", { room: "gathering" }),
        TOOL(Compass, "Explore", "Find where the pulse walks", { room: "discover" }),
      ];
    case "encounters":
      return [
        TOOL(Sparkles, "Connections", "Follow, walk, wave", { room: "encounters" }),
        TOOL(MessagesSquare, "Inbox", "Letters between makers", { room: "messages" }),
        TOOL(Users, "Resonance Circles", "Rooms you both may enter", { room: "circles" }),
      ];
    case "messages":
      return [
        TOOL(MessagesSquare, "Inbox", "The hall's letters", { room: "messages" }),
        TOOL(Sparkles, "Connections", "Find who to write to", { room: "encounters" }),
        TOOL(UserRound, "My Space", "Your own house", { room: "myspace" }),
      ];
    case "saved":
      return [
        TOOL(Library, "Saved", "The works you keep", { room: "saved" }),
        house.library(),
        TOOL(Waypoints, "The open hall", "Where you kept them from", { room: "gathering" }),
      ];
    case "myspace":
      return [
        TOOL(Settings2, "Settings", "The hall's manners", { room: "settings" }),
        TOOL(ScrollText, "Guidelines", "The hall's promise", { room: "guidelines" }),
        TOOL(Library, "The Library", "Everything you kept", { tool: "library" }),
        TOOL(BookOpen, "Publish a finished work", "Hang what you made", { publish: true }),
      ];
    case "settings":
      return [
        TOOL(Settings2, "Settings", "Identity, tongue, quiet rooms", { room: "settings" }),
        TOOL(UserRound, "My Space", "Back to your house", { room: "myspace" }),
        TOOL(ScrollText, "Guidelines", "The promise you keep", { room: "guidelines" }),
      ];
    case "guidelines":
      return [
        TOOL(ScrollText, "Guidelines", "The hall's promise", { room: "guidelines" }),
        TOOL(Settings2, "Settings", "The manners made personal", { room: "settings" }),
        TOOL(Waypoints, "The open hall", "Back to the offerings", { room: "gathering" }),
      ];
    default:
      return [house.library(), house.dreambook(), house.artx()];
  }
}

export default function WorkplaceLab({
  room,
  roomLabel,
  onNavigate,
  onPublishWork,
  onClose,
}: {
  room: string;
  roomLabel: string;
  onNavigate: (room: string) => void;
  onPublishWork: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const tools = labToolsFor(room);

  const run = (tool: LabTool) => {
    if ("publish" in tool.action) {
      onClose();
      onPublishWork();
    } else if ("room" in tool.action) {
      onClose();
      onNavigate(tool.action.room);
    } else {
      /* the main house's atelier — opened behind the hall */
      useMirror.getState().openToolTab(tool.action.tool);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="lab-veil"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 z-40 flex items-end justify-center sm:items-center"
        style={{ background: "rgba(31,26,16,0.45)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
        role="presentation"
      >
        <motion.div
          key="lab-sheet"
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.985 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={t("The workplace lab of this room")}
          data-testid="workplace-lab"
          className="gp-glass relative flex max-h-[86vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[26px] border border-[#e4d9bd]/70 sm:rounded-[26px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* the lab's crown */}
          <div className="flex items-center gap-3 border-b border-[#eadfca]/60 px-5 py-4">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-white/90"
              style={{
                background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(122,103,70,0.3)",
              }}
            >
              <FlaskConical className="size-5 text-[#8a6f46]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mono-label text-[8.5px] uppercase tracking-[0.24em] text-[#a2947c]">
                {t("the workplace lab")}
              </p>
              <p className="truncate font-[family-name:var(--font-cinzel)] text-[15px] font-semibold text-[#3d3428]">
                {roomLabel}
              </p>
              <p className="truncate text-[11px] text-[#a2947c]">
                {t(ROOM_LINE[room] ?? "Tools and services of this room.")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("Fold the lab")}
              data-testid="workplace-lab-close"
              className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* the tools' shelf */}
          <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tools.map((tool, i) => {
                const TIcon = tool.icon;
                return (
                  <button
                    key={`${tool.label}-${i}`}
                    type="button"
                    onClick={() => run(tool)}
                    data-testid={`lab-tool-${i}`}
                    className={cn(
                      "focus-glow group flex items-center gap-3 rounded-[16px] border border-[#e8dfc9] bg-white/65 px-3.5 py-3 text-left",
                      "transition-all duration-300 hover:border-[#d3c39c] hover:bg-white hover:shadow-[0_4px_14px_-8px_rgba(122,103,70,0.5)]"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-white/90"
                      style={{
                        background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95)",
                      }}
                    >
                      <TIcon className="size-4 text-[#8a6f46]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-[#3d3428]">
                        {t(tool.label)}
                      </span>
                      <span className="block truncate text-[10.5px] text-[#a2947c]">
                        {t(tool.line)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="border-t border-[#eadfca]/60 px-5 py-2.5 text-center text-[10px] italic text-[#a2947c]">
            {t("Every tool walks its real work — nothing here is decoration.")}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

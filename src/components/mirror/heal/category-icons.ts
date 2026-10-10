import {
  Box,
  Flame,
  FlaskConical,
  Heart,
  Lightbulb,
  ShieldCheck,
  Smile,
  Sparkles,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { LabIcon } from "@/lib/data/heal-evolution";

/* The twelve disciplines wear ten glyphs — shared by the scope panel
   and the scope's sidebar register. */

export const CATEGORY_ICONS: Record<LabIcon, LucideIcon> = {
  cube: Box,
  flask: FlaskConical,
  smile: Smile,
  sparkles: Sparkles,
  zap: Zap,
  sun: Sun,
  lightbulb: Lightbulb,
  shield: ShieldCheck,
  heart: Heart,
  flame: Flame,
};

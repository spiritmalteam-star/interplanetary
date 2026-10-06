"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE WINDOW SELECT — the vector windows as one quiet drop-down.     */
/*  The eight scope windows of the quantum world and the four vector   */
/*  windows of Evolve Med no longer sprawl across the composer: one    */
/*  compact pill opens the whole field, and the chat keeps its air.    */
/*                                                                     */
/*  Choosing a window keeps the old one-touch law: the scope routes    */
/*  AND its notes pin into the conversation, both in one touch.        */
/* ------------------------------------------------------------------ */

export interface WindowSelectItem {
  id: string;
  name: string;
  tagline?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function WindowSelect({
  items,
  activeId,
  placeholder,
  onSelect,
  testIdPrefix,
  centered = false,
  accentVar = "--scope-a",
  className,
  triggerClassName,
}: {
  items: WindowSelectItem[];
  activeId: string | null;
  /** The resting label while no window is chosen — the trigger's own word. */
  placeholder: string;
  onSelect: (id: string) => void;
  testIdPrefix: string;
  centered?: boolean;
  /** The accent variable the active state breathes in. */
  accentVar?: string;
  className?: string;
  /** Extra classes for the trigger itself — used when the select floats
      over the chat and needs its own glass to stay legible. */
  triggerClassName?: string;
}) {
  const t = useT();
  const active = activeId ? items.find((s) => s.id === activeId) ?? null : null;
  const ActiveIcon = active?.icon;

  return (
    <div className={cn("flex", centered ? "justify-center" : "justify-start", className)}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          data-testid={`${testIdPrefix}-trigger`}
          aria-label={active ? `${t(placeholder)}: ${t(active.name)}` : t(placeholder)}
          title={active ? t(active.tagline ?? active.name) : t(placeholder)}
          className={cn(
            "focus-glow flex h-8 max-w-full items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition-all duration-300",
            active
              ? "font-semibold text-foreground"
              : "hairline text-muted-foreground hover:text-foreground",
            triggerClassName
          )}
          style={
            active
              ? {
                  borderColor:
                    `color-mix(in srgb, var(${accentVar}) 55%, transparent)`,
                  background:
                    `color-mix(in srgb, var(${accentVar}) 10%, transparent)`,
                }
              : undefined
          }
        >
          {active && ActiveIcon && (
            <ActiveIcon
              className={`size-3 shrink-0 text-[var(${accentVar})]`}
              aria-hidden="true"
            />
          )}
          <span className="min-w-0 truncate">
            {active ? t(active.name) : t(placeholder)}
          </span>
          <ChevronDown
            className="size-3.5 shrink-0 opacity-60"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={centered ? "center" : "start"}
          sideOffset={6}
          className="max-h-[min(420px,var(--radix-dropdown-menu-content-available-height))] w-[min(340px,calc(100vw-2rem))] overflow-y-auto nice-scroll"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => onSelect(item.id)}
                data-testid={`${testIdPrefix}-item-${item.id}`}
                aria-pressed={isActive}
                className={cn(
                  "items-start gap-2.5 rounded-lg px-2.5 py-2",
                  isActive && "bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                )}
              >
                {Icon && (
                  <Icon
                    className="mt-0.5 size-3.5 shrink-0 text-[var(--scope-a)]"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-foreground/90">
                    {t(item.name)}
                  </span>
                  {item.tagline && (
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {t(item.tagline)}
                    </span>
                  )}
                </span>
                {isActive && (
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-[var(--scope-a)]"
                    aria-hidden="true"
                  />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

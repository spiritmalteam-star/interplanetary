"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { SidebarContent } from "./Sidebar";

export function MobileSidebar() {
  const open = useMirror((s) => s.mobileNavOpen);
  const setOpen = useMirror((s) => s.setMobileNavOpen);
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="w-[86vw] max-w-[320px] border-r hairline bg-[var(--glass-bg-strong)] p-0 backdrop-blur-2xl [&>button]:text-muted-foreground"
      >
        <SheetTitle className="sr-only">{t("Galactic Encyclopedia")}</SheetTitle>
        <SheetDescription className="sr-only">{t("Galactic Encyclopedia")}</SheetDescription>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}

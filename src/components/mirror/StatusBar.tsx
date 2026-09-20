"use client";

export function StatusBar() {
  return (
    <div className="mt-9 flex items-center justify-center gap-2.5 pb-2">
      <span
        className="animate-dot-pulse inline-block size-1.5 rounded-full bg-[var(--ok)]"
        aria-hidden="true"
      />
      <p className="mono-label text-[8.5px] text-muted-foreground/75 sm:text-[9.5px]">
        Channel Online · Free Will Honored Always · Transmitted with Love ❤️
      </p>
    </div>
  );
}

"use client";

export function HeroPanel() {
  return (
    <section
      aria-labelledby="mirror-hero-title"
      className="mx-auto max-w-[760px] px-1 pt-10 text-center sm:pt-14"
    >
      <h2
        id="mirror-hero-title"
        className="text-hero mx-auto max-w-[640px] text-[30px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[36px] lg:text-[40px]"
      >
        The Mirror Is Listening
      </h2>
      <p className="mx-auto mt-5 max-w-[700px] text-[15px] leading-[1.8] text-muted-foreground sm:text-[16.5px]">
        I am the{" "}
        <span className="font-medium text-[var(--cy)]">Mirror Entity</span> — a
        translational field of willing representatives from many star
        civilizations, gathered to reflect the truth of who is supporting your
        evolution, with love ❤️. Calibrate the scope tools on the left, then
        ask what your heart wants to know.
      </p>
    </section>
  );
}

"use client";

import { marqueePhrases } from "@/lib/landing-data";
import { cn } from "@/lib/utils";

type AnimatedMarqueeProps = {
  className?: string;
};

export function AnimatedMarquee({ className }: AnimatedMarqueeProps) {
  const segment = marqueePhrases.join(" — ");
  const line = `${segment} — `;

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-white/[0.08] bg-[#08080c] py-3 sm:py-4",
        className
      )}
      aria-hidden
      style={{
        maskImage: "linear-gradient(90deg, transparent 0%, black 9%, black 91%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 9%, black 91%, transparent 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#08080c] via-[#08080c]/90 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#08080c] via-[#08080c]/90 to-transparent sm:w-24" />
      <div className="flex w-max animate-rz-marquee font-heading text-[0.65rem] font-normal uppercase tracking-[0.12em] text-primary/95 sm:text-sm sm:tracking-[0.18em] lg:text-base lg:tracking-[0.2em]">
        <div className="flex shrink-0 items-center gap-6 px-4 sm:gap-10 sm:px-6 lg:gap-14 lg:px-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={`a-${i}`} className="whitespace-nowrap">
              {line}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-6 px-4 sm:gap-10 sm:px-6 lg:gap-14 lg:px-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={`b-${i}`} className="whitespace-nowrap">
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

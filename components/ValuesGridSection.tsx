"use client";

import { coreValues } from "@/lib/landing-data";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionStoryBackdrop } from "@/components/SectionStoryBackdrop";
import { sectionStoryImages } from "@/lib/section-story-images";

export function ValuesGridSection() {
  return (
    <section
      id="valores"
      className="relative scroll-mt-20 overflow-hidden border-t border-white/[0.06] py-20 sm:py-28"
    >
      <SectionStoryBackdrop
        imageSrc={sectionStoryImages.values}
        overlay="medium"
        focal="center"
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="max-w-2xl">
          <h2 className="font-heading text-4xl font-normal uppercase tracking-wide text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.85)] sm:text-5xl">
            Lo que nos mueve
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Principios que guían al movimiento, en la cancha y en la ciudad.
          </p>
        </RevealOnScroll>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {coreValues.map((v, i) => (
            <RevealOnScroll key={v.title} delay={0.04 * i}>
              <div className="group h-full rounded-2xl border border-white/[0.1] bg-[#0e0e12]/82 p-5 ring-1 ring-white/[0.06] backdrop-blur-sm transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:bg-[#14141a]/90 hover:shadow-[0_20px_48px_-18px_rgba(169,146,89,0.1)] motion-reduce:hover:translate-y-0">
                <h3 className="font-heading text-lg font-normal uppercase tracking-wide text-white">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-rz-cream/90">
                  {v.tagline}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { funnelSteps } from "@/lib/landing-data";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionStoryBackdrop } from "@/components/SectionStoryBackdrop";
import { sectionStoryImages } from "@/lib/section-story-images";

export function CommunityFunnelSection() {
  return (
    <section
      id="comunidad"
      className="rz-section relative overflow-hidden border-t border-white/[0.06]"
    >
      <SectionStoryBackdrop
        imageSrc={sectionStoryImages.community}
        overlay="medium"
        focal="left"
        positionY="32%"
      />
      <div className="rz-container relative z-10">
        <RevealOnScroll className="mx-auto max-w-3xl text-center">
          <h2 className="rz-h2 text-balance drop-shadow-[0_2px_20px_rgba(0,0,0,0.85)]">
            De seguidor a hincha fundador
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base lg:text-lg">
            Un camino claro para quien quiere vivir el club desde el primer día.
          </p>
        </RevealOnScroll>

        <div className="mt-10 lg:hidden">
          <div className="flex flex-col gap-4">
            {funnelSteps.map((step, i) => (
              <RevealOnScroll key={step.title} delay={0.05 * i}>
                <article className="flex gap-4 rounded-2xl border border-white/[0.1] bg-[#0e0e12]/85 p-5 ring-1 ring-white/[0.06] backdrop-blur-md">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-sm font-bold text-primary">
                    {step.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <step.icon className="size-4 text-primary" aria-hidden />
                      <h3 className="font-heading text-base font-normal uppercase leading-snug tracking-wide text-white sm:text-lg">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <div className="mt-16 hidden lg:block">
          <div className="relative">
            <div className="absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="grid grid-cols-5 gap-4">
              {funnelSteps.map((step, i) => (
                <RevealOnScroll key={step.title} delay={0.06 * i}>
                  <article className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 flex size-14 items-center justify-center rounded-full border border-primary/35 bg-[#0a0a0f]/95 text-sm font-bold text-primary shadow-[0_0_24px_rgba(169,146,89,0.12)] backdrop-blur-sm">
                      {step.step}
                    </div>
                    <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-white/[0.1] bg-[#0e0e12]/85 p-4 pt-5 ring-1 ring-white/[0.06] backdrop-blur-md">
                      <step.icon className="size-5 text-primary" aria-hidden />
                      <h3 className="font-heading text-sm font-normal uppercase leading-snug tracking-wide text-white">
                        {step.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

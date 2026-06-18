"use client";

import { newGenerationBlocks } from "@/lib/landing-data";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionStoryBackdrop } from "@/components/SectionStoryBackdrop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sectionStoryImages } from "@/lib/section-story-images";

export function NewGenerationSection() {
  return (
    <section className="rz-section relative overflow-hidden border-t border-white/[0.06]">
      <SectionStoryBackdrop
        imageSrc={sectionStoryImages.newGeneration}
        overlay="medium"
        focal="left"
      />
      <div className="rz-container relative z-10">
        <RevealOnScroll className="max-w-3xl">
          <h2 className="rz-h2 drop-shadow-[0_2px_20px_rgba(0,0,0,0.85)]">
            Nacemos desde la raíz de la ciudad
          </h2>
          <p className="mt-4 text-lg text-rz-cream/85">
            Un equipo que honra su origen y activa el desarrollo de toda Zipaquirá.
          </p>
        </RevealOnScroll>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {newGenerationBlocks.map((block, i) => (
            <RevealOnScroll key={block.title} delay={0.06 * i}>
              <Card className="h-full border-white/[0.1] bg-[#101014]/85 ring-1 ring-white/[0.06] backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_56px_-22px_rgba(169,146,89,0.12)] motion-reduce:hover:translate-y-0">
                <CardHeader className="pb-2">
                  <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <block.icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="font-heading text-xl font-normal uppercase tracking-wide text-white">
                    {block.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {block.body}
                  </p>
                </CardContent>
              </Card>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

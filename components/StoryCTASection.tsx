"use client";

import { motion } from "framer-motion";
import { InscripcionButton } from "@/components/InscripcionButton";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionStoryBackdrop } from "@/components/SectionStoryBackdrop";
import { clubName, convocatoriaDateLabel } from "@/lib/brand";
import { sectionStoryImages } from "@/lib/section-story-images";

export function StoryCTASection() {
  return (
    <section
      id="historia"
      className="relative scroll-mt-20 overflow-hidden border-t border-primary/20 py-24 sm:py-32"
    >
      <SectionStoryBackdrop
        imageSrc={sectionStoryImages.storyCta}
        overlay="light"
        focal="right"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/90 via-rz-forest-dark/75 to-background/92"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_55%_at_50%_40%,rgba(169,146,89,0.12),transparent_62%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(169,146,89,0.07),transparent_55%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <RevealOnScroll>
          <h2 className="font-heading text-4xl font-normal uppercase leading-tight tracking-wide text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)] sm:text-5xl lg:text-6xl">
            Esta historia es de todos.
          </h2>
        </RevealOnScroll>
        <RevealOnScroll className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground sm:text-xl" delay={0.06}>
          <p>
            {clubName} empieza con jóvenes que se atreven a probarse. Las convocatorias del{" "}
            {convocatoriaDateLabel} son tu puerta para vestir los colores de la ciudad con
            disciplina, hambre y compromiso.
          </p>
          <motion.p
            className="font-heading text-xl font-normal uppercase tracking-wide text-primary/95 sm:text-2xl"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Si estás leyendo esto, ya haces parte.
          </motion.p>
        </RevealOnScroll>
        <RevealOnScroll className="mt-12" delay={0.1}>
          <InscripcionButton
            label="Inscribirme en las convocatorias"
            className="h-14 min-w-[min(100%,280px)] px-10 text-sm font-semibold uppercase tracking-wide shadow-[0_0_40px_-8px_rgba(169,146,89,0.45)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:scale-[1.04] hover:bg-primary/92 hover:shadow-[0_0_52px_-6px_rgba(169,146,89,0.55)] active:scale-[0.98] sm:text-base motion-reduce:hover:scale-100"
          />
        </RevealOnScroll>
      </div>
    </section>
  );
}

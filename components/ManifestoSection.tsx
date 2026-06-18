"use client";

import { motion } from "framer-motion";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionStoryBackdrop } from "@/components/SectionStoryBackdrop";
import { Separator } from "@/components/ui/separator";
import { fadeInUp, staggerCinematic } from "@/lib/motion";
import { sectionStoryImages } from "@/lib/section-story-images";

export function ManifestoSection() {
  return (
    <section
      id="nosotros"
      className="rz-section relative overflow-hidden border-t border-white/[0.06]"
    >
      <SectionStoryBackdrop
        imageSrc={sectionStoryImages.manifesto}
        overlay="heavy"
        focal="left"
      />
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <h2 className="rz-h2 drop-shadow-[0_2px_20px_rgba(0,0,0,0.85)] lg:text-6xl">
            Nacemos desde la raíz de la ciudad.
          </h2>
        </RevealOnScroll>

        <RevealOnScroll className="mt-10" delay={0.05}>
          <p className="font-heading text-lg font-normal uppercase leading-snug tracking-wide text-primary sm:text-2xl lg:text-3xl">
            Con valores de{" "}
            <span className="text-rz-cream">trabajo</span>,{" "}
            <span className="text-rz-cream">disciplina</span> y{" "}
            <span className="text-rz-cream">resiliencia</span>. Un equipo que honra su origen y
            activa el desarrollo de toda Zipaquirá.
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="mt-12" delay={0.08}>
          <p className="flex flex-col items-center gap-2 font-heading text-center text-2xl font-normal uppercase leading-tight tracking-[0.04em] text-white sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:text-3xl md:text-4xl lg:text-5xl">
            <span>Una ciudad.</span>
            <span className="hidden text-rz-burgundy sm:inline" aria-hidden>·</span>
            <span>Una identidad.</span>
            <span className="hidden text-primary sm:inline" aria-hidden>·</span>
            <span>Un equipo.</span>
          </p>
        </RevealOnScroll>

        <Separator className="my-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <motion.div
          className="space-y-8"
          variants={staggerCinematic}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "0px 0px -80px 0px", amount: 0.15 }}
        >
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl border border-white/[0.1] bg-[#0a0a0f]/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-8"
          >
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Representamos a quienes <span className="font-medium text-primary">madrugan</span>,{" "}
              <span className="font-medium text-primary">entrenan</span>,{" "}
              <span className="font-medium text-primary">trabajan</span>, estudian, emprenden y creen
              que esta ciudad merece una historia propia en el fútbol.
            </p>
          </motion.div>
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl border border-white/[0.1] bg-[#0a0a0f]/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-8"
          >
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              El fútbol no tiene que vivirse solo durante 90 minutos. Queremos que se viva en los{" "}
              <span className="text-rz-cream/90">barrios</span>, en las{" "}
              <span className="text-rz-cream/90">familias</span>, en las canchas, en los colegios, en
              los negocios locales y en cada persona que decida{" "}
              <span className="font-medium text-primary">creer desde el inicio</span>.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

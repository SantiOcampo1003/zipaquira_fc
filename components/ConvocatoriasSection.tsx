"use client";

import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import { Separator } from "@/components/ui/separator";
import {
  clubName,
  convocatoriaDateFull,
  convocatoriaDateLabel,
  convocatoriaHeadline,
} from "@/lib/brand";
import { convocatoriaHighlights, convocatoriaSteps } from "@/lib/landing-data";
import { InscripcionButton } from "./InscripcionButton";

export function ConvocatoriasSection() {
  return (
    <section
      id="convocatorias"
      className="scroll-mt-20 border-t border-primary/25 bg-gradient-to-b from-[#121215] via-[#0e1210] to-[#121215] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center">
          <SectionBadge>{convocatoriaHeadline}</SectionBadge>
          <h2 className="mt-6 font-heading text-4xl font-normal uppercase leading-tight tracking-wide text-white sm:text-5xl">
            Tu oportunidad es el{" "}
            <span className="text-primary">{convocatoriaDateLabel}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {clubName} abre sus convocatorias para jugadores. Completa la ficha oficial con tus
            datos deportivos y personales para participar el {convocatoriaDateFull}.
          </p>
          <Separator className="mx-auto mt-8 max-w-xs bg-primary/30" />
        </RevealOnScroll>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {convocatoriaHighlights.map((item, i) => (
            <RevealOnScroll key={item.title} delay={0.05 * i}>
              <article className="flex h-full gap-4 rounded-2xl border border-white/[0.08] bg-[#18181B]/70 p-5 ring-1 ring-white/[0.04]">
                <item.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="font-heading text-sm font-normal uppercase tracking-wide text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-12" delay={0.08}>
          <div className="rounded-2xl border border-primary/25 bg-rz-forest/30 p-6 sm:p-8">
            <h3 className="font-heading text-lg font-normal uppercase tracking-wide text-white">
              Cómo inscribirte
            </h3>
            <ol className="mt-5 space-y-3">
              {convocatoriaSteps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <InscripcionButton
                label="Completar ficha e inscribirme"
                className="h-14 min-h-12 w-full gap-2 bg-primary px-8 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-[0_0_40px_-8px_rgba(169,146,89,0.45)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:scale-[1.03] hover:bg-primary/92 hover:shadow-[0_0_52px_-6px_rgba(169,146,89,0.55)] active:scale-[0.98] sm:w-auto motion-reduce:hover:scale-100"
              />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Se abrirá el formulario oficial en una nueva pestaña.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

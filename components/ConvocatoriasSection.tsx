"use client";

import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import { Separator } from "@/components/ui/separator";
import {
  clubName,
  convocatoriaClosedDetail,
  convocatoriaClosedMessage,
  convocatoriaDateFull,
  convocatoriaDateLabel,
  convocatoriaHeadline,
  convocatoriaRegistrationStatusLabel,
} from "@/lib/brand";
import { convocatoriaHighlights, convocatoriaSteps } from "@/lib/landing-data";
import { InscripcionButton } from "./InscripcionButton";

export function ConvocatoriasSection() {
  return (
    <section
      id="convocatorias"
      className="rz-section scroll-mt-[3.5rem] border-t border-primary/25 bg-gradient-to-b from-[#121215] via-[#0e1210] to-[#121215] sm:scroll-mt-16"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center">
          <SectionBadge>{convocatoriaHeadline}</SectionBadge>
          <h2 className="rz-h2 mt-5 text-balance sm:mt-6">
            Inscripciones{" "}
            <span className="text-primary">{convocatoriaRegistrationStatusLabel.toLowerCase()}</span>
            {" · "}
            <span className="text-white">{convocatoriaDateLabel}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
            {convocatoriaClosedMessage} Las convocatorias de {clubName} se realizan el{" "}
            {convocatoriaDateFull}.
          </p>
          <Separator className="mx-auto mt-8 max-w-xs bg-primary/30" />
        </RevealOnScroll>

        <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
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
          <div className="rounded-2xl border border-primary/25 bg-rz-forest/30 p-4 sm:p-6 lg:p-8">
            <h3 className="font-heading text-lg font-normal uppercase tracking-wide text-white">
              Estado de inscripciones
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {convocatoriaClosedDetail}
            </p>
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
                className="h-14 min-h-12 w-full gap-2 px-8 text-sm font-semibold uppercase tracking-wide sm:w-auto"
              />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              El registro en línea ya no está disponible.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

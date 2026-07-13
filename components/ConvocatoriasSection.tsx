"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { ConvocatoriaCtas } from "@/components/ConvocatoriaCtas";
import { InscripcionButton } from "@/components/InscripcionButton";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import { Separator } from "@/components/ui/separator";
import {
  clubName,
  convocatoriaCalls,
  convocatoriaDateLabel,
  convocatoriaHeadline,
  convocatoriaOpenDetail,
  convocatoriaReopenMessage,
  convocatoriaRegistrationStatusLabel,
} from "@/lib/brand";
import { convocatoriaHighlights, convocatoriaSteps, convocatoriaTeams } from "@/lib/landing-data";

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
            {convocatoriaReopenMessage} {clubName} convoca en dos fechas distintas según tu
            categoría.
          </p>
          <Separator className="mx-auto mt-8 max-w-xs bg-primary/30" />
        </RevealOnScroll>

        <div className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-2">
          {convocatoriaCalls.map((call, i) => (
            <RevealOnScroll key={call.id} delay={0.05 * i}>
              <article className="flex h-full flex-col rounded-2xl border border-primary/25 bg-[#18181B]/80 p-5 ring-1 ring-primary/10 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  {call.audience}
                </p>
                <h3 className="mt-3 font-heading text-lg font-normal uppercase tracking-wide text-white">
                  {call.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {call.presentationDetail}
                </p>
                <div className="mt-5 space-y-2 text-sm text-rz-cream/90">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
                    {call.dateFull}
                  </p>
                  {call.timeLabel ? (
                    <p className="flex items-center gap-2">
                      <Clock3 className="size-4 shrink-0 text-primary" aria-hidden />
                      {call.timeLabel}
                    </p>
                  ) : null}
                </div>
                <div className="mt-6">
                  <InscripcionButton
                    label={call.inscripcionLabel}
                    className="h-12 w-full px-6 text-xs font-semibold uppercase tracking-wide sm:text-sm"
                  />
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-10 sm:mt-12">
          <h3 className="text-center font-heading text-lg font-normal uppercase tracking-wide text-white">
            Tres grupos, un solo club
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
            {convocatoriaOpenDetail}
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {convocatoriaTeams.map((team, i) => (
              <RevealOnScroll key={team.title} delay={0.05 * i}>
                <article className="flex h-full flex-col gap-4 rounded-2xl border border-primary/20 bg-[#18181B]/80 p-5 ring-1 ring-primary/10">
                  <team.icon className="size-5 text-primary" aria-hidden />
                  <div>
                    <h4 className="font-heading text-sm font-normal uppercase tracking-wide text-white">
                      {team.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {team.description}
                    </p>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
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
            <div className="mt-8 flex justify-center">
              <ConvocatoriaCtas
                buttonClassName="h-14 min-h-12 gap-2 px-8 text-sm font-semibold uppercase tracking-wide"
                primaryButtonClassName="bg-primary text-primary-foreground shadow-[0_0_40px_-8px_rgba(169,146,89,0.45)] hover:bg-primary/92"
                secondaryButtonClassName="border border-primary/35 bg-primary/10 text-primary hover:bg-primary/15"
              />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Ambos botones abren el mismo formulario oficial en una nueva pestaña.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

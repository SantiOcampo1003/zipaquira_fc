"use client";

import { playerPillars } from "@/lib/landing-data";
import { clubName, convocatoriaDateLabel } from "@/lib/brand";
import { InscripcionButton } from "@/components/InscripcionButton";
import { Button } from "@/components/ui/button";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { scrollToId } from "@/lib/scroll";

export function PlayersSection() {
  return (
    <section id="jugadores" className="rz-section border-t border-white/[0.06] bg-background">
      <div className="rz-container">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <RevealOnScroll className="min-w-0">
            <h2 className="rz-h2 text-balance">
              Convocatorias {convocatoriaDateLabel}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base lg:text-lg xl:text-xl">
              Si quieres representar a tu ciudad, competir con disciplina y crecer dentro de un
              proyecto serio, {clubName} quiere conocerte. Completa la ficha del jugador para
              inscribirte.
            </p>
            <div className="rz-cta-row mt-8 sm:mt-10">
              <InscripcionButton
                label="Completar ficha e inscribirme"
                className="h-12 w-full px-6 text-sm font-semibold uppercase tracking-wide sm:w-auto sm:px-8"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => scrollToId("galeria")}
                className="h-12 w-full border-white/15 bg-transparent px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-white/10 sm:w-auto"
              >
                Galería del club
              </Button>
            </div>
          </RevealOnScroll>

          <div className="grid gap-4 sm:grid-cols-2">
            {playerPillars.map((p, i) => (
              <RevealOnScroll key={p.title} delay={0.06 * i}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-[#18181B]/60 p-5 ring-1 ring-white/[0.04]">
                  <p.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-3 font-heading text-base font-normal uppercase tracking-wide text-white">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

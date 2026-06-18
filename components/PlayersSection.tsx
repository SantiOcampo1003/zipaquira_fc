"use client";

import { playerPillars } from "@/lib/landing-data";
import { clubName, convocatoriaDateLabel } from "@/lib/brand";
import { InscripcionButton } from "@/components/InscripcionButton";
import { Button } from "@/components/ui/button";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { scrollToId } from "@/lib/scroll";

export function PlayersSection() {
  return (
    <section id="jugadores" className="scroll-mt-20 border-t border-white/[0.06] bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <RevealOnScroll>
            <h2 className="font-heading text-4xl font-normal uppercase leading-tight tracking-wide text-white sm:text-5xl">
              Convocatorias {convocatoriaDateLabel}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Si quieres representar a tu ciudad, competir con disciplina y crecer dentro de un
              proyecto serio, {clubName} quiere conocerte. Completa la ficha del jugador para
              inscribirte.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <InscripcionButton
                label="Completar ficha e inscribirme"
                className="h-12 px-8 text-sm font-semibold uppercase tracking-wide"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => scrollToId("galeria")}
                className="h-12 border-white/15 bg-transparent px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-white/10"
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

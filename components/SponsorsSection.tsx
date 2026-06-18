"use client";

import { sponsorOffers } from "@/lib/landing-data";
import { buttonVariants } from "@/components/ui/button";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { cn } from "@/lib/utils";

export function SponsorsSection() {
  return (
    <section id="patrocinadores" className="rz-section border-t border-white/[0.06] bg-[#121215]">
      <div className="rz-container">
        <RevealOnScroll className="mx-auto max-w-3xl text-center">
          <h2 className="rz-h2 text-balance">
            Marcas que crecen con la comunidad
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base lg:text-lg xl:text-xl">
            No buscamos solo logos en una camiseta. Queremos aliados que crean en Zipaquirá, en su
            gente y en el poder del deporte para conectar marcas con comunidad real.
          </p>
        </RevealOnScroll>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sponsorOffers.map((item, i) => (
            <RevealOnScroll key={item.title} delay={0.04 * i}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-[#18181B]/60 p-6 ring-1 ring-white/[0.04] transition-shadow hover:shadow-lift">
                <h3 className="font-heading text-lg font-normal uppercase tracking-wide text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-10 flex justify-center sm:mt-12">
          <a
            href="https://wa.me/573001234567"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants(),
              "h-12 w-full max-w-md px-6 text-xs font-semibold uppercase tracking-wide sm:w-auto sm:px-8 sm:text-sm"
            )}
          >
            Quiero ser patrocinador
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}

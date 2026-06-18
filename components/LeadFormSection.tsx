"use client";

import { LeadForm } from "@/components/LeadForm";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { Separator } from "@/components/ui/separator";
import { clubName } from "@/lib/brand";

export function LeadFormSection() {
  return (
    <section
      id="unete"
      className="scroll-mt-20 border-t border-white/[0.06] bg-[#121215] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center">
          <h2 className="font-heading text-4xl font-normal uppercase tracking-wide text-white sm:text-5xl">
            Únete a la comunidad fundadora
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Déjanos tus datos y sé parte de las primeras personas en construir {clubName}.
          </p>
          <Separator className="mx-auto mt-8 max-w-xs bg-white/10" />
        </RevealOnScroll>

        <RevealOnScroll className="mt-12" delay={0.08}>
          <LeadForm />
        </RevealOnScroll>
      </div>
    </section>
  );
}

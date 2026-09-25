import { ExternalLink } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import { Separator } from "@/components/ui/separator";
import {
  convocatoriaFemeninaBody,
  convocatoriaFemeninaCategoryLabel,
  convocatoriaFemeninaCtaLabel,
  convocatoriaFemeninaDateLabel,
  convocatoriaFemeninaFormUrl,
  convocatoriaFemeninaHeadline,
} from "@/lib/brand";

export function ConvocatoriaFemeninaSection() {
  return (
    <section
      id="convocatorias"
      className="rz-section scroll-mt-[3.5rem] bg-background pt-10 sm:scroll-mt-16 sm:pt-14"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <RevealOnScroll>
          <SectionBadge>Fútbol femenino</SectionBadge>
          <h2 className="rz-h2 mt-5 text-balance sm:mt-6">{convocatoriaFemeninaHeadline}</h2>
          <p className="mt-3 font-heading text-sm uppercase tracking-wide text-primary sm:text-base">
            {convocatoriaFemeninaCategoryLabel}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {convocatoriaFemeninaBody}
          </p>
          <Separator className="mx-auto mt-8 max-w-xs bg-primary/30" />
        </RevealOnScroll>

        <RevealOnScroll className="mt-8" delay={0.05}>
          <p className="font-heading text-sm uppercase tracking-wide text-primary sm:text-base">
            {convocatoriaFemeninaDateLabel}
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="mt-8 flex justify-center" delay={0.1}>
          <a
            href={convocatoriaFemeninaFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 font-heading text-sm uppercase tracking-wider text-primary-foreground shadow-[0_0_24px_rgba(169,146,89,0.4)] transition hover:bg-primary/90"
          >
            {convocatoriaFemeninaCtaLabel}
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}

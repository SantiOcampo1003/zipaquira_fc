import Link from "next/link";
import { Ticket } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";

export function BuyTicketSection() {
  return (
    <section
      id="compra-tu-boleta"
      className="rz-section scroll-mt-[3.5rem] bg-gradient-to-b from-[#09110d] via-[#121215] to-[#09110d] py-10 sm:scroll-mt-16 sm:py-14"
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <RevealOnScroll>
          <SectionBadge>Partido vs Caquetá</SectionBadge>
          <h2 className="rz-h2 mt-3 text-balance sm:mt-4">
            Compra tu boleta
            <span className="mt-1 block text-primary">en línea, en segundos</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Elige tu silla en el mapa del estadio, paga en línea y recibe tu boleta en PDF con
            código QR directo a tu correo.
          </p>
          <Link
            href="/boletas"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Ticket className="mr-2 size-4" />
            Comprar boleta
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}

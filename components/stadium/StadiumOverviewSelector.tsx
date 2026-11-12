"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Ticket } from "lucide-react";
import { BoletaCheckoutSection } from "@/components/stadium/BoletaCheckoutSection";
import { GeneralTicketCheckoutSection } from "@/components/stadium/GeneralTicketCheckoutSection";
import { CATEDRAL_TICKET_PRICE_COP, GENERAL_TICKET_PRICE_COP, formatCop } from "@/lib/stadium-seating";
import { cn } from "@/lib/utils";

type StandZone = "catedral" | "general";

/**
 * Posiciones en % sobre la foto aérea (estadio-aereo.png), ajustadas a cada
 * tribuna real: General = techo gris arriba, Catedral = techo azul abajo.
 * El rótulo queda centrado justo encima de su tribuna.
 */
const HOTSPOTS: Record<StandZone, { left: string; top: string; width: string; height: string; label: string }> = {
  general: { left: "37.5%", top: "1.2%", width: "22%", height: "14%", label: "General" },
  catedral: { left: "27%", top: "85%", width: "41%", height: "13.5%", label: "Catedral" },
};

export function StadiumOverviewSelector({
  matchLabel,
  userEmail,
}: {
  matchLabel: string;
  userEmail: string;
}) {
  const [zone, setZone] = useState<StandZone | null>(null);

  if (zone === "catedral") {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <BackButton onClick={() => setZone(null)} />
        <BoletaCheckoutSection matchLabel={matchLabel} userEmail={userEmail} />
      </div>
    );
  }

  if (zone === "general") {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 lg:px-8">
        <BackButton onClick={() => setZone(null)} />
        <GeneralTicketCheckoutSection matchLabel={matchLabel} userEmail={userEmail} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="font-heading text-2xl uppercase text-white sm:text-3xl">Elige tu tribuna</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Toca una zona del estadio para ver el precio y comprar tu boleta.
      </p>

      <div className="relative mt-6 w-full overflow-hidden rounded-2xl border border-primary/25" style={{ aspectRatio: "2376 / 1678" }}>
        <Image
          src="/images/estadio-aereo.png"
          alt="Vista aérea del Estadio Héctor El Zipa González"
          fill
          sizes="(min-width: 1024px) 960px, 100vw"
          className="object-cover"
          priority
        />

        {(Object.entries(HOTSPOTS) as [StandZone, (typeof HOTSPOTS)[StandZone]][]).map(([id, spot]) => (
          <button
            key={id}
            type="button"
            onClick={() => setZone(id)}
            style={{ left: spot.left, top: spot.top, width: spot.width, height: spot.height }}
            className={cn(
              "group absolute flex items-center justify-center rounded-xl border-2 border-primary/0 bg-primary/0 transition-colors",
              "hover:border-primary/70 hover:bg-primary/20 focus:border-primary/70 focus:bg-primary/20 focus:outline-none"
            )}
          >
            <span className="flex flex-col items-center gap-0.5 whitespace-nowrap rounded-lg bg-black/70 px-2 py-1 sm:gap-1 sm:px-4 sm:py-2 opacity-90 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <span className="font-heading text-xs uppercase tracking-wide text-white sm:text-lg">
                {spot.label}
              </span>
              <span className="text-[10px] text-primary sm:text-xs">
                {formatCop(id === "catedral" ? CATEDRAL_TICKET_PRICE_COP : GENERAL_TICKET_PRICE_COP)}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Ticket className="size-3.5 shrink-0 text-primary" />
        Catedral: silla numerada en el mapa. General: sin silla asignada, el espacio se escoge al llegar.
      </p>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-white"
    >
      <ArrowLeft className="size-3.5" />
      Cambiar de tribuna
    </button>
  );
}

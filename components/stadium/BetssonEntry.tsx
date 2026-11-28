"use client";

import { useState } from "react";
import { ArrowLeft, Armchair, Users } from "lucide-react";
import { BetssonLogo } from "@/components/stadium/BetssonLogo";
import { BoletaCheckoutSection } from "@/components/stadium/BoletaCheckoutSection";

/** Betsson patrocina el partido: primero se elige la tribuna (Catedral con silla o General sin silla). */
export function BetssonEntry({ matchLabel, userEmail }: { matchLabel: string; userEmail: string }) {
  const [tribuna, setTribuna] = useState<"catedral" | "general" | null>(null);

  if (tribuna) {
    return (
      <div>
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setTribuna(null)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Cambiar de tribuna
          </button>
        </div>
        <BoletaCheckoutSection matchLabel={matchLabel} userEmail={userEmail} mode="betsson" betssonTribuna={tribuna} />
      </div>
    );
  }

  const options = [
    {
      id: "catedral" as const,
      Icon: Armchair,
      title: "Catedral de Sal",
      desc: "Silla numerada: eliges tu puesto en el mapa del estadio.",
    },
    {
      id: "general" as const,
      Icon: Users,
      title: "General",
      desc: "Entrada sin silla numerada.",
    },
  ];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-10 text-white">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <BetssonLogo className="text-4xl" />
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">patrocina tu partido</span>
      </div>
      <h1 className="mt-4 font-heading text-2xl uppercase">¿En qué tribuna quieres entrar?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Con tu registro en Betsson la entrada es gratis en las dos tribunas.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {options.map(({ id, Icon, title, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTribuna(id)}
            className="rounded-2xl border border-[#F26B21]/30 bg-[#18181B]/90 p-5 text-left transition-colors hover:border-[#F26B21]/70"
          >
            <Icon className="size-7 text-[#F26B21]" />
            <p className="mt-3 font-heading text-lg uppercase text-white">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

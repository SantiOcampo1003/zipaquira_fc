"use client";

import { MvpBanner } from "@/components/matches/MvpBanner";
import { PitchLineup } from "@/components/matches/PitchLineup";
import { PlayerRatingPanel } from "@/components/matches/PlayerRatingPanel";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import { formatMatchDate, formatMatchScore } from "@/lib/match-utils";
import { clubNameUpper } from "@/lib/brand";
import type { MatchDisplay } from "@/lib/types/match";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { useState } from "react";

type MatchLineupViewerProps = {
  matches: MatchDisplay[];
};

function statusLabel(status: MatchDisplay["status"]): string {
  switch (status) {
    case "played":
      return "Jugado";
    case "cancelled":
      return "Cancelado";
    default:
      return "Por jugar";
  }
}

export function MatchLineupViewer({ matches }: MatchLineupViewerProps) {
  const defaultSlug =
    matches.find((m) => m.is_featured)?.slug ?? matches[0]?.slug ?? "";
  const [activeSlug, setActiveSlug] = useState(defaultSlug);
  const active = matches.find((m) => m.slug === activeSlug) ?? matches[0];

  if (!active) return null;

  const score = formatMatchScore(active);
  const dateLabel = formatMatchDate(active.match_date);

  return (
    <section
      id="partidos"
      className="rz-section scroll-mt-[3.5rem] border-t border-white/[0.06] bg-background sm:scroll-mt-16"
    >
      <div className="rz-container">
        <RevealOnScroll className="text-center">
          <SectionBadge>Convocatoria · Calificaciones</SectionBadge>
          <h2 className="rz-h2 mt-5 text-balance sm:mt-6">Partidos y alineación</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Titulares en cancha, suplentes en banquillo y las calificaciones de la hinchada. Solo
            los 18 convocados reciben voto.
          </p>
        </RevealOnScroll>

        {matches.length > 1 ? (
          <RevealOnScroll className="mt-8 flex flex-wrap justify-center gap-2" delay={0.05}>
            {matches.map((match) => (
              <button
                key={match.slug}
                type="button"
                onClick={() => setActiveSlug(match.slug)}
                className={cn(
                  "rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                  match.slug === active.slug
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
                )}
              >
                vs {match.opponent}
                {match.is_featured ? " ★" : ""}
              </button>
            ))}
          </RevealOnScroll>
        ) : null}

        <RevealOnScroll className="mt-10" delay={0.08}>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215]/80 ring-1 ring-white/[0.04]">
            <div className="border-b border-white/[0.06] px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {active.competition}
                  </p>
                  <h3 className="mt-2 font-heading text-2xl uppercase tracking-wide text-white sm:text-3xl">
                    {clubNameUpper}{" "}
                    <span className="text-muted-foreground">vs</span> {active.opponent}
                  </h3>
                  {score ? (
                    <p className="mt-2 font-heading text-3xl text-primary sm:text-4xl">{score}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <CalendarDays className="size-4 text-primary" aria-hidden />
                    <span className="capitalize">{dateLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <MapPin className="size-4 text-primary" aria-hidden />
                    {active.venue}
                    {active.is_home ? " · Local" : " · Visitante"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <Trophy className="size-4 text-primary" aria-hidden />
                    {active.formation} · {statusLabel(active.status)}
                  </span>
                </div>
              </div>
            </div>

            {active.mvp ? <MvpBanner mvp={active.mvp} opponent={active.opponent} /> : null}

            <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
              <PitchLineup match={active} />

              <PlayerRatingPanel key={active.id} match={active} />
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

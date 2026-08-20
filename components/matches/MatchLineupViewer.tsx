"use client";

import { useFanAuth } from "@/components/auth/FanAuthProvider";
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
  const { user, loading: authLoading } = useFanAuth();
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
      <div className="rz-container min-w-0">
        <RevealOnScroll className="text-center">
          <SectionBadge>Convocatoria · Calificaciones</SectionBadge>
          <h2 className="rz-h2 mt-5 text-balance sm:mt-6">Partidos y alineación</h2>
          <p className="mx-auto mt-4 max-w-2xl px-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Titulares en cancha, suplentes en banquillo y las calificaciones de la hinchada. Solo
            los 18 convocados reciben voto.
          </p>
        </RevealOnScroll>

        {matches.length > 1 ? (
          <RevealOnScroll
            className="mt-6 flex flex-wrap justify-center gap-1.5 sm:mt-8 sm:gap-2"
            delay={0.05}
          >
            {matches.map((match) => (
              <button
                key={match.slug}
                type="button"
                onClick={() => setActiveSlug(match.slug)}
                className={cn(
                  "max-w-full truncate rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-4 sm:py-2 sm:text-[11px]",
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

        <RevealOnScroll className="mt-8 min-w-0 sm:mt-10" delay={0.08}>
          <div className="overflow-x-clip rounded-xl border border-white/[0.08] bg-[#121215]/80 ring-1 ring-white/[0.04] sm:rounded-2xl">
            <div className="border-b border-white/[0.06] px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
              <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {active.competition}
                  </p>
                  <h3 className="mt-1.5 break-words font-heading text-xl uppercase tracking-wide text-white sm:mt-2 sm:text-2xl md:text-3xl">
                    {clubNameUpper}{" "}
                    <span className="text-muted-foreground">vs</span> {active.opponent}
                  </h3>
                  {score ? (
                    <p className="mt-2 font-heading text-2xl text-primary sm:text-3xl md:text-4xl">
                      {score}
                    </p>
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-wrap gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
                    <CalendarDays className="size-3.5 shrink-0 text-primary sm:size-4" aria-hidden />
                    <span className="min-w-0 capitalize">{dateLabel}</span>
                  </span>
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
                    <MapPin className="size-3.5 shrink-0 text-primary sm:size-4" aria-hidden />
                    <span className="min-w-0 break-words">
                      {active.venue}
                      {active.is_home ? " · Local" : " · Visitante"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
                    <Trophy className="size-3.5 shrink-0 text-primary sm:size-4" aria-hidden />
                    {active.formation} · {statusLabel(active.status)}
                  </span>
                </div>
              </div>
            </div>

            {active.mvp ? <MvpBanner mvp={active.mvp} opponent={active.opponent} /> : null}

            {/* Columna única en móvil/iPad portrait; 2 cols desde lg landscape / desktop */}
            <div className="grid min-w-0 gap-6 px-3 py-5 sm:gap-8 sm:px-6 sm:py-6 md:px-8 md:py-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] xl:items-start">
              <PitchLineup match={active} showCrowdRatings={!!user && !authLoading} />
              <PlayerRatingPanel key={active.id} match={active} />
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

"use client";

import { getPitchPoint, normalizeStarterSlots } from "@/lib/formations";
import { playerShortName } from "@/lib/match-utils";
import type { MatchDisplay, SquadPlayer } from "@/lib/types/match";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

function PitchPlayer({
  entry,
  formation,
  showCrowdRatings,
}: {
  entry: SquadPlayer;
  formation: string;
  showCrowdRatings: boolean;
}) {
  const slot = entry.pitch_slot;
  if (!slot) return null;

  const point = getPitchPoint(formation, slot);
  if (!point) return null;

  const lastName = playerShortName(entry.player.full_name);

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      <div className="flex max-w-[2.85rem] flex-col items-center gap-0.5 sm:max-w-[3.75rem] md:max-w-[4.5rem] lg:max-w-[5rem]">
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-primary/60 bg-[#0B2810] font-heading font-bold text-primary shadow-[0_4px_16px_rgba(0,0,0,0.45)] ring-2 ring-black/30",
            "size-7 text-[10px] sm:size-9 sm:text-xs md:size-10 md:text-sm lg:size-11 lg:text-base"
          )}
        >
          {entry.player.jersey_number}
        </div>
        <p className="w-full truncate text-center text-[7px] font-medium leading-tight text-white/90 sm:text-[9px] md:text-[10px]">
          {lastName}
        </p>
        {showCrowdRatings && entry.avg_rating != null ? (
          <p
            className="flex items-center gap-0.5 text-[7px] font-semibold text-primary sm:text-[9px] md:text-[10px]"
            title="Promedio de la hinchada"
          >
            <Star className="size-2 fill-primary sm:size-2.5 md:size-3" aria-hidden />
            {entry.avg_rating.toFixed(1)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BenchPlayer({
  entry,
  showCrowdRatings,
}: {
  entry: SquadPlayer;
  showCrowdRatings: boolean;
}) {
  const lastName = playerShortName(entry.player.full_name);

  return (
    <div className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-1.5 py-2 ring-1 ring-white/[0.04] sm:w-[5rem] sm:px-2 sm:py-2.5 md:w-[5.25rem]">
      <div className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-[#18181B] text-xs font-bold text-white sm:size-9 sm:text-sm">
        {entry.player.jersey_number}
      </div>
      <p className="w-full truncate text-center text-[9px] font-medium text-white/85 sm:text-[10px]">
        {lastName}
      </p>
      <p className="w-full truncate text-center text-[8px] uppercase tracking-wide text-muted-foreground sm:text-[9px]">
        {entry.player.position_detail ?? entry.player.position}
      </p>
      {showCrowdRatings && entry.avg_rating != null ? (
        <p className="flex items-center gap-0.5 text-[9px] font-semibold text-primary sm:text-[10px]">
          <Star className="size-2.5 fill-primary" aria-hidden />
          {entry.avg_rating.toFixed(1)}
          <span className="font-normal text-muted-foreground">({entry.vote_count})</span>
        </p>
      ) : null}
    </div>
  );
}

type PitchLineupProps = {
  match: MatchDisplay;
  showCrowdRatings?: boolean;
};

export function PitchLineup({ match, showCrowdRatings = false }: PitchLineupProps) {
  const squad = normalizeStarterSlots(
    match.squad.map((entry) => ({
      ...entry,
      player_id: entry.player.id,
    })),
    match.formation
  );
  const starters = squad.filter((p) => p.is_starter);
  const bench = squad.filter((p) => !p.is_starter);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      {/* Cancha: inset interno para que dorsales/nombres no se corten en los bordes */}
      <div className="relative mx-auto w-full max-w-[20rem] overflow-hidden rounded-xl border border-white/10 shadow-[inset_0_0_80px_rgba(0,0,0,0.35)] sm:max-w-md sm:rounded-2xl md:max-w-lg lg:max-w-xl">
        <div className="relative aspect-[68/105] w-full">
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#1a5c2e] via-[#0f4a24] to-[#0a3a1c]"
            aria-hidden
          />
          <div className="absolute inset-[5%] rounded-lg border border-white/25 sm:inset-[6%]" aria-hidden />
          <div
            className="absolute left-[5%] right-[5%] top-1/2 h-px -translate-y-1/2 bg-white/20 sm:left-[6%] sm:right-[6%]"
            aria-hidden
          />
          <div
            className="absolute left-1/2 top-1/2 size-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"
            aria-hidden
          />
          <div
            className="absolute bottom-[5%] left-1/2 h-[14%] w-[44%] -translate-x-1/2 rounded-t-lg border border-b-0 border-white/20 sm:bottom-[6%]"
            aria-hidden
          />
          <div
            className="absolute left-[5%] right-[5%] top-[5%] h-[14%] rounded-b-lg border border-t-0 border-white/20 sm:left-[6%] sm:right-[6%] sm:top-[6%]"
            aria-hidden
          />

          {/* Zona segura: jugadores no llegan al borde del clip */}
          <div className="absolute inset-[4%] sm:inset-[3%] md:inset-[2.5%]">
            {starters.map((entry) => (
              <PitchPlayer
                key={entry.id}
                entry={entry}
                formation={match.formation}
                showCrowdRatings={showCrowdRatings}
              />
            ))}
          </div>
        </div>
      </div>

      {bench.length > 0 ? (
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:mb-3">
            Banquillo · {bench.length} suplentes
          </p>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
            {bench.map((entry) => (
              <BenchPlayer key={entry.id} entry={entry} showCrowdRatings={showCrowdRatings} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { getPitchPoint, normalizeStarterSlots } from "@/lib/formations";
import { playerShortName } from "@/lib/match-utils";
import type { MatchDisplay, SquadPlayer } from "@/lib/types/match";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

function PitchPlayer({
  entry,
  formation,
  compact,
}: {
  entry: SquadPlayer;
  formation: string;
  compact?: boolean;
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
      <div
        className={cn(
          "flex flex-col items-center gap-0.5",
          compact ? "max-w-[3.25rem]" : "max-w-[4.5rem] sm:max-w-[5.5rem]"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-primary/60 bg-[#0B2810] font-heading font-bold text-primary shadow-[0_4px_16px_rgba(0,0,0,0.45)] ring-2 ring-black/30",
            compact ? "size-8 text-[11px]" : "size-10 text-sm sm:size-11 sm:text-base"
          )}
        >
          {entry.player.jersey_number}
        </div>
        <p
          className={cn(
            "w-full truncate text-center font-medium leading-tight text-white/90",
            compact ? "text-[8px]" : "text-[9px] sm:text-[10px]"
          )}
        >
          {lastName}
        </p>
        {entry.avg_rating != null ? (
          <p
            className={cn(
              "flex items-center gap-0.5 font-semibold text-primary",
              compact ? "text-[8px]" : "text-[9px] sm:text-[10px]"
            )}
          >
            <Star className={compact ? "size-2.5 fill-primary" : "size-3 fill-primary"} aria-hidden />
            {entry.avg_rating.toFixed(1)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BenchPlayer({ entry }: { entry: SquadPlayer }) {
  const lastName = playerShortName(entry.player.full_name);

  return (
    <div className="flex min-w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2.5 ring-1 ring-white/[0.04] sm:min-w-[5.25rem]">
      <div className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-[#18181B] text-sm font-bold text-white">
        {entry.player.jersey_number}
      </div>
      <p className="w-full truncate text-center text-[10px] font-medium text-white/85">{lastName}</p>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
        {entry.player.position_detail ?? entry.player.position}
      </p>
      {entry.avg_rating != null ? (
        <p className="flex items-center gap-0.5 text-[10px] font-semibold text-primary">
          <Star className="size-2.5 fill-primary" aria-hidden />
          {entry.avg_rating.toFixed(1)}
          <span className="font-normal text-muted-foreground">({entry.vote_count})</span>
        </p>
      ) : (
        <p className="text-[9px] text-muted-foreground">Sin votos</p>
      )}
    </div>
  );
}

type PitchLineupProps = {
  match: MatchDisplay;
};

export function PitchLineup({ match }: PitchLineupProps) {
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
    <div className="space-y-5">
      <div className="relative mx-auto aspect-[68/105] w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0_0_80px_rgba(0,0,0,0.35)]">
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#1a5c2e] via-[#0f4a24] to-[#0a3a1c]"
          aria-hidden
        />
        <div
          className="absolute inset-[6%] rounded-lg border border-white/25"
          aria-hidden
        />
        <div
          className="absolute left-[6%] right-[6%] top-1/2 h-px -translate-y-1/2 bg-white/20"
          aria-hidden
        />
        <div
          className="absolute left-1/2 top-1/2 size-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"
          aria-hidden
        />
        <div
          className="absolute bottom-[6%] left-1/2 h-[14%] w-[44%] -translate-x-1/2 rounded-t-lg border border-b-0 border-white/20"
          aria-hidden
        />
        <div
          className="absolute left-[6%] right-[6%] top-[6%] h-[14%] rounded-b-lg border border-t-0 border-white/20"
          aria-hidden
        />

        {starters.map((entry) => (
          <PitchPlayer key={entry.id} entry={entry} formation={match.formation} />
        ))}
      </div>

      {bench.length > 0 ? (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Banquillo · {bench.length} suplentes
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {bench.map((entry) => (
              <BenchPlayer key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import type { MatchMvp } from "@/lib/types/match";
import { Award, Star } from "lucide-react";

type MvpBannerProps = {
  mvp: MatchMvp;
  opponent: string;
};

export function MvpBanner({ mvp, opponent }: MvpBannerProps) {
  return (
    <div className="border-b border-primary/20 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4 md:gap-6">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 shadow-[0_0_32px_rgba(169,146,89,0.15)] sm:size-14 sm:rounded-2xl md:size-16">
          <Award className="size-6 text-primary sm:size-7 md:size-8" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 basis-[12rem]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-[10px] sm:tracking-[0.22em]">
            MVP de la hinchada · vs {opponent}
          </p>
          <p className="mt-1 break-words font-heading text-xl uppercase tracking-wide text-white sm:text-2xl md:text-3xl">
            #{mvp.player.jersey_number} {mvp.player.full_name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mvp.player.position_detail ?? mvp.player.position}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 sm:px-4 sm:py-3">
          <Star className="size-4 fill-primary text-primary sm:size-5" aria-hidden />
          <div>
            <p className="font-heading text-xl leading-none text-primary sm:text-2xl">
              {mvp.avg_rating.toFixed(1)}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {mvp.vote_count} voto{mvp.vote_count === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

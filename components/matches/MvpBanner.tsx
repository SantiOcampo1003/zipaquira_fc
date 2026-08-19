import type { MatchMvp } from "@/lib/types/match";
import { Award, Star } from "lucide-react";

type MvpBannerProps = {
  mvp: MatchMvp;
  opponent: string;
};

export function MvpBanner({ mvp, opponent }: MvpBannerProps) {
  return (
    <div className="border-b border-primary/20 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent px-5 py-5 sm:px-8 sm:py-6">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 shadow-[0_0_32px_rgba(169,146,89,0.15)] sm:size-16">
          <Award className="size-7 text-primary sm:size-8" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            MVP de la hinchada · vs {opponent}
          </p>
          <p className="mt-1 font-heading text-2xl uppercase tracking-wide text-white sm:text-3xl">
            #{mvp.player.jersey_number} {mvp.player.full_name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mvp.player.position_detail ?? mvp.player.position}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <Star className="size-5 fill-primary text-primary" aria-hidden />
          <div>
            <p className="font-heading text-2xl leading-none text-primary">{mvp.avg_rating.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {mvp.vote_count} voto{mvp.vote_count === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

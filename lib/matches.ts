import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { MatchDisplay, MatchRow, PlayerRow, SquadPlayer } from "@/lib/types/match";

export { formatMatchDate, formatMatchScore, playerShortName } from "@/lib/match-utils";

type SquadRow = {
  id: string;
  match_id: string;
  is_starter: boolean;
  pitch_slot: string | null;
  bench_order: number | null;
  players: PlayerRow | PlayerRow[] | null;
};

function resolvePlayer(row: SquadRow): PlayerRow | null {
  if (!row.players) return null;
  return Array.isArray(row.players) ? row.players[0] ?? null : row.players;
}

type RatingStatRow = {
  match_id: string;
  player_id: string;
  avg_rating: number;
  vote_count: number;
};

export async function getMatchesForDisplay(): Promise<MatchDisplay[]> {
  noStore();
  try {
    const supabase = getSupabaseAdmin();

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false });

    if (matchesError || !matches?.length) {
      if (matchesError) console.error("[matches]", matchesError.message);
      return [];
    }

    const matchIds = matches.map((m) => m.id);

    const [{ data: squadRows, error: squadError }, { data: statsRows, error: statsError }] =
      await Promise.all([
        supabase
          .from("match_squad")
          .select("id, match_id, is_starter, pitch_slot, bench_order, players(*)")
          .in("match_id", matchIds),
        supabase
          .from("player_match_rating_stats")
          .select("match_id, player_id, avg_rating, vote_count")
          .in("match_id", matchIds),
      ]);

    if (squadError) console.error("[match_squad]", squadError.message);
    if (statsError) console.error("[player_match_rating_stats]", statsError.message);

    const statsMap = new Map<string, RatingStatRow>();
    for (const stat of statsRows ?? []) {
      statsMap.set(`${stat.match_id}:${stat.player_id}`, stat);
    }

    const squadByMatch = new Map<string, SquadPlayer[]>();

    for (const row of squadRows ?? []) {
      const player = resolvePlayer(row as SquadRow);
      if (!player) continue;

      const stat = statsMap.get(`${row.match_id}:${player.id}`);
      const entry: SquadPlayer = {
        id: row.id,
        is_starter: row.is_starter,
        pitch_slot: row.pitch_slot,
        bench_order: row.bench_order,
        player,
        avg_rating: stat?.avg_rating ?? null,
        vote_count: stat?.vote_count ?? 0,
      };

      const list = squadByMatch.get(row.match_id) ?? [];
      list.push(entry);
      squadByMatch.set(row.match_id, list);
    }

    const mvpPlayerIds = (matches as MatchRow[])
      .map((m) => m.mvp_player_id)
      .filter((id): id is string => !!id);

    const mvpPlayersMap = new Map<string, PlayerRow>();
    if (mvpPlayerIds.length > 0) {
      const { data: mvpPlayers } = await supabase
        .from("players")
        .select("*")
        .in("id", mvpPlayerIds);
      for (const p of mvpPlayers ?? []) {
        mvpPlayersMap.set(p.id, p as PlayerRow);
      }
    }

    const sorted = (matches as MatchRow[]).map((match) => {
      const squad = squadByMatch.get(match.id) ?? [];
      squad.sort((a, b) => {
        if (a.is_starter !== b.is_starter) return a.is_starter ? -1 : 1;
        if (a.is_starter && a.pitch_slot && b.pitch_slot) {
          return a.pitch_slot.localeCompare(b.pitch_slot);
        }
        return (a.bench_order ?? 99) - (b.bench_order ?? 99);
      });

      const mvpPlayer = match.mvp_player_id
        ? mvpPlayersMap.get(match.mvp_player_id) ??
          squad.find((s) => s.player.id === match.mvp_player_id)?.player ??
          null
        : null;

      const mvp =
        mvpPlayer && match.mvp_avg_rating != null && match.mvp_published_at
          ? {
              player: mvpPlayer,
              avg_rating: Number(match.mvp_avg_rating),
              vote_count: match.mvp_vote_count ?? 0,
              published_at: match.mvp_published_at,
            }
          : null;

      return { ...match, squad, mvp };
    });

    return sorted.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return b.match_date.localeCompare(a.match_date);
    });
  } catch (err) {
    console.error("[matches] Unexpected error:", err);
    return [];
  }
}

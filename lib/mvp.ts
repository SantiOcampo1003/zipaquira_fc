import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlayerRow } from "@/lib/types/match";

export type MvpCandidate = {
  player_id: string;
  avg_rating: number;
  vote_count: number;
  player: PlayerRow;
};

export type ComputedMvp = {
  player_id: string;
  avg_rating: number;
  vote_count: number;
};

type StatsRow = {
  player_id: string;
  avg_rating: number;
  vote_count: number;
  players: PlayerRow | PlayerRow[] | null;
};

function resolvePlayer(row: StatsRow): PlayerRow | null {
  if (!row.players) return null;
  return Array.isArray(row.players) ? row.players[0] ?? null : row.players;
}

/** Calcula el MVP: mayor promedio; empate → más votos. */
export async function computeMatchMvp(
  supabase: SupabaseClient,
  matchId: string
): Promise<ComputedMvp | null> {
  const { data, error } = await supabase
    .from("player_match_rating_stats")
    .select("player_id, avg_rating, vote_count")
    .eq("match_id", matchId)
    .gt("vote_count", 0)
    .order("avg_rating", { ascending: false })
    .order("vote_count", { ascending: false })
    .limit(1);

  if (error) throw error;
  const winner = data?.[0];
  if (!winner) return null;

  return {
    player_id: winner.player_id,
    avg_rating: Number(winner.avg_rating),
    vote_count: winner.vote_count,
  };
}

export async function getMatchMvpLeaderboard(
  supabase: SupabaseClient,
  matchId: string,
  limit = 5
): Promise<MvpCandidate[]> {
  const { data, error } = await supabase
    .from("player_match_rating_stats")
    .select("player_id, avg_rating, vote_count, players(*)")
    .eq("match_id", matchId)
    .gt("vote_count", 0)
    .order("avg_rating", { ascending: false })
    .order("vote_count", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const result: MvpCandidate[] = [];
  for (const row of data ?? []) {
    const player = resolvePlayer(row as StatsRow);
    if (!player) continue;
    result.push({
      player_id: row.player_id,
      avg_rating: Number(row.avg_rating),
      vote_count: row.vote_count,
      player,
    });
  }
  return result;
}

export async function getMatchRatingTotals(
  supabase: SupabaseClient,
  matchId: string
): Promise<{ total_votes: number; total_voters: number }> {
  const { data, error } = await supabase
    .from("player_ratings")
    .select("user_id")
    .eq("match_id", matchId);

  if (error) throw error;

  const rows = data ?? [];
  return {
    total_votes: rows.length,
    total_voters: new Set(rows.map((r) => r.user_id)).size,
  };
}

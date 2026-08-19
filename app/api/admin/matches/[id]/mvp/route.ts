import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  computeMatchMvp,
  getMatchMvpLeaderboard,
  getMatchRatingTotals,
} from "@/lib/mvp";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { PlayerRow } from "@/lib/types/match";

type RouteContext = { params: { id: string } };

export async function GET(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const matchId = params.id;
  const supabase = getSupabaseAdmin();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, opponent, mvp_player_id, mvp_avg_rating, mvp_vote_count, mvp_published_at")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
  }

  const [leaderboard, totals] = await Promise.all([
    getMatchMvpLeaderboard(supabase, matchId),
    getMatchRatingTotals(supabase, matchId),
  ]);

  let published: {
    player: PlayerRow;
    avg_rating: number;
    vote_count: number;
    published_at: string;
  } | null = null;

  if (match.mvp_player_id) {
    const { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("id", match.mvp_player_id)
      .single();

    if (player && match.mvp_avg_rating != null && match.mvp_published_at) {
      published = {
        player: player as PlayerRow,
        avg_rating: Number(match.mvp_avg_rating),
        vote_count: match.mvp_vote_count ?? 0,
        published_at: match.mvp_published_at,
      };
    }
  }

  return NextResponse.json({
    opponent: match.opponent,
    published,
    leaderboard,
    total_votes: totals.total_votes,
    total_voters: totals.total_voters,
  });
}

export async function POST(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const matchId = params.id;
  const supabase = getSupabaseAdmin();

  const winner = await computeMatchMvp(supabase, matchId);
  if (!winner) {
    return NextResponse.json(
      { error: "Aún no hay votos suficientes para calcular el MVP." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("matches")
    .update({
      mvp_player_id: winner.player_id,
      mvp_avg_rating: winner.avg_rating,
      mvp_vote_count: winner.vote_count,
      mvp_published_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .select("id, mvp_player_id, mvp_avg_rating, mvp_vote_count, mvp_published_at")
    .single();

  if (error) {
    console.error("[admin/mvp POST]", error.message);
    return NextResponse.json({ error: "No pudimos publicar el MVP." }, { status: 500 });
  }

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", winner.player_id)
    .single();

  return NextResponse.json({
    ok: true,
    mvp: {
      player,
      avg_rating: winner.avg_rating,
      vote_count: winner.vote_count,
      published_at: data.mvp_published_at,
    },
  });
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("matches")
    .update({
      mvp_player_id: null,
      mvp_avg_rating: null,
      mvp_vote_count: null,
      mvp_published_at: null,
    })
    .eq("id", params.id);

  if (error) {
    console.error("[admin/mvp DELETE]", error.message);
    return NextResponse.json({ error: "No pudimos quitar el MVP." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

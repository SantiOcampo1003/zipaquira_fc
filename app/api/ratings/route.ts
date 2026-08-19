import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getSupabaseAuthServer } from "@/lib/supabase-auth-server";

const ratingItemSchema = z.object({
  playerId: z.string().uuid(),
  rating: z.number().int().min(1).max(10),
});

const postSchema = z.object({
  matchId: z.string().uuid(),
  ratings: z.array(ratingItemSchema).min(1).max(18),
});

async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (token) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user.id;
  }

  const supabase = await getSupabaseAuthServer();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");
  if (!matchId) {
    return NextResponse.json({ error: "Falta matchId." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("player_ratings")
    .select("player_id, rating")
    .eq("match_id", matchId)
    .eq("user_id", userId);

  if (error) {
    console.error("[ratings GET]", error.message);
    return NextResponse.json({ error: "No pudimos cargar tus votos." }, { status: 500 });
  }

  const ratings: Record<string, number> = {};
  for (const row of data ?? []) {
    ratings[row.player_id] = row.rating;
  }

  return NextResponse.json({ ratings });
}

export async function POST(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { matchId, ratings } = parsed.data;
  const supabase = getSupabaseAdmin();

  const playerIds = ratings.map((r) => r.playerId);
  const { data: squadRows, error: squadError } = await supabase
    .from("match_squad")
    .select("player_id")
    .eq("match_id", matchId)
    .in("player_id", playerIds);

  if (squadError) {
    console.error("[ratings POST squad]", squadError.message);
    return NextResponse.json({ error: "Error al validar convocatoria." }, { status: 500 });
  }

  const allowed = new Set((squadRows ?? []).map((r) => r.player_id));
  if (ratings.some((r) => !allowed.has(r.playerId))) {
    return NextResponse.json(
      { error: "Solo puedes calificar jugadores convocados en este partido." },
      { status: 400 }
    );
  }

  const rows = ratings.map((r) => ({
    match_id: matchId,
    player_id: r.playerId,
    user_id: userId,
    rating: r.rating,
  }));

  const { error } = await supabase.from("player_ratings").upsert(rows, {
    onConflict: "user_id,match_id,player_id",
  });

  if (error) {
    console.error("[ratings POST]", error.message);
    return NextResponse.json({ error: "No pudimos guardar tus votos." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

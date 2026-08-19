import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeStarterSlots } from "@/lib/formations";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type RouteContext = { params: { id: string } };

const squadItemSchema = z.object({
  player_id: z.string().uuid(),
  is_starter: z.boolean(),
  pitch_slot: z.string().nullable().optional(),
  bench_order: z.number().int().min(1).max(7).nullable().optional(),
});

const putSchema = z.object({
  squad: z.array(squadItemSchema).max(18),
});

export async function GET(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("match_squad")
    .select("id, player_id, is_starter, pitch_slot, bench_order, players(*)")
    .eq("match_id", params.id)
    .order("is_starter", { ascending: false });

  if (error) {
    console.error("[admin/squad GET]", error.message);
    return NextResponse.json({ error: "No pudimos cargar la convocatoria." }, { status: 500 });
  }

  return NextResponse.json({ squad: data ?? [] });
}

export async function PUT(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const squad = parsed.data.squad;
  const starters = squad.filter((s) => s.is_starter);
  const bench = squad.filter((s) => !s.is_starter);

  if (starters.length > 11) {
    return NextResponse.json({ error: "Máximo 11 titulares." }, { status: 400 });
  }
  if (bench.length > 7) {
    return NextResponse.json({ error: "Máximo 7 suplentes." }, { status: 400 });
  }
  if (squad.length > 18) {
    return NextResponse.json({ error: "Máximo 18 convocados." }, { status: 400 });
  }

  for (const s of starters) {
    if (!s.pitch_slot) {
      return NextResponse.json({ error: "Cada titular necesita pitch_slot." }, { status: 400 });
    }
  }
  for (const s of bench) {
    if (!s.bench_order) {
      return NextResponse.json({ error: "Cada suplente necesita bench_order (1–7)." }, { status: 400 });
    }
  }

  const supabase = getSupabaseAdmin();
  const matchId = params.id;

  const { data: matchRow } = await supabase
    .from("matches")
    .select("formation")
    .eq("id", matchId)
    .single();

  const formation = matchRow?.formation ?? "4-3-3";
  const playerIds = squad.map((s) => s.player_id);
  const { data: playerRows } = await supabase
    .from("players")
    .select("id, position")
    .in("id", playerIds);

  const positionById = new Map((playerRows ?? []).map((p) => [p.id, p.position as string]));

  const squadWithPlayers = squad.map((s) => ({
    player_id: s.player_id,
    is_starter: s.is_starter,
    pitch_slot: s.pitch_slot ?? null,
    bench_order: s.bench_order ?? null,
    player: { position: positionById.get(s.player_id) },
  }));

  const normalized = normalizeStarterSlots(squadWithPlayers, formation);

  const { error: deleteError } = await supabase.from("match_squad").delete().eq("match_id", matchId);
  if (deleteError) {
    console.error("[admin/squad DELETE]", deleteError.message);
    return NextResponse.json({ error: "No pudimos actualizar la convocatoria." }, { status: 500 });
  }

  if (squad.length === 0) {
    return NextResponse.json({ ok: true, squad: [] });
  }

  const rows = normalized.map((s) => ({
    match_id: matchId,
    player_id: s.player_id,
    is_starter: s.is_starter,
    pitch_slot: s.is_starter ? s.pitch_slot : null,
    bench_order: s.is_starter ? null : s.bench_order,
  }));

  const { data, error } = await supabase.from("match_squad").insert(rows).select("*");

  if (error) {
    console.error("[admin/squad PUT]", error.message);
    return NextResponse.json({ error: "No pudimos guardar la convocatoria." }, { status: 500 });
  }

  return NextResponse.json({ squad: data ?? [] });
}

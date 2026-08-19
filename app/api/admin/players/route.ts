import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const patchSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).optional(),
  jersey_number: z.number().int().min(1).max(99).optional(),
  position: z.enum(["GK", "DF", "MF", "FW"]).optional(),
  position_detail: z.string().trim().optional(),
  photo_url: z.string().trim().url().nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("jersey_number", { ascending: true });

  if (error) {
    console.error("[admin/players GET]", error.message);
    return NextResponse.json({ error: "No pudimos cargar jugadores." }, { status: 500 });
  }

  return NextResponse.json({ players: data ?? [] });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const payload: Record<string, unknown> = {};

  if (updates.full_name != null) payload.full_name = updates.full_name;
  if (updates.jersey_number != null) payload.jersey_number = updates.jersey_number;
  if (updates.position != null) payload.position = updates.position;
  if (updates.position_detail != null) payload.position_detail = updates.position_detail;
  if (updates.photo_url !== undefined) payload.photo_url = updates.photo_url;
  if (updates.is_active != null) payload.is_active = updates.is_active;

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("players")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[admin/players PATCH]", error.message);
    return NextResponse.json({ error: "No pudimos guardar el jugador." }, { status: 500 });
  }

  return NextResponse.json({ player: data });
}

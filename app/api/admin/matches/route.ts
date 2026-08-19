import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

function slugify(text: string, date: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${date}`;
}

const postSchema = z.object({
  opponent: z.string().trim().min(2),
  match_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kickoff_time: z.string().optional(),
  venue: z.string().trim().min(2),
  competition: z.string().trim().min(2),
  is_home: z.boolean().default(false),
  formation: z.string().default("4-3-3"),
  status: z.enum(["scheduled", "played", "cancelled"]).default("scheduled"),
  goals_for: z.number().int().min(0).nullable().optional(),
  goals_against: z.number().int().min(0).nullable().optional(),
  slug: z.string().trim().optional(),
  is_featured: z.boolean().optional(),
});

const patchSchema = postSchema.partial().extend({
  id: z.string().uuid(),
});

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("matches")
    .select("*, match_squad(count)")
    .order("match_date", { ascending: false });

  if (error) {
    console.error("[admin/matches GET]", error.message);
    return NextResponse.json({ error: "No pudimos cargar partidos." }, { status: 500 });
  }

  const matches = (data ?? []).map((m) => {
    const row = m as Record<string, unknown> & { match_squad?: { count: number }[] };
    const squadCount = row.match_squad?.[0]?.count ?? 0;
    const { match_squad, ...rest } = row;
    void match_squad;
    return { ...rest, squad_count: squadCount };
  });

  return NextResponse.json({ matches });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

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

  const input = parsed.data;
  const slug = input.slug?.trim() || slugify(input.opponent, input.match_date);

  const supabase = getSupabaseAdmin();

  if (input.is_featured) {
    await supabase.from("matches").update({ is_featured: false }).eq("is_featured", true);
  }

  const { data, error } = await supabase
    .from("matches")
    .insert({
      opponent: input.opponent,
      match_date: input.match_date,
      kickoff_time: input.kickoff_time || null,
      venue: input.venue,
      competition: input.competition,
      is_home: input.is_home,
      formation: input.formation,
      status: input.status,
      goals_for: input.goals_for ?? null,
      goals_against: input.goals_against ?? null,
      slug,
      is_featured: input.is_featured ?? false,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[admin/matches POST]", error.message);
    return NextResponse.json({ error: "No pudimos crear el partido." }, { status: 500 });
  }

  return NextResponse.json({ match: data });
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

  const { id, is_featured, slug: slugInput, ...rest } = parsed.data;
  const payload: Record<string, unknown> = { ...rest };
  void slugInput;

  const supabase = getSupabaseAdmin();

  if (rest.opponent !== undefined || rest.match_date !== undefined) {
    const { data: existing } = await supabase
      .from("matches")
      .select("opponent, match_date")
      .eq("id", id)
      .single();
    if (existing) {
      const opponent = (rest.opponent as string | undefined) ?? existing.opponent;
      const matchDate = (rest.match_date as string | undefined) ?? existing.match_date;
      payload.slug = slugify(opponent, matchDate);
    }
  }

  if (is_featured === true) {
    await supabase.from("matches").update({ is_featured: false }).eq("is_featured", true);
    payload.is_featured = true;
  } else if (is_featured === false) {
    payload.is_featured = false;
  }

  const { data, error } = await supabase
    .from("matches")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[admin/matches PATCH]", error.message);
    return NextResponse.json({ error: "No pudimos actualizar el partido." }, { status: 500 });
  }

  return NextResponse.json({ match: data });
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

// Sin esto, Next.js la trata como ruta estática (sin request.url/cookies) y la
// congela en el build: los cambios de /admin no se reflejarían en /boletas.
export const dynamic = "force-dynamic";

/** Partidos públicos disponibles para comprar boleta: con ticket_label, agendados y no jugados. */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("matches")
      .select("id, ticket_label, opponent, match_date, kickoff_time, venue")
      .not("ticket_label", "is", null)
      .eq("status", "scheduled")
      .gte("match_date", today)
      .order("match_date", { ascending: true });

    if (error) {
      console.error("[matches/upcoming]:", error.message);
      return NextResponse.json({ error: "No pudimos cargar los partidos." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, matches: data ?? [] });
  } catch (err) {
    console.error("[matches/upcoming] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

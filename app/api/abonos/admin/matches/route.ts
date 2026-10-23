import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/** Lista los partidos con ticket_label configurado, para el panel /tribuna/admin. */
export async function GET(req: Request) {
  const adminSecret = process.env.TRIBUNA_ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "TRIBUNA_ADMIN_SECRET no está configurado en el servidor." },
      { status: 500 }
    );
  }
  if (req.headers.get("x-admin-secret") !== adminSecret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("matches")
    .select("id, ticket_label, opponent, match_date")
    .not("ticket_label", "is", null)
    .order("match_date", { ascending: true });

  if (error) {
    console.error("[abonos/admin/matches]:", error.message);
    return NextResponse.json({ error: "No pudimos cargar los partidos." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, matches: data ?? [] });
}

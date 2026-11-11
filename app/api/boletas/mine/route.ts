import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getSupabaseAuthServer } from "@/lib/supabase-auth-server";

async function resolveUserEmail(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (token) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user?.email) return data.user.email;
  }

  const supabase = await getSupabaseAuthServer();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/** Boletas de partido (no abonos de temporada) ya pagadas del hincha autenticado. */
export async function GET(req: Request) {
  const email = await resolveUserEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("abono_purchases")
    .select(
      "id, zone_id, abono_count, created_at, matches(opponent, competition, venue, match_date, kickoff_time)"
    )
    .eq("purchaser_email", email.toLowerCase().trim())
    .eq("purchase_type", "boleta")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[boletas/mine]", error.message);
    return NextResponse.json({ error: "No pudimos cargar tus boletas." }, { status: 500 });
  }

  const purchases = (data ?? []).map((row) => {
    const match = row.matches as unknown as {
      opponent: string;
      competition: string;
      venue: string;
      match_date: string;
      kickoff_time: string | null;
    } | null;
    return {
      id: row.id as string,
      zoneId: row.zone_id as string,
      ticketCount: row.abono_count as number,
      createdAt: row.created_at as string,
      opponent: match?.opponent ?? "",
      competition: match?.competition ?? "",
      venue: match?.venue ?? "",
      matchDate: match?.match_date ?? null,
      kickoffTime: match?.kickoff_time ?? null,
    };
  });

  return NextResponse.json({ purchases });
}

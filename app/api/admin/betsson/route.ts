import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { BETSSON_BUCKET } from "@/lib/betsson";

export const dynamic = "force-dynamic";

/** Solicitudes "Betsson patrocina tu partido" para revisión — solo admin. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const status = new URL(req.url).searchParams.get("status");
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("betsson_submissions")
    .select("*, matches(opponent, match_date)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status === "pending" || status === "approved" || status === "rejected") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("[admin/betsson]", error.message);
    return NextResponse.json({ error: "No pudimos cargar las solicitudes." }, { status: 500 });
  }

  const items = await Promise.all(
    (data ?? []).map(async (row) => {
      let imageUrl: string | null = null;
      if (row.image_path && row.status !== "rejected") {
        const { data: signed } = await supabase.storage.from(BETSSON_BUCKET).createSignedUrl(row.image_path, 3600);
        imageUrl = signed?.signedUrl ?? null;
      }
      return {
        id: row.id as string,
        createdAt: row.created_at as string,
        status: row.status as string,
        reason: row.reason as string | null,
        purchaserEmail: row.purchaser_email as string,
        purchaserPhone: row.purchaser_phone as string,
        zoneId: row.zone_id as string,
        seats: row.seats as unknown[],
        betssonEmail: row.betsson_email as string | null,
        betssonName: row.betsson_name as string | null,
        ai: row.ai_result as Record<string, unknown> | null,
        match: row.matches ? `vs ${(row.matches as { opponent: string }).opponent}` : "",
        imageUrl,
      };
    })
  );
  return NextResponse.json({ items });
}

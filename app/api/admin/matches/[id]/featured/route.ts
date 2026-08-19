import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type RouteContext = { params: { id: string } };

export async function POST(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const matchId = params.id;
  const supabase = getSupabaseAdmin();

  await supabase.from("matches").update({ is_featured: false }).eq("is_featured", true);

  const { data, error } = await supabase
    .from("matches")
    .update({ is_featured: true })
    .eq("id", matchId)
    .select("*")
    .single();

  if (error) {
    console.error("[admin/featured]", error.message);
    return NextResponse.json({ error: "No pudimos destacar el partido." }, { status: 500 });
  }

  return NextResponse.json({ match: data });
}

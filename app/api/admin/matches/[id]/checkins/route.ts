import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type RouteContext = { params: { id: string } };

/** Trazabilidad de ingresos (escáner de boletas) para un partido — solo admin. */
export async function GET(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const matchId = params.id;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("abono_registrations")
    .select(
      "id, ticket_code, holder_full_name, seat_number, checked_in_at, checked_in_by, abono_purchases!inner(status, zone_id, purchase_type)"
    )
    .eq("match_id", matchId)
    .eq("abono_purchases.status", "completed")
    .eq("abono_purchases.purchase_type", "boleta")
    .order("checked_in_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[admin/matches/checkins]", error.message);
    return NextResponse.json({ error: "No pudimos cargar los ingresos." }, { status: 500 });
  }

  const tickets = (data ?? []).map((row) => {
    const purchase = row.abono_purchases as unknown as { zone_id: string };
    return {
      id: row.id as string,
      ticketCode: row.ticket_code as string,
      holderFullName: row.holder_full_name as string,
      seatNumber: row.seat_number as number | null,
      zoneId: purchase.zone_id,
      checkedInAt: row.checked_in_at as string | null,
      checkedInBy: row.checked_in_by as string | null,
    };
  });

  const checkedInCount = tickets.filter((t) => t.checkedInAt).length;

  return NextResponse.json({ tickets, total: tickets.length, checkedInCount });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type RouteContext = { params: { id: string } };

type PurchaseInfo = {
  zone_id: string;
  purchase_type: string;
  purchaser_email: string;
  external_order_id: string | null;
  abono_count: number;
  amount_cop?: number | null;
};

const BASE_COLUMNS = "id, ticket_code, holder_full_name, seat_number, checked_in_at, checked_in_by";
const PURCHASE_COLUMNS = "status, zone_id, purchase_type, purchaser_email, external_order_id, abono_count";

/** Tipo de boleta según cómo se emitió: se deduce de cómo se marcó la compra. */
function classify(p: PurchaseInfo): { kind: string; amountCop: number | null } {
  let kind: string;
  let free = false;
  if (p.purchase_type === "abono") {
    kind = p.purchaser_email.endsWith(".local") ? "Cortesía abonado" : "Abonado";
  } else if (p.external_order_id?.startsWith("betsson:")) {
    kind = "Betsson";
    free = true;
  } else if (p.external_order_id?.startsWith("cortesia:invitados")) {
    kind = "Invitado";
    free = true;
  } else if (p.external_order_id?.startsWith("cortesia:")) {
    kind = "Cortesía";
    free = true;
  } else {
    kind = "Compra en línea";
  }

  // Monto por boleta = lo cobrado en la compra / número de boletas de esa compra.
  if (p.amount_cop != null) return { kind, amountCop: Math.round(p.amount_cop / Math.max(p.abono_count, 1)) };
  if (free) return { kind, amountCop: 0 };
  return { kind, amountCop: null };
}

type QueryResult = { data: unknown[] | null; error: { message: string } | null };

/**
 * Consulta con la columna amount_cop; si la migración 015 aún no se aplicó,
 * reintenta sin ella para no romper el reporte.
 */
async function fetchRegistrations(build: (select: string) => PromiseLike<QueryResult>): Promise<QueryResult> {
  const withAmount = await build(`${BASE_COLUMNS}, abono_purchases!inner(${PURCHASE_COLUMNS}, amount_cop)`);
  if (!withAmount.error || !/amount_cop/.test(withAmount.error.message)) return withAmount;
  return build(`${BASE_COLUMNS}, abono_purchases!inner(${PURCHASE_COLUMNS})`);
}

/** Trazabilidad de ingresos (escáner de boletas) para un partido — solo admin. */
export async function GET(req: Request, { params }: RouteContext) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const matchId = params.id;
  const supabase = getSupabaseAdmin();

  const [boletas, abonos] = await Promise.all([
    fetchRegistrations((select) =>
      supabase
        .from("abono_registrations")
        .select(select)
        .eq("match_id", matchId)
        .eq("abono_purchases.status", "completed")
        .eq("abono_purchases.purchase_type", "boleta")
        .order("checked_in_at", { ascending: false, nullsFirst: false })
    ),
    // Abonados con boleta/QR emitido (el abono es de temporada: match_id null).
    fetchRegistrations((select) =>
      supabase
        .from("abono_registrations")
        .select(select)
        .is("match_id", null)
        .not("ticket_code", "is", null)
        .eq("abono_purchases.status", "completed")
        .eq("abono_purchases.purchase_type", "abono")
        .order("seat_number", { ascending: true })
    ),
  ]);

  if (boletas.error || abonos.error) {
    console.error("[admin/matches/checkins]", boletas.error?.message ?? abonos.error?.message);
    return NextResponse.json({ error: "No pudimos cargar los ingresos." }, { status: 500 });
  }

  const tickets = [...(boletas.data ?? []), ...(abonos.data ?? [])].map((raw) => {
    const row = raw as Record<string, unknown>;
    const purchase = row.abono_purchases as PurchaseInfo;
    const { kind, amountCop } = classify(purchase);
    return {
      id: row.id as string,
      ticketCode: row.ticket_code as string,
      holderFullName: row.holder_full_name as string,
      seatNumber: row.seat_number as number | null,
      zoneId: purchase.zone_id,
      kind,
      amountCop,
      checkedInAt: row.checked_in_at as string | null,
      checkedInBy: row.checked_in_by as string | null,
    };
  });

  const checkedInCount = tickets.filter((t) => t.checkedInAt).length;

  return NextResponse.json({ tickets, total: tickets.length, checkedInCount });
}

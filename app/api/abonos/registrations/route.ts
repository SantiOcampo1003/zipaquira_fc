import { NextResponse } from "next/server";
import { formatSeatId } from "@/lib/stadium-seating";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * Devuelve las compras de abono ya completadas (silla + talla elegidas por el
 * hincha en la web) para que el Apps Script del sheet las escriba de vuelta
 * en las columnas Silla / Talla / Estado. Mismo secreto que /api/abonos/create.
 */
export async function GET(req: Request) {
  const adminSecret = process.env.ABONOS_ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "ABONOS_ADMIN_SECRET no está configurado en el servidor." },
      { status: 500 }
    );
  }

  if (req.headers.get("x-admin-secret") !== adminSecret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("abono_purchases")
      .select(
        "purchaser_email, zone_id, abono_count, completed_at, abono_registrations(abono_index, seat_number, holder_full_name, holder_document_id, jersey_size)"
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("[abonos/registrations] query:", error.message);
      return NextResponse.json({ error: "No pudimos consultar las confirmaciones." }, { status: 500 });
    }

    type Row = {
      purchaser_email: string;
      zone_id: string;
      abono_count: number;
      completed_at: string | null;
      abono_registrations: {
        abono_index: number;
        seat_number: number;
        holder_full_name: string | null;
        holder_document_id: string | null;
        jersey_size: string | null;
      }[];
    };

    const purchases = (data as Row[]).map((row) => ({
      email: row.purchaser_email,
      zoneId: row.zone_id,
      abonoCount: row.abono_count,
      completedAt: row.completed_at,
      seats: [...row.abono_registrations]
        .sort((a, b) => a.abono_index - b.abono_index)
        .map((reg) => ({
          abonoIndex: reg.abono_index,
          seatId: formatSeatId(reg.seat_number),
          holderFullName: reg.holder_full_name,
          holderDocumentId: reg.holder_document_id,
          jerseySize: reg.jersey_size,
        })),
    }));

    return NextResponse.json({ ok: true, purchases });
  } catch (err) {
    console.error("[abonos/registrations] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

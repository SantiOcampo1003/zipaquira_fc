import { NextResponse } from "next/server";
import {
  mapDbSeatToSeat,
  type AbonoSessionPurchase,
  type AbonoSessionRegistration,
  type DbAbonoPurchaseRow,
  type DbAbonoRegistrationRow,
  type DbStadiumSeatRow,
} from "@/lib/stadium-db";
import { formatSeatId } from "@/lib/stadium-seating";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token")?.trim() || null;
    const supabase = getSupabaseAdmin();

    const { data: seatRows, error: seatsError } = await supabase
      .from("stadium_seats")
      .select("seat_number, zone_id, row_number, status")
      .order("seat_number", { ascending: true });

    if (seatsError) {
      console.error("[abonos/session] seats:", seatsError.message);
      return NextResponse.json(
        { error: "No pudimos cargar el mapa de sillas." },
        { status: 500 }
      );
    }

    const seats = (seatRows as DbStadiumSeatRow[]).map(mapDbSeatToSeat);

    if (!token) {
      return NextResponse.json({ purchase: null, registrations: [], seats });
    }

    const { data: purchaseRow, error: purchaseError } = await supabase
      .from("abono_purchases")
      .select("id, purchaser_email, abono_count, zone_id, status, expires_at, completed_at")
      .eq("access_token", token)
      .maybeSingle();

    if (purchaseError) {
      console.error("[abonos/session] purchase:", purchaseError.message);
      return NextResponse.json(
        { error: "No pudimos validar tu compra." },
        { status: 500 }
      );
    }

    if (!purchaseRow) {
      return NextResponse.json({ error: "Enlace de abono inválido." }, { status: 404 });
    }

    const purchase = purchaseRow as DbAbonoPurchaseRow;

    if (
      purchase.status === "pending_seats" &&
      purchase.expires_at &&
      new Date(purchase.expires_at) < new Date()
    ) {
      await supabase
        .from("abono_purchases")
        .update({ status: "expired" })
        .eq("id", purchase.id);

      return NextResponse.json(
        { error: "Este enlace expiró. Contacta al club." },
        { status: 410 }
      );
    }

    const purchasePayload: AbonoSessionPurchase = {
      purchaserEmail: purchase.purchaser_email,
      abonoCount: purchase.abono_count,
      zoneId: purchase.zone_id,
      status: purchase.status,
      expiresAt: purchase.expires_at,
    };

    let registrations: AbonoSessionRegistration[] = [];

    if (purchase.status === "completed") {
      const { data: regRows, error: regError } = await supabase
        .from("abono_registrations")
        .select("abono_index, seat_number, holder_full_name, holder_document_id, jersey_size")
        .eq("purchase_id", purchase.id)
        .order("abono_index", { ascending: true });

      if (regError) {
        console.error("[abonos/session] registrations:", regError.message);
        return NextResponse.json(
          { error: "No pudimos cargar tu confirmación." },
          { status: 500 }
        );
      }

      registrations = (regRows as DbAbonoRegistrationRow[]).map((row) => ({
        abonoIndex: row.abono_index,
        seatNumber: row.seat_number,
        seatId: formatSeatId(row.seat_number),
        holderFullName: row.holder_full_name ?? "",
        holderDocumentId: row.holder_document_id ?? "",
        jerseySize: row.jersey_size!,
      }));
    }

    return NextResponse.json({
      purchase: purchasePayload,
      registrations,
      seats,
    });
  } catch (err) {
    console.error("[abonos/session] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

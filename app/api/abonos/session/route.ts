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
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim() || null;
    const previewMatchLabel = url.searchParams.get("match")?.trim() || null;
    const tribunaAdminSecret = process.env.TRIBUNA_ADMIN_SECRET;
    const isAdminCaller =
      !!tribunaAdminSecret && req.headers.get("x-admin-secret") === tribunaAdminSecret;
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
      // Vista de solo lectura (?preview=1[&match=...]): superpone el nombre de
      // quien ocupa cada silla — abonados de temporada siempre, y además las
      // boletas vendidas para el partido puntual si se indica ?match=.
      let matchLabelResolved: string | null = null;
      let matchIdResolved: string | null = null;

      if (previewMatchLabel) {
        const { data: matchRow, error: matchError } = await supabase
          .from("matches")
          .select("id, ticket_label, opponent")
          .ilike("ticket_label", previewMatchLabel)
          .maybeSingle();

        if (matchError) {
          console.error("[abonos/session] preview match lookup:", matchError.message);
          return NextResponse.json({ error: "No pudimos buscar el partido." }, { status: 500 });
        }

        if (!matchRow) {
          return NextResponse.json(
            { error: `No encontramos el partido "${previewMatchLabel}".` },
            { status: 404 }
          );
        }

        matchIdResolved = matchRow.id;
        matchLabelResolved = matchRow.ticket_label ?? matchRow.opponent;
      }

      let conflictQuery = supabase
        .from("abono_registrations")
        .select(
          "seat_number, holder_full_name, holder_document_id, holder_phone, match_id, purchase_id, abono_purchases!inner(status)"
        )
        .eq("abono_purchases.status", "completed");

      conflictQuery = matchIdResolved
        ? conflictQuery.or(`match_id.is.null,match_id.eq.${matchIdResolved}`)
        : conflictQuery.is("match_id", null);

      const { data: conflictRows, error: conflictError } = await conflictQuery;

      if (conflictError) {
        console.error("[abonos/session] preview conflicts:", conflictError.message);
        return NextResponse.json(
          { error: "No pudimos cargar el mapa de sillas." },
          { status: 500 }
        );
      }

      const occupantBySeat = new Map(
        (conflictRows ?? []).map((r) => [
          r.seat_number as number,
          {
            name: r.holder_full_name as string | null,
            type: (r.match_id ? "boleta" : "abono") as "abono" | "boleta",
            documentId: r.holder_document_id as string | null,
            phone: r.holder_phone as string | null,
            purchaseId: r.purchase_id as string,
          },
        ])
      );
      for (const seat of seats) {
        const occupant = occupantBySeat.get(seat.seatNumber);
        if (occupant) {
          if (seat.status === "available") seat.status = "occupied";
          seat.occupantName = occupant.name;
          seat.occupantType = occupant.type;
          if (isAdminCaller) {
            seat.occupantPurchaseId = occupant.purchaseId;
            seat.occupantDocumentId = occupant.documentId;
            seat.occupantPhone = occupant.phone;
          }
        }
      }

      return NextResponse.json({
        purchase: null,
        registrations: [],
        seats,
        previewMatchLabel: matchLabelResolved,
        previewMatchId: matchIdResolved,
      });
    }

    const { data: purchaseRow, error: purchaseError } = await supabase
      .from("abono_purchases")
      .select(
        "id, purchaser_email, abono_count, zone_id, status, expires_at, completed_at, purchase_type, match_id, matches(opponent, ticket_label, match_date)"
      )
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

    const purchase = purchaseRow as unknown as DbAbonoPurchaseRow;

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

    // Sillas ya ocupadas por OTRAS compras completadas, según el alcance de
    // esta compra: un abono se bloquea por cualquier registro existente
    // (de temporada o de un partido); una boleta solo por un abono de
    // temporada o por otra boleta del MISMO partido.
    if (purchase.status === "pending_seats") {
      let conflictQuery = supabase
        .from("abono_registrations")
        .select("seat_number, match_id, abono_purchases!inner(status)")
        .eq("abono_purchases.status", "completed");

      if (purchase.purchase_type === "boleta" && purchase.match_id) {
        conflictQuery = conflictQuery.or(`match_id.is.null,match_id.eq.${purchase.match_id}`);
      }

      const { data: conflictRows, error: conflictError } = await conflictQuery;

      if (conflictError) {
        console.error("[abonos/session] conflicts:", conflictError.message);
        return NextResponse.json(
          { error: "No pudimos cargar el mapa de sillas." },
          { status: 500 }
        );
      }

      const blocked = new Set((conflictRows ?? []).map((r) => r.seat_number as number));
      for (const seat of seats) {
        if (blocked.has(seat.seatNumber) && seat.status === "available") {
          seat.status = "occupied";
        }
      }
    }

    const purchasePayload: AbonoSessionPurchase = {
      purchaserEmail: purchase.purchaser_email,
      abonoCount: purchase.abono_count,
      zoneId: purchase.zone_id,
      status: purchase.status,
      expiresAt: purchase.expires_at,
      purchaseType: purchase.purchase_type,
      matchLabel: purchase.matches?.ticket_label ?? purchase.matches?.opponent ?? null,
    };

    let registrations: AbonoSessionRegistration[] = [];

    if (purchase.status === "completed") {
      const { data: regRows, error: regError } = await supabase
        .from("abono_registrations")
        .select(
          "abono_index, seat_number, holder_full_name, holder_document_id, holder_phone, jersey_size"
        )
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
        holderPhone: row.holder_phone ?? "",
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

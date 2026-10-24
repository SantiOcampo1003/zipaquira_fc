import { NextResponse } from "next/server";
import { z } from "zod";
import { mapRpcErrorToMessage } from "@/lib/stadium-db";
import { isCourtesySeatNumber } from "@/lib/stadium-seating";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * Edita los datos de una silla ya asignada, o la mueve a otra silla.
 * Protegido por TRIBUNA_ADMIN_SECRET.
 */
const updateSchema = z.object({
  purchaseId: z.string().uuid(),
  holderFullName: z.string().trim().min(2),
  holderDocumentId: z.string().trim().min(3),
  holderPhone: z.string().trim().min(7),
  newSeatNumber: z.number().int().min(1).max(568).optional(),
});

export async function POST(req: Request) {
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

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
    }

    const { purchaseId, holderFullName, holderDocumentId, holderPhone, newSeatNumber } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data: purchase, error: purchaseError } = await supabase
      .from("abono_purchases")
      .select("id, purchaser_email, zone_id, purchase_type, match_id, access_token, status")
      .eq("id", purchaseId)
      .maybeSingle();

    if (purchaseError) {
      console.error("[abonos/admin/update] lookup:", purchaseError.message);
      return NextResponse.json({ error: "No pudimos buscar la asignación." }, { status: 500 });
    }
    if (!purchase) {
      return NextResponse.json({ error: "Esa asignación ya no existe." }, { status: 404 });
    }

    const { data: registration, error: regError } = await supabase
      .from("abono_registrations")
      .select("seat_number, jersey_size")
      .eq("purchase_id", purchaseId)
      .maybeSingle();

    if (regError || !registration) {
      console.error("[abonos/admin/update] registration lookup:", regError?.message);
      return NextResponse.json({ error: "No pudimos encontrar la silla actual." }, { status: 500 });
    }

    const movingSeat = newSeatNumber != null && newSeatNumber !== registration.seat_number;

    if (!movingSeat) {
      // Mismo asiento: solo actualiza los datos de la persona, sin riesgo de conflicto.
      const { error: updateError } = await supabase
        .from("abono_registrations")
        .update({
          holder_full_name: holderFullName.trim(),
          holder_document_id: holderDocumentId.trim(),
          holder_phone: holderPhone.trim(),
        })
        .eq("purchase_id", purchaseId);

      if (updateError) {
        console.error("[abonos/admin/update] update:", updateError.message);
        return NextResponse.json({ error: "No pudimos guardar los cambios." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, seatNumber: registration.seat_number });
    }

    // Cambia de silla: reabre la compra a "pending_seats" y reconfirma con el
    // mismo token en la silla nueva — reusa toda la validación de conflictos.
    // Si la silla nueva es de otra zona, actualiza también la zona de la compra.
    const { data: newSeatRow, error: newSeatError } = await supabase
      .from("stadium_seats")
      .select("zone_id")
      .eq("seat_number", newSeatNumber)
      .maybeSingle();

    if (newSeatError || !newSeatRow) {
      return NextResponse.json({ error: "Número de silla inválido." }, { status: 400 });
    }

    const { error: reopenError } = await supabase
      .from("abono_purchases")
      .update({ status: "pending_seats", completed_at: null, zone_id: newSeatRow.zone_id })
      .eq("id", purchaseId);

    if (reopenError) {
      console.error("[abonos/admin/update] reopen:", reopenError.message);
      return NextResponse.json({ error: "No pudimos mover la silla." }, { status: 500 });
    }

    const { error: rpcError } = await supabase.rpc("confirm_abono_purchase", {
      p_token: purchase.access_token,
      p_purchaser_email: purchase.purchaser_email,
      p_assignments: [
        {
          abono_index: 1,
          seat_number: newSeatNumber,
          holder_full_name: holderFullName.trim(),
          holder_document_id: holderDocumentId.trim(),
          holder_phone: holderPhone.trim(),
          jersey_size: registration.jersey_size,
        },
      ],
    });

    if (rpcError) {
      console.error("[abonos/admin/update] RPC:", rpcError.message);
      // Si falla, deja la compra como estaba (vuelve a completed en la silla vieja,
      // restaurando también la zona original de la compra).
      await supabase
        .from("abono_purchases")
        .update({ status: "pending_seats", completed_at: null, zone_id: purchase.zone_id })
        .eq("id", purchaseId);
      await supabase.rpc("confirm_abono_purchase", {
        p_token: purchase.access_token,
        p_purchaser_email: purchase.purchaser_email,
        p_assignments: [
          {
            abono_index: 1,
            seat_number: registration.seat_number,
            holder_full_name: holderFullName.trim(),
            holder_document_id: holderDocumentId.trim(),
            holder_phone: holderPhone.trim(),
            jersey_size: registration.jersey_size,
          },
        ],
      });
      return NextResponse.json({ error: mapRpcErrorToMessage(rpcError.message) }, { status: 400 });
    }

    // El RPC marca la silla nueva como "reserved" pero no libera la vieja
    // (solo aplica a abonos: las boletas de partido nunca tocan stadium_seats).
    // Las sillas del bloque de cortesía (479-504) nunca deben quedar en
    // "available" ni en "reserved": siempre son "courtesy", tenga o no
    // alguien asignado, para que un hincha normal nunca pueda reservarlas.
    if (purchase.purchase_type === "abono") {
      await supabase
        .from("stadium_seats")
        .update({
          status: isCourtesySeatNumber(registration.seat_number) ? "courtesy" : "available",
          updated_at: new Date().toISOString(),
        })
        .eq("seat_number", registration.seat_number);

      if (isCourtesySeatNumber(newSeatNumber!)) {
        await supabase
          .from("stadium_seats")
          .update({ status: "courtesy", updated_at: new Date().toISOString() })
          .eq("seat_number", newSeatNumber!);
      }
    }

    return NextResponse.json({ ok: true, seatNumber: newSeatNumber });
  } catch (err) {
    console.error("[abonos/admin/update] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

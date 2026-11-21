import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { sendTicketEmailForPurchase } from "@/lib/ticket-delivery";

/**
 * Cortesías: mismo flujo que /api/boletas/checkout pero sin cobro. Reserva las
 * sillas, marca la compra como pagada y envía la boleta (PDF + QR) por correo.
 * Solo administradores (Google + admin_users): si fuera público, cualquiera
 * podría sacar boletas gratis.
 */
const seatSchema = z.object({
  seatNumber: z.number().int().min(1).max(568),
  holderFullName: z.string().trim().min(2),
  holderDocumentId: z
    .string()
    .trim()
    .regex(/^\d{5,12}$/, { message: "La cédula debe tener solo números." }),
  holderPhone: z.string().trim().min(7),
});

const schema = z.object({
  matchLabel: z.string().trim().max(120),
  zoneId: z.enum(["verde", "blanca", "roja"]),
  seats: z.array(seatSchema).min(1).max(10),
  purchaserEmail: z.string().trim().email(),
  purchaserPhone: z.string().trim().min(7),
});

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
    }
    const { matchLabel, zoneId, seats, purchaserEmail, purchaserPhone } = parsed.data;

    const supabase = getSupabaseAdmin();

    const { data: matchRow, error: matchError } = await supabase
      .from("matches")
      .select("id")
      .ilike("ticket_label", matchLabel)
      .maybeSingle();
    if (matchError) {
      console.error("[cortesias/checkout] match lookup:", matchError.message);
      return NextResponse.json({ error: "No pudimos buscar el partido." }, { status: 500 });
    }
    if (!matchRow) {
      return NextResponse.json({ error: `No encontramos el partido "${matchLabel}".` }, { status: 400 });
    }

    const { data: reserved, error: reserveError } = await supabase.rpc("reserve_boleta_online", {
      p_purchaser_email: purchaserEmail,
      p_purchaser_phone: purchaserPhone,
      p_match_id: matchRow.id,
      p_zone_id: zoneId,
      p_assignments: seats.map((seat, i) => ({
        abono_index: i + 1,
        seat_number: seat.seatNumber,
        holder_full_name: seat.holderFullName,
        holder_document_id: seat.holderDocumentId,
        holder_phone: seat.holderPhone,
      })),
    });
    if (reserveError) {
      console.error("[cortesias/checkout] reserve:", reserveError.message);
      if (reserveError.message.includes("SEAT_NOT_AVAILABLE")) {
        return NextResponse.json({ error: "Una de las sillas ya fue tomada. Elige otras en el mapa." }, { status: 409 });
      }
      return NextResponse.json({ error: "No pudimos reservar las sillas." }, { status: 500 });
    }

    const row = Array.isArray(reserved) ? reserved[0] : reserved;
    const purchaseId: string = row.purchase_id;

    // Sin pago: se confirma de inmediato. El "id de transacción" deja rastro de quién la emitió.
    const { error: confirmError } = await supabase.rpc("confirm_boleta_payment", {
      p_purchase_id: purchaseId,
      p_wompi_transaction_id: `cortesia:${auth.user.email}`,
    });
    if (confirmError) {
      console.error("[cortesias/checkout] confirm:", confirmError.message);
      await supabase.rpc("cancel_boleta_payment", { p_purchase_id: purchaseId });
      return NextResponse.json({ error: "No pudimos confirmar la cortesía." }, { status: 500 });
    }

    let emailSent = true;
    try {
      await sendTicketEmailForPurchase(purchaseId);
    } catch (err) {
      // La cortesía ya quedó creada; solo falló el correo.
      console.error("[cortesias/checkout] email:", err);
      emailSent = false;
    }

    return NextResponse.json({ ok: true, purchaseId, emailSent, seats: seats.length });
  } catch (err) {
    console.error("[cortesias/checkout] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

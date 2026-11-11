import { NextResponse } from "next/server";
import { z } from "zod";
import { CATEDRAL_TICKET_PRICE_COP } from "@/lib/stadium-seating";
import { buildCheckoutRedirectUrl } from "@/lib/wompi";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * Crea la compra (sillas bloqueadas 20 min) y devuelve el link de pago de
 * Wompi. Público — lo llama el comprador directamente desde /boletas.
 */
const seatSchema = z.object({
  seatNumber: z.number().int().min(1).max(568),
  holderFullName: z.string().trim().min(2),
  holderDocumentId: z.string().trim().min(5),
  holderPhone: z.string().trim().min(7),
});

const checkoutSchema = z.object({
  matchLabel: z.string().trim().max(120),
  zoneId: z.enum(["verde", "blanca", "roja"]),
  seats: z.array(seatSchema).min(1).max(10),
  purchaserEmail: z.string().trim().email(),
  purchaserPhone: z.string().trim().min(7),
});

function getSiteUrl(): string {
  return process.env.SITE_URL?.replace(/\/$/, "") || "https://zipaquira-fc-eta.vercel.app";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
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
      console.error("[boletas/checkout] match lookup:", matchError.message);
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
      console.error("[boletas/checkout] reserve:", reserveError.message);
      if (reserveError.message.includes("SEAT_NOT_AVAILABLE")) {
        return NextResponse.json(
          { error: "Una de las sillas ya fue tomada. Elige otras en el mapa." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "No pudimos reservar las sillas." }, { status: 500 });
    }

    const row = Array.isArray(reserved) ? reserved[0] : reserved;
    const purchaseId: string = row.purchase_id;
    const accessToken: string = row.access_token;

    try {
      const amountInCents = seats.length * CATEDRAL_TICKET_PRICE_COP * 100;
      const redirectUrl = buildCheckoutRedirectUrl({
        reference: purchaseId,
        amountInCents,
        redirectUrl: `${getSiteUrl()}/boletas/resultado?token=${accessToken}`,
        customerEmail: purchaserEmail,
        customerFullName: seats[0].holderFullName,
        customerPhone: purchaserPhone,
      });

      return NextResponse.json({ ok: true, redirectUrl, accessToken });
    } catch (err) {
      // No dejar la silla bloqueada 20 min por un error de configuración.
      console.error("[boletas/checkout] build redirect:", err);
      await supabase.rpc("cancel_boleta_payment", { p_purchase_id: purchaseId });
      return NextResponse.json({ error: "No pudimos iniciar el pago." }, { status: 500 });
    }
  } catch (err) {
    console.error("[boletas/checkout] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

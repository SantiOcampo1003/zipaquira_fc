import { NextResponse } from "next/server";
import { z } from "zod";
import { CATEDRAL_PLAYER_PRICE_COP, CATEDRAL_TICKET_PRICE_COP, twoForOneTotalCop } from "@/lib/stadium-seating";
import { requireAdmin } from "@/lib/admin-auth";
import { isBetssonMatch } from "@/lib/betsson";
import { isPlayerDiscountCode } from "@/lib/discount-code";
import { buildCheckoutRedirectUrl } from "@/lib/wompi";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * Crea la compra (sillas bloqueadas 20 min) y devuelve el link de pago de
 * Wompi. Público — lo llama el comprador directamente desde /boletas.
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

const checkoutSchema = z.object({
  matchLabel: z.string().trim().max(120),
  zoneId: z.enum(["verde", "blanca", "roja"]),
  seats: z.array(seatSchema).min(1).max(10),
  purchaserEmail: z.string().trim().email(),
  purchaserPhone: z.string().trim().min(7),
  discountCode: z.string().trim().max(60).optional(),
  promo: z.literal("2x1").optional(),
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

    const { matchLabel, zoneId, seats, purchaserEmail, purchaserPhone, discountCode, promo } = parsed.data;

    // Partido con patrocinio Betsson: el pago por Wompi está apagado para el público
    // (la entrada se gestiona en /boletas con el registro de Betsson). Un admin sí puede.
    if (isBetssonMatch(matchLabel)) {
      const auth = await requireAdmin(req);
      if (auth.error) {
        return NextResponse.json(
          { error: "Para este partido la entrada es con el registro de Betsson, no se paga en línea." },
          { status: 403 }
        );
      }
    }

    // 2x1: solo un admin puede venderlo; cantidad par y sin código de jugadores.
    if (promo === "2x1") {
      const auth = await requireAdmin(req);
      if (auth.error) return auth.error;
      if (seats.length % 2 !== 0) {
        return NextResponse.json({ error: "El 2x1 requiere un número par de sillas." }, { status: 400 });
      }
      if (discountCode) {
        return NextResponse.json({ error: "El 2x1 no se combina con códigos de descuento." }, { status: 400 });
      }
    }

    // Si mandan un código y no sirve, se rechaza (no se cobra el precio completo en silencio).
    const hasPlayerCode = !!discountCode && isPlayerDiscountCode(discountCode);
    if (discountCode && !hasPlayerCode) {
      return NextResponse.json({ error: "Código de descuento inválido." }, { status: 400 });
    }
    const unitPrice = hasPlayerCode ? CATEDRAL_PLAYER_PRICE_COP : CATEDRAL_TICKET_PRICE_COP;

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
      const amountInCents = (promo === "2x1" ? twoForOneTotalCop(seats.length) : seats.length * unitPrice) * 100;
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { GENERAL_TICKET_PRICE_COP } from "@/lib/stadium-seating";
import { buildCheckoutRedirectUrl } from "@/lib/wompi";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * Crea la compra de boletas de tribuna General (sin silla, 20 min bloqueada)
 * y devuelve el link de pago de Wompi. Público — lo llama el comprador
 * directamente desde /boletas.
 */
const holderSchema = z.object({
  holderFullName: z.string().trim().min(2),
  holderDocumentId: z.string().trim().min(5),
  holderPhone: z.string().trim().min(7),
});

const checkoutSchema = z.object({
  matchLabel: z.string().trim().max(120),
  holders: z.array(holderSchema).min(1).max(10),
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

    const { matchLabel, holders, purchaserEmail, purchaserPhone } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data: matchRow, error: matchError } = await supabase
      .from("matches")
      .select("id")
      .ilike("ticket_label", matchLabel)
      .maybeSingle();

    if (matchError) {
      console.error("[boletas/general-checkout] match lookup:", matchError.message);
      return NextResponse.json({ error: "No pudimos buscar el partido." }, { status: 500 });
    }
    if (!matchRow) {
      return NextResponse.json({ error: `No encontramos el partido "${matchLabel}".` }, { status: 400 });
    }

    const { data: reserved, error: reserveError } = await supabase.rpc("reserve_general_tickets", {
      p_purchaser_email: purchaserEmail,
      p_purchaser_phone: purchaserPhone,
      p_match_id: matchRow.id,
      p_holders: holders.map((holder, i) => ({
        abono_index: i + 1,
        holder_full_name: holder.holderFullName,
        holder_document_id: holder.holderDocumentId,
        holder_phone: holder.holderPhone,
      })),
    });

    if (reserveError) {
      console.error("[boletas/general-checkout] reserve:", reserveError.message);
      return NextResponse.json({ error: "No pudimos reservar las entradas." }, { status: 500 });
    }

    const row = Array.isArray(reserved) ? reserved[0] : reserved;
    const purchaseId: string = row.purchase_id;
    const accessToken: string = row.access_token;

    try {
      const amountInCents = holders.length * GENERAL_TICKET_PRICE_COP * 100;
      const redirectUrl = buildCheckoutRedirectUrl({
        reference: purchaseId,
        amountInCents,
        redirectUrl: `${getSiteUrl()}/boletas/resultado?token=${accessToken}`,
        customerEmail: purchaserEmail,
        customerFullName: holders[0].holderFullName,
        customerPhone: purchaserPhone,
      });

      return NextResponse.json({ ok: true, redirectUrl, accessToken });
    } catch (err) {
      // No dejar la reserva bloqueada 20 min por un error de configuración.
      console.error("[boletas/general-checkout] build redirect:", err);
      await supabase.rpc("cancel_boleta_payment", { p_purchase_id: purchaseId });
      return NextResponse.json({ error: "No pudimos iniciar el pago." }, { status: 500 });
    }
  } catch (err) {
    console.error("[boletas/general-checkout] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

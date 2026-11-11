import { NextResponse } from "next/server";
import { verifyWompiEventChecksum, type WompiEventPayload } from "@/lib/wompi";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { sendTicketEmailForPurchase } from "@/lib/ticket-delivery";

/** Wompi llama acá cuando una transacción cambia de estado. Debe responder 200 rápido. */
export async function POST(req: Request) {
  let payload: WompiEventPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  let validSignature = false;
  try {
    validSignature = verifyWompiEventChecksum(payload);
  } catch (err) {
    console.error("[boletas/webhook] checksum config:", err);
    return NextResponse.json({ error: "Configuración incompleta." }, { status: 500 });
  }

  if (!validSignature) {
    console.error("[boletas/webhook] checksum inválido, se ignora el evento.");
    return NextResponse.json({ ok: true });
  }

  if (payload.event !== "transaction.updated") {
    return NextResponse.json({ ok: true });
  }

  const { id: transactionId, status, reference: purchaseId } = payload.data.transaction;
  const supabase = getSupabaseAdmin();

  try {
    if (status === "APPROVED") {
      const { error } = await supabase.rpc("confirm_boleta_payment", {
        p_purchase_id: purchaseId,
        p_wompi_transaction_id: transactionId,
      });
      if (error) {
        console.error("[boletas/webhook] confirm_boleta_payment:", error.message);
        return NextResponse.json({ error: "No pudimos confirmar el pago." }, { status: 500 });
      }
      await sendTicketEmailForPurchase(purchaseId);
    } else if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
      const { error } = await supabase.rpc("cancel_boleta_payment", { p_purchase_id: purchaseId });
      if (error) {
        console.error("[boletas/webhook] cancel_boleta_payment:", error.message);
      }
    }
  } catch (err) {
    console.error("[boletas/webhook] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

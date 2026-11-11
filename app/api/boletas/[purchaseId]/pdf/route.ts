import { NextResponse } from "next/server";
import { getTicketsPdfBuffer } from "@/lib/ticket-delivery";

/** Descarga el PDF de una compra ya pagada (ej. desde /boletas/resultado). */
export async function GET(_req: Request, { params }: { params: { purchaseId: string } }) {
  try {
    const buffer = await getTicketsPdfBuffer(params.purchaseId);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=boleta-zipa-fc.pdf",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del servidor.";
    if (message === "PURCHASE_NOT_COMPLETED") {
      return NextResponse.json({ error: "Esta compra todavía no está pagada." }, { status: 409 });
    }
    console.error("[boletas/pdf]:", message);
    return NextResponse.json({ error: "No pudimos generar la boleta." }, { status: 500 });
  }
}

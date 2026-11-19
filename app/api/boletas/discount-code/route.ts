import { NextResponse } from "next/server";
import { z } from "zod";
import { isPlayerDiscountCode } from "@/lib/discount-code";
import { CATEDRAL_PLAYER_PRICE_COP } from "@/lib/stadium-seating";

/** Valida un código de descuento (solo dice si sirve y a cuánto queda la boleta). */
const schema = z.object({ code: z.string().trim().min(1).max(60) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success || !isPlayerDiscountCode(parsed.data.code)) {
      return NextResponse.json({ ok: false, error: "Código de descuento inválido." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, pricePerSeat: CATEDRAL_PLAYER_PRICE_COP });
  } catch {
    return NextResponse.json({ ok: false, error: "Código de descuento inválido." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/** Valida y marca el ingreso de una boleta escaneando su QR. Protegido por GATE_STAFF_SECRET. */
const checkinSchema = z.object({
  ticketCode: z.string().trim().min(1),
  checkedBy: z.string().trim().min(1).max(80).nullable().optional(),
});

export async function POST(req: Request) {
  const secret = process.env.GATE_STAFF_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "GATE_STAFF_SECRET no está configurado." }, { status: 500 });
  }
  if (req.headers.get("x-admin-secret") !== secret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Código inválido." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: reg, error } = await supabase
      .from("abono_registrations")
      .select("id, seat_number, holder_full_name, checked_in_at, purchase_id, abono_purchases!inner(status)")
      .eq("ticket_code", parsed.data.ticketCode.trim())
      .maybeSingle();

    if (error) {
      console.error("[tickets/checkin]:", error.message);
      return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
    }
    if (!reg || (reg.abono_purchases as unknown as { status: string }).status !== "completed") {
      return NextResponse.json({ ok: false, result: "INVALID", message: "Boleta no válida." }, { status: 404 });
    }

    if (reg.checked_in_at) {
      return NextResponse.json({
        ok: false,
        result: "ALREADY_USED",
        message: "Esta boleta ya ingresó.",
        holderFullName: reg.holder_full_name,
        seatNumber: reg.seat_number,
        checkedInAt: reg.checked_in_at,
      });
    }

    await supabase
      .from("abono_registrations")
      .update({ checked_in_at: new Date().toISOString(), checked_in_by: parsed.data.checkedBy ?? null })
      .eq("id", reg.id);

    return NextResponse.json({
      ok: true,
      result: "OK",
      holderFullName: reg.holder_full_name,
      seatNumber: reg.seat_number,
    });
  } catch (err) {
    console.error("[tickets/checkin] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

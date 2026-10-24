import { NextResponse } from "next/server";
import { z } from "zod";
import { isCourtesySeatNumber } from "@/lib/stadium-seating";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/** Borra una asignación de silla (por error de digitación, etc). Protegido por TRIBUNA_ADMIN_SECRET. */
const removeSchema = z.object({
  purchaseId: z.string().uuid(),
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
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Si es abono de temporada, la silla quedó marcada "reserved" para siempre
    // en stadium_seats — hay que liberarla manualmente antes de borrar (las
    // boletas de un partido puntual nunca tocan stadium_seats, no aplica).
    const { data: purchase } = await supabase
      .from("abono_purchases")
      .select("purchase_type")
      .eq("id", parsed.data.purchaseId)
      .maybeSingle();

    let freedSeat: number | null = null;
    if (purchase?.purchase_type === "abono") {
      const { data: registration } = await supabase
        .from("abono_registrations")
        .select("seat_number")
        .eq("purchase_id", parsed.data.purchaseId)
        .maybeSingle();
      freedSeat = registration?.seat_number ?? null;
    }

    const { error } = await supabase.from("abono_purchases").delete().eq("id", parsed.data.purchaseId);

    if (error) {
      console.error("[abonos/admin/remove]:", error.message);
      return NextResponse.json({ error: "No pudimos borrar la asignación." }, { status: 500 });
    }

    if (freedSeat != null) {
      // Las sillas de cortesía (479-504) nunca vuelven a "available": siguen
      // bloqueadas para el público aunque no tengan a nadie asignado.
      await supabase
        .from("stadium_seats")
        .update({
          status: isCourtesySeatNumber(freedSeat) ? "courtesy" : "available",
          updated_at: new Date().toISOString(),
        })
        .eq("seat_number", freedSeat);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[abonos/admin/remove] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { BETSSON_BUCKET } from "@/lib/betsson";
import { issueBetssonTickets, notifyBetssonRejected, releaseBetssonHold } from "@/lib/betsson-server";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(300).optional(),
});

/** Aprobar (emite boletas gratis y las envía) o rechazar una solicitud en revisión. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: sub } = await supabase.from("betsson_submissions").select("*").eq("id", params.id).maybeSingle();
  if (!sub) return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
  if (sub.status !== "pending") {
    return NextResponse.json({ error: `La solicitud ya está ${sub.status === "approved" ? "aprobada" : "rechazada"}.` }, { status: 409 });
  }

  if (parsed.data.action === "approve") {
    const result = await issueBetssonTickets(params.id, { reviewer: auth.user.email ?? "admin", allowAlternates: true });
    if (!result.ok) {
      const status = result.code === "SEAT_NOT_AVAILABLE" ? 409 : 500;
      return NextResponse.json(
        {
          error:
            result.code === "SEAT_NOT_AVAILABLE"
              ? "Se vencieron las sillas guardadas y no quedan sillas libres en esa zona. Recházala (con aviso) para que vuelva a intentar."
              : result.message,
        },
        { status }
      );
    }
    return NextResponse.json({ ok: true, emailSent: result.emailSent, reassigned: result.reassigned });
  }

  const reason = parsed.data.reason || "No pudimos validar tu pantallazo de Betsson.";
  await supabase
    .from("betsson_submissions")
    .update({ status: "rejected", reason, reviewed_by: auth.user.email ?? "admin", reviewed_at: new Date().toISOString() })
    .eq("id", params.id);
  if (sub.image_path) await supabase.storage.from(BETSSON_BUCKET).remove([sub.image_path]);
  await releaseBetssonHold(sub.purchase_id);
  await notifyBetssonRejected(sub.purchaser_email, reason);
  return NextResponse.json({ ok: true });
}

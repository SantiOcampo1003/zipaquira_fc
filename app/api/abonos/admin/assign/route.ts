import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { mapRpcErrorToMessage } from "@/lib/stadium-db";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * Asigna una silla específica a una persona (venta física el día del partido).
 * Protegido por TRIBUNA_ADMIN_SECRET — pensado para el panel /tribuna/admin,
 * nunca para el navegador de un hincha normal.
 */
const assignSchema = z.object({
  zoneId: z.enum(["verde", "blanca", "roja"]),
  seatNumber: z.number().int().min(1).max(568),
  holderFullName: z.string().trim().min(2),
  holderDocumentId: z.string().trim().min(3),
  holderPhone: z.string().trim().min(7),
  holderEmail: z.string().trim().email().optional().or(z.literal("")),
  matchLabel: z.string().trim().max(120).optional(), // vacío/"abono" = abono de temporada
});

function generateToken(): string {
  return randomBytes(18).toString("base64url");
}

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
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
    }

    const { zoneId, seatNumber, holderFullName, holderDocumentId, holderPhone, holderEmail, matchLabel } =
      parsed.data;
    const supabase = getSupabaseAdmin();

    const isAbono = !matchLabel || matchLabel.trim().toLowerCase() === "abono";
    let matchId: string | null = null;

    if (!isAbono) {
      const { data: matchRow, error: matchError } = await supabase
        .from("matches")
        .select("id")
        .ilike("ticket_label", matchLabel!.trim())
        .maybeSingle();

      if (matchError) {
        console.error("[abonos/admin/assign] match lookup:", matchError.message);
        return NextResponse.json({ error: "No pudimos buscar el partido." }, { status: 500 });
      }
      if (!matchRow) {
        return NextResponse.json(
          { error: `No encontramos el partido "${matchLabel}".` },
          { status: 400 }
        );
      }
      matchId = matchRow.id;
    }

    const purchaserEmail =
      holderEmail?.trim() ||
      `taquilla-${holderDocumentId.trim().replace(/\D/g, "") || Date.now()}@zipaquirafc.local`;
    const token = generateToken();

    const { data: purchase, error: insertError } = await supabase
      .from("abono_purchases")
      .insert({
        purchaser_email: purchaserEmail.toLowerCase(),
        abono_count: 1,
        zone_id: zoneId,
        purchase_type: isAbono ? "abono" : "boleta",
        match_id: matchId,
        access_token: token,
        status: "pending_seats",
      })
      .select("id")
      .single();

    if (insertError || !purchase) {
      console.error("[abonos/admin/assign] insert purchase:", insertError?.message);
      return NextResponse.json({ error: "No pudimos crear el registro." }, { status: 500 });
    }

    const { error: rpcError } = await supabase.rpc("confirm_abono_purchase", {
      p_token: token,
      p_purchaser_email: purchaserEmail.toLowerCase(),
      p_assignments: [
        {
          abono_index: 1,
          seat_number: seatNumber,
          holder_full_name: holderFullName.trim(),
          holder_document_id: holderDocumentId.trim(),
          holder_phone: holderPhone.trim(),
          jersey_size: null,
        },
      ],
    });

    if (rpcError) {
      console.error("[abonos/admin/assign] RPC:", rpcError.message);
      // Limpia la compra pendiente que quedó huérfana si la silla no se pudo confirmar.
      await supabase.from("abono_purchases").delete().eq("id", purchase.id);
      return NextResponse.json({ error: mapRpcErrorToMessage(rpcError.message) }, { status: 400 });
    }

    return NextResponse.json({ ok: true, purchaseId: purchase.id });
  } catch (err) {
    console.error("[abonos/admin/assign] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

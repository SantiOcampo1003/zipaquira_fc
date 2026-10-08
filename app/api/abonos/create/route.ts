import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * Crea (o reutiliza) una compra pendiente (abono de temporada o boleta de un
 * partido puntual) y devuelve el link de Tu Boleta.
 * Pensado para ser llamado desde el Apps Script del sheet "compras tu boleta"
 * con un secreto compartido — nunca desde el navegador del hincha.
 */
const createSchema = z.object({
  email: z.string().trim().email(),
  abonoCount: z.number().int().min(1).max(10),
  zoneId: z.enum(["verde", "blanca", "roja"]),
  // Texto de la columna "Tipo de compra" del sheet. "abono" (o vacío) = abono
  // de temporada. Cualquier otro texto = boleta para ese partido puntual
  // (debe coincidir, sin importar mayúsculas, con matches.ticket_label).
  matchLabel: z.string().trim().max(120).optional(),
  expiresInDays: z.number().int().min(1).max(90).optional().default(30),
});

function generateToken(): string {
  return randomBytes(18).toString("base64url");
}

function getSiteUrl(): string {
  return process.env.SITE_URL?.replace(/\/$/, "") || "https://zipaquira-fc-eta.vercel.app";
}

export async function POST(req: Request) {
  const adminSecret = process.env.ABONOS_ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "ABONOS_ADMIN_SECRET no está configurado en el servidor." },
      { status: 500 }
    );
  }

  if (req.headers.get("x-admin-secret") !== adminSecret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
    }

    const { email, abonoCount, zoneId, matchLabel, expiresInDays } = parsed.data;
    const purchaserEmail = email.trim().toLowerCase();
    const supabase = getSupabaseAdmin();

    const isAbono = !matchLabel || matchLabel.trim().toLowerCase() === "abono";
    const purchaseType = isAbono ? "abono" : "boleta";
    let matchId: string | null = null;
    let resolvedMatchLabel: string | null = null;

    if (!isAbono) {
      const { data: matchRow, error: matchError } = await supabase
        .from("matches")
        .select("id, ticket_label, opponent")
        .ilike("ticket_label", matchLabel!.trim())
        .maybeSingle();

      if (matchError) {
        console.error("[abonos/create] match lookup:", matchError.message);
        return NextResponse.json({ error: "No pudimos buscar el partido." }, { status: 500 });
      }

      if (!matchRow) {
        return NextResponse.json(
          {
            error: `No encontramos el partido "${matchLabel}". Revisa que el texto coincida exacto o avisa al club.`,
          },
          { status: 400 }
        );
      }

      matchId = matchRow.id;
      resolvedMatchLabel = matchRow.ticket_label ?? matchRow.opponent;
    }

    let existingQuery = supabase
      .from("abono_purchases")
      .select("id, access_token, status")
      .eq("purchaser_email", purchaserEmail)
      .eq("zone_id", zoneId)
      .eq("purchase_type", purchaseType)
      .eq("status", "pending_seats");

    existingQuery = matchId ? existingQuery.eq("match_id", matchId) : existingQuery.is("match_id", null);

    const { data: existing, error: existingError } = await existingQuery.maybeSingle();

    if (existingError) {
      console.error("[abonos/create] lookup:", existingError.message);
      return NextResponse.json({ error: "No pudimos consultar compras previas." }, { status: 500 });
    }

    let token = existing?.access_token ?? null;

    if (!token) {
      token = generateToken();
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from("abono_purchases").insert({
        purchaser_email: purchaserEmail,
        abono_count: abonoCount,
        zone_id: zoneId,
        purchase_type: purchaseType,
        match_id: matchId,
        access_token: token,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error("[abonos/create] insert:", insertError.message);
        return NextResponse.json({ error: "No pudimos crear la compra." }, { status: 500 });
      }
    }

    const link = `${getSiteUrl()}/tribuna?token=${token}`;

    return NextResponse.json({
      ok: true,
      token,
      link,
      purchaseType,
      matchLabel: resolvedMatchLabel,
    });
  } catch (err) {
    console.error("[abonos/create] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

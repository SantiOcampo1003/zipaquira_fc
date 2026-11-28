import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAuthUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { BETSSON_BUCKET, BETSSON_MAX_IMAGE_BYTES, isBetssonMatch } from "@/lib/betsson";
import { analyzeBetssonScreenshot, decide, issueBetssonTickets, type BetssonSeat } from "@/lib/betsson-server";

export const maxDuration = 60;

/**
 * "Betsson patrocina tu partido": la persona registrada en Betsson (con el link del club) sube
 * un pantallazo de su perfil y obtiene su boleta gratis (+ una para un menor acompañante).
 * Requiere sesión de Google. Sin Wompi.
 */
const seatSchema = z.object({
  seatNumber: z.number().int().min(1).max(568),
  holderFullName: z.string().trim().min(2),
  holderDocumentId: z.string().trim().regex(/^\d{5,12}$/, { message: "El documento debe tener solo números." }),
  holderPhone: z.string().trim().min(7),
});

const schema = z.object({
  matchLabel: z.string().trim().max(120),
  zoneId: z.enum(["verde", "blanca", "roja"]),
  /** [0] = persona registrada en Betsson; [1] (opcional) = menor que la acompaña. */
  seats: z.array(seatSchema).min(1).max(2),
  purchaserPhone: z.string().trim().min(7),
  confirmAdult: z.literal(true),
  confirmData: z.literal(true),
  confirmMinor: z.boolean().optional(),
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  try {
    const user = await resolveAuthUser(req);
    if (!user?.email) return fail("Debes iniciar sesión con Google para continuar.", 401);
    const purchaserEmail = user.email.toLowerCase();

    const form = await req.formData();
    const image = form.get("image");
    let payload: unknown;
    try {
      payload = JSON.parse(String(form.get("data") ?? ""));
    } catch {
      return fail("Datos incompletos o inválidos.", 400);
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) return fail("Datos incompletos o inválidos. Revisa los campos y las casillas de confirmación.", 400);
    const { matchLabel, zoneId, seats, purchaserPhone, confirmMinor } = parsed.data;

    if (!isBetssonMatch(matchLabel)) return fail("Este partido no tiene el programa de Betsson.", 400);
    if (seats.length === 2 && confirmMinor !== true) {
      return fail("Confirma que la segunda boleta es para un menor de edad.", 400);
    }
    if (new Set(seats.map((s) => s.seatNumber)).size !== seats.length) return fail("Elige sillas distintas.", 400);

    if (!(image instanceof File) || image.size === 0) return fail("Sube el pantallazo de tu perfil de Betsson.", 400);
    if (!ALLOWED_MIME.has(image.type)) return fail("El pantallazo debe ser una imagen (JPG, PNG o WEBP).", 400);
    if (image.size > BETSSON_MAX_IMAGE_BYTES) return fail("La imagen es muy pesada (máximo 4 MB).", 400);
    const buffer = Buffer.from(await image.arrayBuffer());
    const imageHash = createHash("sha256").update(buffer).digest("hex");

    const supabase = getSupabaseAdmin();
    const { data: matchRow, error: matchError } = await supabase
      .from("matches")
      .select("id")
      .ilike("ticket_label", matchLabel)
      .maybeSingle();
    if (matchError || !matchRow) return fail("No encontramos el partido.", 400);

    const adult = seats[0];
    const seatRows: BetssonSeat[] = seats.map((s, i) => ({
      seatNumber: s.seatNumber,
      holderFullName: s.holderFullName,
      holderDocumentId: s.holderDocumentId,
      // El menor usa el celular del adulto que lo acompaña.
      holderPhone: i === 0 ? s.holderPhone : adult.holderPhone,
      isMinor: i === 1,
    }));

    // Se inserta primero: los índices únicos frenan duplicados (cuenta, cédula, pantallazo).
    const imagePath = `${matchRow.id}/${imageHash}.${image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg"}`;
    const { data: inserted, error: insertError } = await supabase
      .from("betsson_submissions")
      .insert({
        match_id: matchRow.id,
        purchaser_email: purchaserEmail,
        purchaser_phone: purchaserPhone,
        holder_document_id: adult.holderDocumentId,
        zone_id: zoneId,
        seats: seatRows,
        image_path: imagePath,
        image_hash: imageHash,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      if (insertError?.code === "23505") {
        return fail("Ya existe un registro con esta cuenta, esta cédula o este pantallazo para el partido.", 409);
      }
      console.error("[betsson/checkout] insert:", insertError?.message);
      return fail("No pudimos guardar tu solicitud.", 500);
    }
    const submissionId = inserted.id as string;

    const reject = async (reason: string, status: number) => {
      await supabase.from("betsson_submissions").update({ status: "rejected", reason }).eq("id", submissionId);
      await supabase.storage.from(BETSSON_BUCKET).remove([imagePath]);
      return fail(reason, status);
    };

    const { error: uploadError } = await supabase.storage
      .from(BETSSON_BUCKET)
      .upload(imagePath, buffer, { contentType: image.type, upsert: true });
    if (uploadError) {
      console.error("[betsson/checkout] upload:", uploadError.message);
      return reject("No pudimos guardar el pantallazo. Intenta de nuevo.", 500);
    }

    const analysis = await analyzeBetssonScreenshot(buffer, image.type);
    const verdict = decide(analysis, adult.holderFullName);

    // El correo de Betsson leído del pantallazo debe ser único entre las solicitudes.
    if (analysis?.email) {
      const { error: emailError } = await supabase
        .from("betsson_submissions")
        .update({ betsson_email: analysis.email, betsson_name: analysis.fullName })
        .eq("id", submissionId);
      if (emailError?.code === "23505") {
        return reject("Ese correo de Betsson ya fue usado en otra solicitud.", 409);
      }
    }
    await supabase
      .from("betsson_submissions")
      .update({ ai_result: analysis, reason: verdict.reason })
      .eq("id", submissionId);

    if (verdict.status === "rejected") return reject(verdict.reason, 422);

    if (verdict.status === "pending") {
      return NextResponse.json({ ok: true, status: "pending", email: purchaserEmail });
    }

    const issued = await issueBetssonTickets(submissionId);
    if (!issued.ok) {
      if (issued.code === "SEAT_NOT_AVAILABLE") {
        return reject("Una de las sillas ya fue tomada. Elige otras en el mapa.", 409);
      }
      return reject("No pudimos emitir la boleta. Intenta de nuevo.", 500);
    }
    return NextResponse.json({ ok: true, status: "approved", email: purchaserEmail, emailSent: issued.emailSent, seats: seats.length });
  } catch (err) {
    console.error("[betsson/checkout] Unexpected:", err);
    return fail("Error del servidor.", 500);
  }
}

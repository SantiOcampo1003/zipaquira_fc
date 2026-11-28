import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAuthUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { BETSSON_BUCKET, BETSSON_MAX_IMAGE_BYTES, BETSSON_MAX_REGISTRATIONS, isBetssonMatch } from "@/lib/betsson";
import {
  analyzeBetssonScreenshot,
  decide,
  holdBetssonSeats,
  issueBetssonTickets,
  notifyAdminsPending,
  type BetssonSeat,
} from "@/lib/betsson-server";

export const maxDuration = 60;

/**
 * "Betsson patrocina tu partido": cada persona registrada en Betsson (con el link del club) sube
 * un pantallazo de su perfil y obtiene su boleta gratis, más una para UN menor que la acompaña.
 * En una misma compra se pueden enviar varios registros (cada uno con su pantallazo); cada registro
 * se evalúa por separado. Requiere sesión de Google. Sin Wompi.
 */
const personSchema = z.object({
  /** null en la tribuna General (sin silla). */
  seatNumber: z.number().int().min(1).max(568).nullable(),
  holderFullName: z.string().trim().min(2),
  holderDocumentId: z.string().trim().regex(/^\d{5,12}$/, { message: "El documento debe tener solo números." }),
});

const schema = z.object({
  matchLabel: z.string().trim().max(120),
  zoneId: z.enum(["verde", "blanca", "roja", "general"]),
  purchaserPhone: z.string().trim().min(7),
  confirmAdult: z.literal(true),
  confirmData: z.literal(true),
  confirmMinor: z.boolean().optional(),
  registrations: z
    .array(
      z.object({
        adult: personSchema.extend({ holderPhone: z.string().trim().min(7) }),
        minor: personSchema.optional(),
      })
    )
    .min(1)
    .max(BETSSON_MAX_REGISTRATIONS),
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type RegistrationResult =
  | { index: number; status: "approved"; emailSent: boolean; seats: number }
  | { index: number; status: "pending"; seats: number }
  | { index: number; status: "rejected"; error: string };

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  try {
    const user = await resolveAuthUser(req);
    if (!user?.email) return fail("Debes iniciar sesión con Google para continuar.", 401);
    const purchaserEmail = user.email.toLowerCase();

    const form = await req.formData();
    let payload: unknown;
    try {
      payload = JSON.parse(String(form.get("data") ?? ""));
    } catch {
      return fail("Datos incompletos o inválidos.", 400);
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) return fail("Datos incompletos o inválidos. Revisa los campos y las casillas de confirmación.", 400);
    const { matchLabel, zoneId, purchaserPhone, confirmMinor, registrations } = parsed.data;

    if (!isBetssonMatch(matchLabel)) return fail("Este partido no tiene el programa de Betsson.", 400);
    if (registrations.some((r) => r.minor) && confirmMinor !== true) {
      return fail("Confirma que la boleta adicional es para un menor de edad.", 400);
    }

    const everyone = registrations.flatMap((r) => (r.minor ? [r.adult, r.minor] : [r.adult]));
    if (zoneId === "general") {
      if (everyone.some((p) => p.seatNumber !== null)) return fail("La tribuna General no tiene sillas.", 400);
    } else {
      if (everyone.some((p) => p.seatNumber === null)) return fail("Falta elegir la silla de cada persona.", 400);
      if (new Set(everyone.map((p) => p.seatNumber)).size !== everyone.length) return fail("Elige sillas distintas.", 400);
    }
    if (new Set(everyone.map((p) => p.holderDocumentId)).size !== everyone.length) {
      return fail("Cada persona debe tener un documento distinto.", 400);
    }

    // Imágenes: una por registro (image_0, image_1, …).
    const images: { buffer: Buffer; mime: string; hash: string }[] = [];
    for (let i = 0; i < registrations.length; i++) {
      const image = form.get(`image_${i}`);
      if (!(image instanceof File) || image.size === 0) {
        return fail(`Falta el pantallazo de Betsson de ${registrations[i].adult.holderFullName}.`, 400);
      }
      if (!ALLOWED_MIME.has(image.type)) return fail("Los pantallazos deben ser imágenes (JPG, PNG o WEBP).", 400);
      if (image.size > BETSSON_MAX_IMAGE_BYTES) return fail("Una imagen es muy pesada (máximo 4 MB).", 400);
      const buffer = Buffer.from(await image.arrayBuffer());
      images.push({ buffer, mime: image.type, hash: createHash("sha256").update(buffer).digest("hex") });
    }
    if (new Set(images.map((im) => im.hash)).size !== images.length) {
      return fail("Cada persona debe subir su propio pantallazo (hay imágenes repetidas).", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: matchRow, error: matchError } = await supabase
      .from("matches")
      .select("id")
      .ilike("ticket_label", matchLabel)
      .maybeSingle();
    if (matchError || !matchRow) return fail("No encontramos el partido.", 400);

    const results: RegistrationResult[] = [];
    for (let i = 0; i < registrations.length; i++) {
      results.push(
        await processRegistration({
          index: i,
          matchId: matchRow.id as string,
          zoneId,
          purchaserEmail,
          purchaserPhone,
          registration: registrations[i],
          image: images[i],
        })
      );
    }
    return NextResponse.json({ ok: true, email: purchaserEmail, results });
  } catch (err) {
    console.error("[betsson/checkout] Unexpected:", err);
    return fail("Error del servidor.", 500);
  }
}

async function processRegistration(params: {
  index: number;
  matchId: string;
  zoneId: string;
  purchaserEmail: string;
  purchaserPhone: string;
  registration: z.infer<typeof schema>["registrations"][number];
  image: { buffer: Buffer; mime: string; hash: string };
}): Promise<RegistrationResult> {
  const { index, matchId, zoneId, purchaserEmail, purchaserPhone, registration, image } = params;
  const supabase = getSupabaseAdmin();
  const { adult, minor } = registration;

  const seatRows: BetssonSeat[] = [
    { seatNumber: adult.seatNumber, holderFullName: adult.holderFullName, holderDocumentId: adult.holderDocumentId, holderPhone: adult.holderPhone, isMinor: false },
    ...(minor
      ? [{ seatNumber: minor.seatNumber, holderFullName: minor.holderFullName, holderDocumentId: minor.holderDocumentId, holderPhone: adult.holderPhone, isMinor: true }]
      : []),
  ];

  // Se inserta primero: los índices únicos frenan duplicados (cédula, pantallazo, correo de Betsson).
  const ext = image.mime === "image/png" ? "png" : image.mime === "image/webp" ? "webp" : "jpg";
  const imagePath = `${matchId}/${image.hash}.${ext}`;
  const { data: inserted, error: insertError } = await supabase
    .from("betsson_submissions")
    .insert({
      match_id: matchId,
      purchaser_email: purchaserEmail,
      purchaser_phone: purchaserPhone,
      holder_document_id: adult.holderDocumentId,
      zone_id: zoneId,
      seats: seatRows,
      image_path: imagePath,
      image_hash: image.hash,
      status: "pending",
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    if (insertError?.code === "23505") {
      return {
        index,
        status: "rejected",
        error: "Esa cédula o ese pantallazo ya fue registrado para este partido.",
      };
    }
    console.error("[betsson/checkout] insert:", insertError?.message);
    return { index, status: "rejected", error: "No pudimos guardar este registro." };
  }
  const submissionId = inserted.id as string;

  const reject = async (reason: string): Promise<RegistrationResult> => {
    await supabase.from("betsson_submissions").update({ status: "rejected", reason }).eq("id", submissionId);
    await supabase.storage.from(BETSSON_BUCKET).remove([imagePath]);
    return { index, status: "rejected", error: reason };
  };

  const { error: uploadError } = await supabase.storage
    .from(BETSSON_BUCKET)
    .upload(imagePath, image.buffer, { contentType: image.mime, upsert: true });
  if (uploadError) {
    console.error("[betsson/checkout] upload:", uploadError.message);
    return reject("No pudimos guardar el pantallazo. Intenta de nuevo.");
  }

  const analysis = await analyzeBetssonScreenshot(image.buffer, image.mime);
  const verdict = decide(analysis, adult.holderFullName);

  // El correo de Betsson leído del pantallazo debe ser único entre las solicitudes.
  if (analysis?.email) {
    const { error: emailError } = await supabase
      .from("betsson_submissions")
      .update({ betsson_email: analysis.email, betsson_name: analysis.fullName })
      .eq("id", submissionId);
    if (emailError?.code === "23505") return reject("Ese correo de Betsson ya fue usado en otro registro.");
  }
  await supabase.from("betsson_submissions").update({ ai_result: analysis, reason: verdict.reason }).eq("id", submissionId);

  if (verdict.status === "rejected") return reject(verdict.reason);

  const seatCount = seatRows.length;

  if (verdict.status === "pending") {
    // Se guardan las sillas mientras alguien del club revisa el pantallazo.
    const held = await holdBetssonSeats(submissionId);
    if (!held) return reject("Una de las sillas ya fue tomada. Elige otras en el mapa.");
    await notifyAdminsPending({
      purchaserEmail,
      holderName: adult.holderFullName,
      seatNumbers: seatRows.map((s) => s.seatNumber),
      zoneId,
      reason: verdict.reason,
    });
    return { index, status: "pending", seats: seatCount };
  }

  const issued = await issueBetssonTickets(submissionId);
  if (!issued.ok) {
    if (issued.code === "SEAT_NOT_AVAILABLE") return reject("Una de las sillas ya fue tomada. Elige otras en el mapa.");
    return reject("No pudimos emitir la boleta. Intenta de nuevo.");
  }
  return { index, status: "approved", emailSent: issued.emailSent, seats: seatCount };
}

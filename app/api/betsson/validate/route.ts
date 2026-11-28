import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { resolveAuthUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { BETSSON_MAX_IMAGE_BYTES, isBetssonMatch } from "@/lib/betsson";
import { analyzeBetssonScreenshot, decide } from "@/lib/betsson-server";

export const maxDuration = 30;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type Check =
  | { state: "valid"; message: string; email: string | null; name: string | null }
  | { state: "review"; message: string; email: string | null; name: string | null }
  | { state: "invalid"; message: string; email: string | null; name: string | null };

/**
 * Validación en vivo del pantallazo (apenas se sube). No guarda nada: solo dice si el pantallazo
 * es de un perfil de Betsson y si esa persona/pantallazo ya se había registrado. La decisión final
 * se vuelve a tomar al enviar (/api/betsson/checkout).
 */
export async function POST(req: Request) {
  try {
    const user = await resolveAuthUser(req);
    if (!user?.email) return NextResponse.json({ error: "Debes iniciar sesión con Google." }, { status: 401 });

    const form = await req.formData();
    const image = form.get("image");
    const matchLabel = String(form.get("matchLabel") ?? "");
    const holderName = String(form.get("holderFullName") ?? "").trim();
    if (!isBetssonMatch(matchLabel)) return NextResponse.json({ error: "Partido inválido." }, { status: 400 });
    if (!(image instanceof File) || image.size === 0) return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
    if (!ALLOWED_MIME.has(image.type)) {
      return NextResponse.json({ error: "Sube una imagen (JPG, PNG o WEBP)." }, { status: 400 });
    }
    if (image.size > BETSSON_MAX_IMAGE_BYTES) return NextResponse.json({ error: "La imagen es muy pesada." }, { status: 400 });

    const buffer = Buffer.from(await image.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex");

    const supabase = getSupabaseAdmin();
    const { data: matchRow } = await supabase.from("matches").select("id").ilike("ticket_label", matchLabel).maybeSingle();
    if (!matchRow) return NextResponse.json({ error: "No encontramos el partido." }, { status: 400 });

    // ¿Este mismo pantallazo ya se usó?
    const { data: sameImage } = await supabase
      .from("betsson_submissions")
      .select("id")
      .eq("match_id", matchRow.id)
      .eq("image_hash", hash)
      .neq("status", "rejected")
      .limit(1);
    if (sameImage && sameImage.length > 0) {
      return NextResponse.json<Check>({
        state: "invalid",
        message: "Este pantallazo ya fue usado. Cada persona debe subir el suyo.",
        email: null,
        name: null,
      });
    }

    const analysis = await analyzeBetssonScreenshot(buffer, image.type);
    if (!analysis) {
      return NextResponse.json<Check>({
        state: "review",
        message: "No pudimos validarlo en este momento. Puedes enviarlo y el equipo lo revisa.",
        email: null,
        name: null,
      });
    }
    const email = analysis.email;
    const name = analysis.fullName;

    // ¿Esa persona (correo de Betsson) ya pasó un pantallazo?
    if (email) {
      const { data: sameEmail } = await supabase
        .from("betsson_submissions")
        .select("id")
        .eq("match_id", matchRow.id)
        .eq("betsson_email", email)
        .neq("status", "rejected")
        .limit(1);
      if (sameEmail && sameEmail.length > 0) {
        return NextResponse.json<Check>({
          state: "invalid",
          message: `Esta persona ya registró un pantallazo (${email}). Cada correo de Betsson solo se puede usar una vez.`,
          email,
          name,
        });
      }
    }

    const verdict = decide(analysis, holderName || name || "");
    if (verdict.status === "rejected") {
      return NextResponse.json<Check>({
        state: "invalid",
        message: verdict.reason,
        email,
        name,
      });
    }
    if (verdict.status === "pending") {
      return NextResponse.json<Check>({
        state: "review",
        message: `${verdict.reason} Puedes enviarlo y el equipo lo revisa.`,
        email,
        name,
      });
    }
    return NextResponse.json<Check>({
      state: "valid",
      message: `Validado: perfil de Betsson de ${name ?? "la persona"}${email ? ` (${email})` : ""}.`,
      email,
      name,
    });
  } catch (err) {
    console.error("[betsson/validate]", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

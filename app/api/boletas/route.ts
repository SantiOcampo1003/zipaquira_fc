import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const ticketSchema = z.object({
  fullName: z.string().trim().min(2, { message: "El nombre es obligatorio" }),
  documentId: z.string().trim().min(5, { message: "Ingresa tu cédula" }),
  phone: z.string().trim().min(7, { message: "El teléfono es obligatorio" }),
  email: z.string().trim().email({ message: "Ingresa un correo válido" }),
  city: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ticketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos incompletos o inválidos." },
        { status: 400 }
      );
    }

    const { fullName, documentId, phone, email, city } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("ticket_interest").insert({
      full_name: fullName.trim(),
      document_id: documentId.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      city: city?.trim() || null,
    });

    if (error) {
      console.error("[boletas] Supabase error:", error.message);
      return NextResponse.json(
        { error: "No pudimos guardar tus datos. Intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[boletas] Unexpected error:", err);
    return NextResponse.json(
      { error: "Error del servidor. Revisa la configuración de Supabase." },
      { status: 500 }
    );
  }
}

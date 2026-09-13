import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const orderSchema = z.object({
  fullName: z.string().trim().min(2, { message: "El nombre es obligatorio" }),
  phone: z.string().trim().min(7, { message: "El celular es obligatorio" }),
  email: z.string().trim().email().optional().or(z.literal("")),
  size: z.enum(["S", "M", "L", "XL"]),
  quantity: z.number().int().min(1).max(10),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos incompletos o inválidos." },
        { status: 400 }
      );
    }

    const { fullName, phone, email, size, quantity } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("jersey_orders")
      .insert({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        size,
        quantity,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[jersey-orders] Supabase error:", error.message);
      return NextResponse.json(
        { error: "No pudimos guardar tu pedido. Intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, orderId: data.id });
  } catch (err) {
    console.error("[jersey-orders] Unexpected error:", err);
    return NextResponse.json(
      { error: "Error del servidor." },
      { status: 500 }
    );
  }
}

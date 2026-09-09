import { NextResponse } from "next/server";
import { z } from "zod";
import { mapRpcErrorToMessage } from "@/lib/stadium-db";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const assignmentSchema = z.object({
  abono_index: z.number().int().min(1).max(10),
  seat_number: z.number().int().min(1).max(568),
  holder_full_name: z.string().trim().min(2),
  holder_document_id: z.string().trim().min(5),
  jersey_size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
});

const confirmSchema = z.object({
  token: z.string().trim().min(8),
  purchaserEmail: z.string().trim().email(),
  assignments: z.array(assignmentSchema).min(1).max(10),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
    }

    const { token, purchaserEmail, assignments } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data: purchaseId, error } = await supabase.rpc("confirm_abono_purchase", {
      p_token: token,
      p_purchaser_email: purchaserEmail.trim().toLowerCase(),
      p_assignments: assignments,
    });

    if (error) {
      console.error("[abonos/confirm] RPC:", error.message);
      return NextResponse.json(
        { error: mapRpcErrorToMessage(error.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, purchaseId });
  } catch (err) {
    console.error("[abonos/confirm] Unexpected:", err);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}

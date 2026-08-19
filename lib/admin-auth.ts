import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getSupabaseAuthServer } from "@/lib/supabase-auth-server";

export async function resolveAuthUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (token) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user;
  }

  const supabase = await getSupabaseAuthServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireAdmin(req: Request): Promise<
  | { user: User; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await resolveAuthUser(req);

  if (!user?.email) {
    return {
      user: null,
      error: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }),
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("[admin-auth]", error.message);
    return {
      user: null,
      error: NextResponse.json({ error: "Error al verificar permisos." }, { status: 500 }),
    };
  }

  if (!data) {
    return {
      user: null,
      error: NextResponse.json({ error: "No tienes permisos de administrador." }, { status: 403 }),
    };
  }

  // Vincular user_id la primera vez que entra
  if (user.id) {
    await supabase
      .from("admin_users")
      .update({ user_id: user.id })
      .eq("email", user.email.toLowerCase())
      .is("user_id", null);
  }

  return { user, error: null };
}

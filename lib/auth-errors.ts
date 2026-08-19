import type { AuthError } from "@supabase/supabase-js";

/** Mensajes claros para errores comunes de Supabase Auth. */
export function mapAuthError(error: AuthError): string {
  if (error.status === 429) {
    return "Demasiados intentos seguidos. Espera 5–10 minutos y vuelve a intentar (límite de Supabase).";
  }

  const msg = error.message.toLowerCase();

  if (msg.includes("redirect") || msg.includes("url")) {
    return "URL de redirección no permitida. Revisa Authentication → URL Configuration en Supabase.";
  }

  if (msg.includes("email") && msg.includes("invalid")) {
    return "Correo inválido. Revisa que esté bien escrito.";
  }

  if (msg.includes("signup") && msg.includes("disabled")) {
    return "El registro por correo está desactivado en Supabase.";
  }

  return error.message || "No pudimos enviar el enlace. Intenta de nuevo.";
}

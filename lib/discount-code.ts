/**
 * Código de descuento para jugadores (Catedral): precio fijo por boleta.
 * El código vive solo en el servidor (PLAYER_DISCOUNT_CODE) — nunca viaja en el
 * bundle del navegador. Sin la variable configurada, el descuento queda apagado.
 */
function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function isPlayerDiscountCode(input: string | null | undefined): boolean {
  const expected = process.env.PLAYER_DISCOUNT_CODE;
  if (!expected || !expected.trim() || !input) return false;
  return normalize(input) === normalize(expected);
}

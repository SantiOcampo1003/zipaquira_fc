/** Patrocinio Betsson: constantes compartidas entre cliente y servidor. */

/** Link de registro propio del club en Betsson. */
export const BETSSON_REGISTER_URL = "https://record.betsson.co/_Dfvqe55YotUDI4jr8mU_9mNd7ZgqdRLk/1/";

/**
 * Partidos (ticket_label, sin importar mayúsculas) donde la entrada se gestiona con el
 * registro de Betsson: el pago por Wompi queda apagado para el público en estos partidos.
 */
const BETSSON_MATCH_LABELS = ["zipa fc vs guajira fc"];

export function isBetssonMatch(ticketLabel: string | null | undefined): boolean {
  if (!ticketLabel) return false;
  return BETSSON_MATCH_LABELS.includes(ticketLabel.trim().toLowerCase());
}

/**
 * Por compra: hasta 5 personas registradas en Betsson (cada una con su pantallazo) y, por cada
 * una, UN menor opcional que la acompaña → máximo 10 sillas (tope de una reserva).
 */
export const BETSSON_MAX_REGISTRATIONS = 5;
export const BETSSON_MAX_SEATS = BETSSON_MAX_REGISTRATIONS * 2;

export const BETSSON_BUCKET = "betsson-capturas";
export const BETSSON_MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 3);
}

/** true si comparten al menos una palabra del nombre (tolera apodos / segundos nombres). */
export function namesOverlap(a: string, b: string): boolean {
  const tb = new Set(nameTokens(b));
  return nameTokens(a).some((t) => tb.has(t));
}

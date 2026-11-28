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

/** Una silla para la persona registrada + una opcional para un menor que la acompaña. */
export const BETSSON_MAX_SEATS = 2;

export const BETSSON_BUCKET = "betsson-capturas";
export const BETSSON_MAX_IMAGE_BYTES = 4 * 1024 * 1024;

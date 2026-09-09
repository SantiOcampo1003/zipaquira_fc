/**
 * Silletería Tribuna Occidental — Estadio Héctor "El Zipa" González
 * 568 sillas numeradas · 4 filas · 3 zonas (Verde, Blanca, Roja)
 *
 * Flujo: el abono se compra por zona en la plataforma externa;
 * luego el hincha elige silla numerada y talla de camiseta en esta web.
 */

export type StadiumZoneId = "verde" | "blanca" | "roja";

export type SeatStatus = "available" | "occupied" | "courtesy" | "selected";

/** Sillas reservadas para cortesías (no seleccionables por abonados). */
export const COURTESY_SEAT_RANGES: { from: number; to: number; label: string }[] = [
  {
    from: 479,
    to: 504,
    label: "Cortesías zona blanca · Fila 4",
  },
];

export function isCourtesySeatNumber(seatNumber: number): boolean {
  return COURTESY_SEAT_RANGES.some((r) => seatNumber >= r.from && seatNumber <= r.to);
}

export function isSeatSelectable(seat: Pick<Seat, "status">): boolean {
  return seat.status === "available";
}

export type JerseySize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export const JERSEY_SIZES: JerseySize[] = ["XS", "S", "M", "L", "XL", "XXL"];

export type Seat = {
  /** Número oficial con padding: "001" … "568" */
  id: string;
  zoneId: StadiumZoneId;
  zoneName: string;
  /** Fila 1–4 (1 = más cercana a la cancha) */
  row: number;
  /** Número oficial de silla 1–568 */
  seatNumber: number;
  status: SeatStatus;
  price: number;
};

export type ZoneConfig = {
  id: StadiumZoneId;
  name: string;
  shortName: string;
  badgeColor: string;
  accentBg: string;
  accentBorder: string;
  seatColor: string;
  seatTextColor: string;
  totalSeats: number;
  seatsPerRow: number;
  price: number;
  description: string;
  viewAngle: string;
};

export const STADIUM_ZONES: Record<StadiumZoneId, ZoneConfig> = {
  verde: {
    id: "verde",
    name: "Zona Verde (Sector Norte)",
    shortName: "Zona Verde",
    badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    accentBg: "bg-emerald-950/50",
    accentBorder: "border-emerald-500/50",
    seatColor: "#10B981",
    seatTextColor: "#052e16",
    totalSeats: 208,
    seatsPerRow: 52,
    price: 25000,
    description: "Sector norte de la tribuna occidental.",
    viewAngle: "Vista lateral norte hacia el arco local.",
  },
  blanca: {
    id: "blanca",
    name: "Zona Blanca (Sector Central)",
    shortName: "Zona Blanca",
    badgeColor: "text-amber-200 border-amber-300/30 bg-amber-400/10",
    accentBg: "bg-amber-950/40",
    accentBorder: "border-amber-400/50",
    seatColor: "#F4EFE5",
    seatTextColor: "#1a1a1a",
    totalSeats: 192,
    seatsPerRow: 48,
    price: 35000,
    description: "Sector central frente a la línea media.",
    viewAngle: "Vista frontal del campo.",
  },
  roja: {
    id: "roja",
    name: "Zona Roja (Sector Sur)",
    shortName: "Zona Roja",
    badgeColor: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    accentBg: "bg-rose-950/50",
    accentBorder: "border-rose-500/50",
    seatColor: "#EF4444",
    seatTextColor: "#450a0a",
    totalSeats: 168,
    seatsPerRow: 42,
    price: 25000,
    description: "Sector sur de la tribuna occidental.",
    viewAngle: "Vista lateral sur hacia el arco sur.",
  },
};

export const TOTAL_STADIUM_SEATS = 568;

/** Organización oficial: cada fila cruza las 3 zonas de izquierda a derecha */
export const GRANDSTAND_ROWS: {
  row: number;
  verde: [number, number];
  blanca: [number, number];
  roja: [number, number];
}[] = [
  { row: 1, verde: [1, 52], blanca: [53, 100], roja: [101, 142] },
  { row: 2, verde: [143, 194], blanca: [195, 242], roja: [243, 284] },
  { row: 3, verde: [285, 336], blanca: [337, 384], roja: [385, 426] },
  { row: 4, verde: [427, 478], blanca: [479, 526], roja: [527, 568] },
];

/** Fila 4 arriba (techo), fila 1 abajo (cerca de la cancha) */
export const ROWS_DISPLAY_ORDER = [4, 3, 2, 1] as const;

function zoneForSeatNumber(n: number): StadiumZoneId {
  for (const spec of GRANDSTAND_ROWS) {
    if (n >= spec.verde[0] && n <= spec.verde[1]) return "verde";
    if (n >= spec.blanca[0] && n <= spec.blanca[1]) return "blanca";
    if (n >= spec.roja[0] && n <= spec.roja[1]) return "roja";
  }
  throw new Error(`Número de silla inválido: ${n}`);
}

function rowForSeatNumber(n: number): number {
  for (const spec of GRANDSTAND_ROWS) {
    if (
      (n >= spec.verde[0] && n <= spec.verde[1]) ||
      (n >= spec.blanca[0] && n <= spec.blanca[1]) ||
      (n >= spec.roja[0] && n <= spec.roja[1])
    ) {
      return spec.row;
    }
  }
  throw new Error(`Número de silla inválido: ${n}`);
}

export function formatSeatId(seatNumber: number): string {
  return String(seatNumber).padStart(3, "0");
}

export function formatSeatLabel(seat: Pick<Seat, "id" | "row" | "zoneName">): string {
  return `Silla #${seat.id} · Fila ${seat.row} · ${seat.zoneName}`;
}

export function generateInitialStadiumSeats(): Seat[] {
  const seats: Seat[] = [];

  for (let n = 1; n <= TOTAL_STADIUM_SEATS; n++) {
    const zoneId = zoneForSeatNumber(n);
    const zone = STADIUM_ZONES[zoneId];
    seats.push({
      id: formatSeatId(n),
      zoneId,
      zoneName: zone.shortName,
      row: rowForSeatNumber(n),
      seatNumber: n,
      status: isCourtesySeatNumber(n) ? "courtesy" : "available",
      price: zone.price,
    });
  }

  return seats;
}

/** Valida que la numeración oficial coincida con GRANDSTAND_ROWS (desarrollo). */
export function assertGrandstandNumbering(): void {
  for (const spec of GRANDSTAND_ROWS) {
    const rowSeats = [
      ...range(spec.verde[0], spec.verde[1]),
      ...range(spec.blanca[0], spec.blanca[1]),
      ...range(spec.roja[0], spec.roja[1]),
    ];
    if (rowSeats.length !== 142) {
      throw new Error(`Fila ${spec.row}: se esperaban 142 sillas, hay ${rowSeats.length}`);
    }
  }
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Máximo de abonos por compra con un mismo correo (Tu Boleta). */
export const MAX_ABONOS_PER_EMAIL = 10;

export function clampAbonoCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(MAX_ABONOS_PER_EMAIL, Math.max(1, Math.round(count)));
}

export function parseAbonoCountParam(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 1;
  const parsed = Number.parseInt(raw, 10);
  return clampAbonoCount(Number.isFinite(parsed) ? parsed : 1);
}

export type AbonoHolderDraft = {
  fullName: string;
  documentId: string;
  jerseySize: JerseySize | "";
};

export type AbonoAssignment = {
  abonoIndex: number;
  seat: Seat;
  holder: AbonoHolderDraft;
};

export function createEmptyHolderDrafts(count: number): AbonoHolderDraft[] {
  return Array.from({ length: count }, () => ({
    fullName: "",
    documentId: "",
    jerseySize: "",
  }));
}

export function isHolderDraftComplete(holder: AbonoHolderDraft | null | undefined): boolean {
  if (!holder) return false;
  return Boolean(holder.fullName.trim() && holder.documentId.trim() && holder.jerseySize);
}

/** Pasos del flujo de elección (una compra puede incluir varios abonos). */
export type StadiumBookingStep = "seats" | "details" | "confirmed";

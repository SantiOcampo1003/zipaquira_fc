import type { JerseySize, Seat, SeatStatus, StadiumZoneId } from "@/lib/stadium-seating";
import { formatSeatId, STADIUM_ZONES } from "@/lib/stadium-seating";

export type DbSeatStatus = "available" | "reserved" | "courtesy" | "blocked";

export type DbStadiumSeatRow = {
  seat_number: number;
  zone_id: StadiumZoneId;
  row_number: number;
  status: DbSeatStatus;
};

export type DbAbonoPurchaseRow = {
  id: string;
  purchaser_email: string;
  abono_count: number;
  zone_id: StadiumZoneId;
  status: "pending_seats" | "completed" | "expired" | "cancelled";
  expires_at: string | null;
  completed_at: string | null;
};

export type DbAbonoRegistrationRow = {
  abono_index: number;
  seat_number: number;
  holder_full_name: string | null;
  holder_document_id: string | null;
  jersey_size: JerseySize | null;
};

export type AbonoSessionPurchase = {
  purchaserEmail: string;
  abonoCount: number;
  zoneId: StadiumZoneId;
  status: DbAbonoPurchaseRow["status"];
  expiresAt: string | null;
};

export type AbonoSessionRegistration = {
  abonoIndex: number;
  seatNumber: number;
  seatId: string;
  holderFullName: string;
  holderDocumentId: string;
  jerseySize: JerseySize;
};

function mapDbStatusToSeatStatus(status: DbSeatStatus): SeatStatus {
  if (status === "available") return "available";
  if (status === "courtesy") return "courtesy";
  return "occupied";
}

export function mapDbSeatToSeat(row: DbStadiumSeatRow): Seat {
  const zone = STADIUM_ZONES[row.zone_id];
  return {
    id: formatSeatId(row.seat_number),
    zoneId: row.zone_id,
    zoneName: zone.shortName,
    row: row.row_number,
    seatNumber: row.seat_number,
    status: mapDbStatusToSeatStatus(row.status),
    price: zone.price,
  };
}

export function mapRpcErrorToMessage(message: string): string {
  if (message.includes("TOKEN_INVALID")) {
    return "Este enlace no es válido. Revisa el correo de Tu Boleta.";
  }
  if (message.includes("TOKEN_EXPIRED")) {
    return "Este enlace expiró. Contacta al club para un nuevo acceso.";
  }
  if (message.includes("PURCHASE_NOT_PENDING")) {
    return "Esta compra ya fue confirmada o no está disponible.";
  }
  if (message.includes("EMAIL_MISMATCH")) {
    return "El correo no coincide con el de tu compra.";
  }
  if (message.includes("ABONO_COUNT_MISMATCH")) {
    return "La cantidad de abonos no coincide con tu compra.";
  }
  if (message.includes("ZONE_MISMATCH")) {
    return "Una silla no pertenece a la zona de tu abono.";
  }
  if (message.includes("SEAT_NOT_AVAILABLE")) {
    return "Una de las sillas ya fue tomada. Elige otras en el mapa.";
  }
  if (message.includes("SEAT_NOT_FOUND")) {
    return "Número de silla inválido.";
  }
  return "No pudimos confirmar tu abono. Intenta de nuevo.";
}

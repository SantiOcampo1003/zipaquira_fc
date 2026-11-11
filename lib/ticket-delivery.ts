import { getSupabaseAdmin } from "@/lib/supabase-server";
import { renderTicketsPdfBuffer, type TicketData } from "@/lib/ticket-pdf";
import { sendTicketEmail } from "@/lib/email";
import type { StadiumZoneId } from "@/lib/stadium-seating";

function formatMatchDateTime(matchDate: string, kickoffTime: string | null): string {
  const dayLabel = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bogota",
  }).format(new Date(`${matchDate}T12:00:00`));

  const capitalized = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

  if (!kickoffTime) return capitalized;

  const [hourStr, minuteStr] = kickoffTime.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? "p.m." : "a.m.";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const timeLabel = minute === 0 ? `${hour12}:00 ${period}` : `${hour12}:${String(minute).padStart(2, "0")} ${period}`;

  return `${capitalized} — ${timeLabel}`;
}

async function loadTicketsForPurchase(purchaseId: string): Promise<{
  tickets: TicketData[];
  purchaserEmail: string;
  opponent: string;
  isCompleted: boolean;
}> {
  const supabase = getSupabaseAdmin();

  const { data: purchase, error: purchaseError } = await supabase
    .from("abono_purchases")
    .select(
      "id, purchaser_email, zone_id, status, matches(opponent, competition, venue, match_date, kickoff_time)"
    )
    .eq("id", purchaseId)
    .maybeSingle();

  if (purchaseError || !purchase) {
    throw new Error(`No se pudo cargar la compra ${purchaseId}: ${purchaseError?.message ?? "no encontrada"}`);
  }

  const { data: registrations, error: regError } = await supabase
    .from("abono_registrations")
    .select("seat_number, holder_full_name, holder_document_id, ticket_code")
    .eq("purchase_id", purchaseId)
    .order("abono_index", { ascending: true });

  if (regError || !registrations?.length) {
    throw new Error(`No se pudieron cargar las sillas de la compra ${purchaseId}: ${regError?.message ?? "sin registros"}`);
  }

  const match = purchase.matches as unknown as {
    opponent: string;
    competition: string;
    venue: string;
    match_date: string;
    kickoff_time: string | null;
  };

  const matchDateTimeLabel = formatMatchDateTime(match.match_date, match.kickoff_time);

  const isGeneral = purchase.zone_id === "general";
  const tickets: TicketData[] = registrations.map((reg) => ({
    opponent: match.opponent,
    competition: match.competition,
    venue: match.venue,
    matchDateLabel: matchDateTimeLabel,
    holderFullName: reg.holder_full_name ?? "",
    holderDocumentId: reg.holder_document_id ?? "",
    zoneId: isGeneral ? null : (purchase.zone_id as StadiumZoneId),
    seatNumber: isGeneral ? null : reg.seat_number,
    ticketCode: reg.ticket_code ?? "",
  }));

  return {
    tickets,
    purchaserEmail: purchase.purchaser_email,
    opponent: match.opponent,
    isCompleted: purchase.status === "completed",
  };
}

/** Genera el PDF de una compra pagada (para descarga directa, ej. /boletas/resultado). */
export async function getTicketsPdfBuffer(purchaseId: string): Promise<Buffer> {
  const { tickets, isCompleted } = await loadTicketsForPurchase(purchaseId);
  if (!isCompleted) {
    throw new Error("PURCHASE_NOT_COMPLETED");
  }
  return renderTicketsPdfBuffer(tickets);
}

/** Genera el PDF de todas las sillas de una compra pagada y lo envía por correo. */
export async function sendTicketEmailForPurchase(purchaseId: string): Promise<void> {
  const { tickets, purchaserEmail, opponent } = await loadTicketsForPurchase(purchaseId);
  const pdfBuffer = await renderTicketsPdfBuffer(tickets);

  const isGeneral = tickets.every((t) => !t.zoneId || !t.seatNumber);
  const ticketDetailLine = isGeneral
    ? `<p>Entradas: <strong>General × ${tickets.length}</strong></p>`
    : `<p>Silla(s): <strong>${tickets.map((t) => `#${t.seatNumber}`).join(", ")}</strong></p>`;
  const html = `
    <div style="font-family: sans-serif; color: #0B2810;">
      <h2>¡Gracias por tu compra, Zipa FC!</h2>
      <p>Tu boleta para <strong>Zipaquirá F.C. vs ${opponent}</strong> está lista.</p>
      ${ticketDetailLine}
      <p>Adjuntamos tu boleta en PDF con el código QR — preséntala en la entrada del estadio.</p>
      <p>¡Nos vemos en las graderías! 🟢⚪🔴</p>
    </div>
  `;

  await sendTicketEmail({
    to: purchaserEmail,
    subject: `Tu boleta — Zipaquirá F.C. vs ${opponent}`,
    html,
    pdfBuffer,
    pdfFilename: `boleta-zipa-fc-vs-${opponent.toLowerCase().replace(/\s+/g, "-")}.pdf`,
  });
}

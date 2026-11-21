import { getSupabaseAdmin } from "@/lib/supabase-server";
import { renderTicketsPdfBuffer, type TicketData } from "@/lib/ticket-pdf";
import { sendTicketEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { STADIUM_ZONES, type StadiumZoneId } from "@/lib/stadium-seating";

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


function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Boleta de ABONADO para un partido: usa la silla fija del abono (sin pasar por
 * compra de boleta). Si la silla aún no tiene código QR, se genera aquí.
 * `to` permite mandarla a un correo distinto al de la compra.
 */
export async function sendAbonoTicketsEmail(params: {
  registrationIds: string[];
  to: string;
  matchId: string;
  greetingName: string;
}): Promise<{ seats: number[]; ticketCodes: string[] }> {
  const supabase = getSupabaseAdmin();

  const { data: regs, error } = await supabase
    .from("abono_registrations")
    .select("id, seat_number, holder_full_name, holder_document_id, ticket_code, abono_purchases!inner(zone_id, status, purchase_type)")
    .in("id", params.registrationIds)
    .order("seat_number", { ascending: true });
  if (error || !regs?.length) throw new Error(`No se pudieron cargar los abonos: ${error?.message ?? "sin registros"}`);

  for (const r of regs) {
    const p = r.abono_purchases as unknown as { status: string; purchase_type: string };
    if (p.status !== "completed" || p.purchase_type !== "abono") throw new Error(`Registro ${r.id} no es un abono completado.`);
    if (!r.ticket_code) {
      const code = randomBytes(6).toString("hex").toUpperCase();
      const { error: upErr } = await supabase
        .from("abono_registrations")
        .update({ ticket_code: code })
        .eq("id", r.id)
        .is("ticket_code", null);
      if (upErr) throw new Error(`No se pudo generar el QR de la silla ${r.seat_number}: ${upErr.message}`);
      r.ticket_code = code;
    }
  }
  // Releer por si otro proceso asignó el código primero.
  const { data: fresh } = await supabase.from("abono_registrations").select("id, ticket_code").in("id", params.registrationIds);
  const codeById = new Map((fresh ?? []).map((f) => [f.id, f.ticket_code as string]));

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("opponent, competition, venue, match_date, kickoff_time")
    .eq("id", params.matchId)
    .single();
  if (matchErr || !match) throw new Error(`Partido no encontrado: ${matchErr?.message ?? params.matchId}`);

  const dateLabel = formatMatchDateTime(match.match_date, match.kickoff_time);
  const tickets: TicketData[] = regs.map((r) => {
    const p = r.abono_purchases as unknown as { zone_id: StadiumZoneId };
    return {
      opponent: match.opponent,
      competition: match.competition,
      venue: match.venue,
      matchDateLabel: dateLabel,
      holderFullName: r.holder_full_name ?? "",
      holderDocumentId: r.holder_document_id || "—",
      zoneId: p.zone_id,
      seatNumber: r.seat_number,
      ticketCode: codeById.get(r.id) ?? r.ticket_code ?? "",
    };
  });

  const pdfBuffer = await renderTicketsPdfBuffer(tickets);

  const site = (process.env.SITE_URL?.replace(/\/$/, "") || "https://app.zipaquirafc.com");
  const seatRows = tickets
    .map(
      (t) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E9DFCB;color:#0B2810;font-size:14px;">${escapeHtml(t.holderFullName)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E9DFCB;color:#0B2810;font-size:14px;">${t.zoneId ? STADIUM_ZONES[t.zoneId].shortName : ""}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E9DFCB;color:#7D1613;font-size:14px;font-weight:700;">#${t.seatNumber}</td>
      </tr>`
    )
    .join("");
  const plural = tickets.length > 1;
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4EFE5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE5;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
    <tr>
      <td style="background:#0F3320;padding:28px 24px;text-align:center;">
        <img src="${site}/images/ticket/escudo-zipa-fc.png" alt="Zipaquirá F.C." width="84" style="display:block;margin:0 auto 12px;height:auto;">
        <div style="color:#C0A06A;font-size:12px;letter-spacing:3px;">HERENCIA MUISCA</div>
        <div style="color:#FFFFFF;font-size:24px;font-weight:700;margin-top:6px;">Gracias por ser abonado</div>
      </td>
    </tr>
    <tr><td style="height:5px;background:linear-gradient(90deg,#7D1613 50%,#0B2810 50%);font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr>
      <td style="padding:28px 28px 8px;color:#0B2810;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 14px;font-size:17px;"><strong>Hola, ${escapeHtml(params.greetingName)}</strong></p>
        <p style="margin:0 0 14px;">Tu abono es parte de lo que hace grande a este equipo. Gracias por creer en Zipaquirá F.C. y por llenar de color las graderías del Héctor “El Zipa” González. Sin tu apoyo, nada de esto sería posible.</p>
        <p style="margin:0 0 6px;">Aquí está tu ${plural ? "boleta de abonado por cada silla" : "boleta de abonado"} para el próximo partido:</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE5;border-radius:10px;">
          <tr><td style="padding:16px 18px;">
            <div style="color:#7D1613;font-size:11px;letter-spacing:2px;font-weight:700;">${escapeHtml(match.competition.toUpperCase())}</div>
            <div style="color:#0B2810;font-size:20px;font-weight:700;margin-top:4px;">Zipaquirá F.C. vs ${escapeHtml(match.opponent)}</div>
            <div style="color:#0B2810;font-size:14px;margin-top:6px;">${escapeHtml(dateLabel)}</div>
            <div style="color:#0B2810;font-size:14px;">${escapeHtml(match.venue)}</div>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 28px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E9DFCB;border-radius:10px;border-collapse:separate;">
          <tr style="background:#0F3320;">
            <td style="padding:9px 12px;color:#C0A06A;font-size:11px;letter-spacing:1px;">TITULAR</td>
            <td style="padding:9px 12px;color:#C0A06A;font-size:11px;letter-spacing:1px;">ZONA</td>
            <td style="padding:9px 12px;color:#C0A06A;font-size:11px;letter-spacing:1px;">SILLA</td>
          </tr>
          ${seatRows}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 28px 6px;color:#0B2810;font-size:14px;line-height:1.6;">
        <p style="margin:0 0 8px;"><strong>Cómo entrar</strong></p>
        <p style="margin:0 0 4px;">• Abre el PDF adjunto y presenta el <strong>código QR</strong> en la entrada, desde tu celular o impreso.</p>
        <p style="margin:0 0 4px;">• Cada boleta sirve para <strong>una sola persona y un solo ingreso</strong>.</p>
        <p style="margin:0;">• Llega con tiempo para entrar sin afanes.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 28px;text-align:center;">
        <div style="color:#7D1613;font-size:17px;font-weight:700;">¡Nos vemos en las graderías!</div>
        <div style="color:#0B2810;font-size:13px;margin-top:4px;">Zipaquirá Fútbol Club · Herencia Muisca</div>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body></html>`;

  await sendTicketEmail({
    to: params.to,
    subject: `Tu boleta de abonado — Zipaquirá F.C. vs ${match.opponent}`,
    html,
    pdfBuffer,
    pdfFilename: `boleta-abonado-zipa-fc-vs-${match.opponent.toLowerCase().replace(/\s+/g, "-")}.pdf`,
  });

  return { seats: tickets.map((t) => t.seatNumber as number), ticketCodes: tickets.map((t) => t.ticketCode) };
}

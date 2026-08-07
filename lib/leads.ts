export type TicketInterestPayload = {
  fullName: string;
  documentId: string;
  phone: string;
  email: string;
  city?: string;
};

export type LeadPayload = {
  fullName: string;
  whatsapp: string;
  email: string;
  neighborhood?: string;
  interestType: string;
  message?: string;
};

/** Envía el interés de boleta a la API → Supabase. */
export async function handleSubmitTicketInterest(data: TicketInterestPayload): Promise<void> {
  const res = await fetch("/api/boletas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "No se pudo guardar el registro.");
  }
}

/** Lead legado (comunidad). Mock. */
export async function handleSubmitLead(data: LeadPayload): Promise<void> {
  await new Promise((r) => setTimeout(r, 650));
  // eslint-disable-next-line no-console
  console.log("[Lead] recibido:", data);
}

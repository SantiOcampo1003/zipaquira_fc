import { clubName } from "@/lib/brand";

export type LeadPayload = {
  fullName: string;
  whatsapp: string;
  email: string;
  neighborhood?: string;
  interestType: string;
  message?: string;
};

/**
 * Punto único para enviar leads. Hoy hace mock + console.
 *
 * TODO: Integrar backend — por ejemplo Supabase:
 *   createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *   await supabase.from("leads").insert({ ...data })
 */
export async function handleSubmitLead(data: LeadPayload): Promise<void> {
  await new Promise((r) => setTimeout(r, 650));
  // eslint-disable-next-line no-console
  console.log(`[${clubName}] Lead recibido:`, data);
}

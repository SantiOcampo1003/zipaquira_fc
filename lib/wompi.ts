import { createHash } from "crypto";

const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Firma de integridad que exige Wompi en el formulario de Web Checkout. */
export function buildIntegritySignature(params: {
  reference: string;
  amountInCents: number;
  currency: string;
}): string {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) {
    throw new Error("WOMPI_INTEGRITY_SECRET no está configurado.");
  }
  const raw = `${params.reference}${params.amountInCents}${params.currency}${secret}`;
  return sha256Hex(raw);
}

export function buildCheckoutRedirectUrl(params: {
  reference: string;
  amountInCents: number;
  currency?: string;
  redirectUrl: string;
  customerEmail: string;
  customerFullName: string;
  customerPhone?: string;
}): string {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("WOMPI_PUBLIC_KEY no está configurado.");
  }
  const currency = params.currency ?? "COP";
  const signature = buildIntegritySignature({
    reference: params.reference,
    amountInCents: params.amountInCents,
    currency,
  });

  const query = new URLSearchParams({
    "public-key": publicKey,
    currency,
    "amount-in-cents": String(params.amountInCents),
    reference: params.reference,
    "signature:integrity": signature,
    "redirect-url": params.redirectUrl,
    "customer-data:email": params.customerEmail,
    "customer-data:full-name": params.customerFullName,
  });
  if (params.customerPhone) {
    query.set("customer-data:phone-number", params.customerPhone);
  }

  return `${WOMPI_CHECKOUT_URL}?${query.toString()}`;
}

type WompiEventPayload = {
  event: string;
  data: {
    transaction: {
      id: string;
      status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";
      reference: string;
      amount_in_cents: number;
    };
  };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
};

function getByPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

/** Verifica el checksum del webhook de eventos de Wompi (SHA-256). */
export function verifyWompiEventChecksum(payload: WompiEventPayload): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) {
    throw new Error("WOMPI_EVENTS_SECRET no está configurado.");
  }
  const values = payload.signature.properties
    .map((prop) => getByPath(payload.data, prop))
    .join("");
  const raw = `${values}${payload.timestamp}${secret}`;
  return sha256Hex(raw) === payload.signature.checksum;
}

export type { WompiEventPayload };

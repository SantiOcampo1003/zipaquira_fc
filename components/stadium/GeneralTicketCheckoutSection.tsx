"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  IdCard,
  Loader2,
  Mail,
  Minus,
  Phone,
  Plus,
  Ticket,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GENERAL_TICKET_PRICE_COP, formatCop } from "@/lib/stadium-seating";
import { cn } from "@/lib/utils";

type HolderDraft = { fullName: string; documentId: string; phone: string };
const EMPTY_HOLDER: HolderDraft = { fullName: "", documentId: "", phone: "" };
const MAX_TICKETS = 10;

const fieldClassName =
  "h-11 w-full rounded-lg border border-white/15 bg-black/50 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors";

function FieldIcon({ Icon }: { Icon: typeof Mail }) {
  return (
    <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
  );
}

function StepDots({ step }: { step: "quantity" | "details" }) {
  const steps: { id: "quantity" | "details"; label: string }[] = [
    { id: "quantity", label: "Cantidad" },
    { id: "details", label: "Datos" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);

  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : active
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/15 bg-black/40 text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </div>
            <span className={cn("text-[11px] font-medium", active ? "text-white" : "text-muted-foreground")}>
              {s.label}
            </span>
            {index < steps.length - 1 ? <div className="mx-1 h-px w-5 bg-white/15" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function GeneralTicketCheckoutSection({
  matchLabel,
  userEmail = "",
}: {
  matchLabel: string;
  /** Correo de la cuenta de Google ya autenticada — si viene, el campo queda bloqueado. */
  userEmail?: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [holderDrafts, setHolderDrafts] = useState<HolderDraft[]>([{ ...EMPTY_HOLDER }]);
  const [step, setStep] = useState<"quantity" | "details">("quantity");
  const [purchaserEmail, setPurchaserEmail] = useState(userEmail);
  const [purchaserPhone, setPurchaserPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const totalPrice = quantity * GENERAL_TICKET_PRICE_COP;
  const allHoldersComplete = holderDrafts.every(
    (h) => h.fullName.trim().length > 1 && h.documentId.trim().length > 2 && h.phone.trim().length > 6
  );

  function setQuantityClamped(next: number) {
    const clamped = Math.min(MAX_TICKETS, Math.max(1, next));
    setQuantity(clamped);
    setHolderDrafts((prev) => {
      if (clamped > prev.length) {
        return [...prev, ...Array.from({ length: clamped - prev.length }, () => ({ ...EMPTY_HOLDER }))];
      }
      return prev.slice(0, clamped);
    });
  }

  function updateHolder(index: number, patch: Partial<HolderDraft>) {
    setHolderDrafts((prev) => prev.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }

  async function handlePay() {
    if (quantity === 0) return;
    if (!purchaserEmail.trim() || !purchaserPhone.trim() || !allHoldersComplete) return;

    setSubmitting(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/boletas/general-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchLabel,
          holders: holderDrafts.map((h) => ({
            holderFullName: h.fullName,
            holderDocumentId: h.documentId,
            holderPhone: h.phone,
          })),
          purchaserEmail,
          purchaserPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? "No pudimos iniciar el pago.");
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setCheckoutError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="font-heading text-2xl uppercase text-white sm:text-3xl">Comprar boleta General</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Tribuna General, sin silla asignada — escoges tu lugar al llegar al estadio. Paga en línea con
        Wompi y recibirás tu boleta en PDF con código QR por correo.
      </p>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-primary/25 bg-[#18181B]/95 p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Ticket className="size-5 shrink-0 text-primary" />
            <h2 className="font-heading text-lg uppercase tracking-wide text-white">
              {step === "quantity" ? "Cuántas entradas" : "Tus datos"}
            </h2>
          </div>
          <StepDots step={step} />
        </div>

        <AnimatePresence mode="wait">
          {step === "quantity" ? (
            <motion.div
              key="quantity"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <p className="rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-muted-foreground">
                Elige cuántas entradas de tribuna General quieres comprar (hasta {MAX_TICKETS}).
              </p>

              <div className="flex items-center justify-center gap-5 rounded-xl border border-white/10 bg-black/30 p-5">
                <button
                  type="button"
                  onClick={() => setQuantityClamped(quantity - 1)}
                  disabled={quantity <= 1}
                  aria-label="Menos entradas"
                  className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-12 text-center font-heading text-3xl text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantityClamped(quantity + 1)}
                  disabled={quantity >= MAX_TICKETS}
                  aria-label="Más entradas"
                  className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-heading text-lg text-primary">{formatCop(totalPrice)}</span>
              </div>

              <Button
                type="button"
                onClick={() => setStep("details")}
                className="h-12 bg-primary font-heading uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
              >
                Continuar con los datos
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white">
                  Correo de contacto
                </label>
                <div className="relative">
                  <FieldIcon Icon={Mail} />
                  <input
                    type="email"
                    readOnly={!!userEmail}
                    value={purchaserEmail}
                    onChange={(e) => setPurchaserEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className={cn(fieldClassName, userEmail && "cursor-not-allowed opacity-80")}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {userEmail
                    ? "Correo de tu cuenta de Google — ahí te enviamos el PDF de tu boleta."
                    : "Ahí te enviamos el PDF de tu boleta."}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white">
                  Celular de contacto
                </label>
                <div className="relative">
                  <FieldIcon Icon={Phone} />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={purchaserPhone}
                    onChange={(e) => setPurchaserPhone(e.target.value)}
                    placeholder="300 000 0000"
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {holderDrafts.map((holder, index) => (
                  <div key={index} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-white">
                          Titular {index + 1}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">General</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="relative">
                        <FieldIcon Icon={User} />
                        <input
                          type="text"
                          placeholder="Nombre completo"
                          value={holder.fullName}
                          onChange={(e) => updateHolder(index, { fullName: e.target.value })}
                          className={fieldClassName}
                        />
                      </div>
                      <div className="relative">
                        <FieldIcon Icon={IdCard} />
                        <input
                          type="text"
                          placeholder="Cédula"
                          value={holder.documentId}
                          onChange={(e) => updateHolder(index, { documentId: e.target.value })}
                          className={fieldClassName}
                        />
                      </div>
                      <div className="relative sm:col-span-2">
                        <FieldIcon Icon={Phone} />
                        <input
                          type="tel"
                          inputMode="tel"
                          placeholder="Celular"
                          value={holder.phone}
                          onChange={(e) => updateHolder(index, { phone: e.target.value })}
                          className={fieldClassName}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                <span className="text-muted-foreground">Total a pagar</span>
                <span className="font-heading text-lg text-primary">{formatCop(totalPrice)}</span>
              </div>

              {checkoutError ? (
                <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {checkoutError}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("quantity")}
                  disabled={submitting}
                  className="sm:w-auto"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  disabled={!purchaserEmail.trim() || !purchaserPhone.trim() || !allHoldersComplete || submitting}
                  onClick={handlePay}
                  className="h-12 flex-1 bg-primary font-heading uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Conectando con Wompi…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 size-4" /> Pagar con Wompi
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

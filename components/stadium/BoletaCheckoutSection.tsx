"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  IdCard,
  Loader2,
  Mail,
  Phone,
  Ticket,
  User,
  X,
} from "lucide-react";
import { StadiumGrandstandMap } from "@/components/stadium/StadiumGrandstandMap";
import { Button } from "@/components/ui/button";
import {
  CATEDRAL_TICKET_PRICE_COP,
  formatCop,
  formatSeatLabel,
  generateInitialStadiumSeats,
  type Seat,
  type StadiumZoneId,
} from "@/lib/stadium-seating";
import { cn } from "@/lib/utils";

type HolderDraft = { fullName: string; documentId: string; phone: string };
const EMPTY_HOLDER: HolderDraft = { fullName: "", documentId: "", phone: "" };
const MAX_SEATS = 10;

const fieldClassName =
  "h-11 w-full rounded-lg border border-white/15 bg-black/50 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors";

function FieldIcon({ Icon }: { Icon: typeof Mail }) {
  return (
    <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
  );
}

function StepDots({ step }: { step: "seats" | "details" }) {
  const steps: { id: "seats" | "details"; label: string }[] = [
    { id: "seats", label: "Sillas" },
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

export function BoletaCheckoutSection({
  matchLabel,
  userEmail = "",
}: {
  matchLabel: string;
  /** Correo de la cuenta de Google ya autenticada — si viene, el campo queda bloqueado. */
  userEmail?: string;
}) {
  const [seats, setSeats] = useState<Seat[]>(() => generateInitialStadiumSeats());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<StadiumZoneId | "all">("all");
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [holderDrafts, setHolderDrafts] = useState<HolderDraft[]>([]);
  const [step, setStep] = useState<"seats" | "details">("seats");
  const [purchaserEmail, setPurchaserEmail] = useState(userEmail);
  const [purchaserPhone, setPurchaserPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const allowedZoneId: StadiumZoneId | null = selectedSeats[0]?.zoneId ?? null;
  const totalPrice = selectedSeats.length * CATEDRAL_TICKET_PRICE_COP;
  const allHoldersComplete = holderDrafts.every(
    (h) => h.fullName.trim().length > 1 && h.documentId.trim().length > 2 && h.phone.trim().length > 6
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/abonos/session?preview=1&match=${encodeURIComponent(matchLabel)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "No pudimos cargar el mapa de sillas.");
          return;
        }
        setSeats(data.seats);
      } catch {
        setError("Error de conexión. Recarga la página.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [matchLabel]);

  function toggleSeat(seat: Seat) {
    if (seat.status !== "available") return;
    const alreadySelected = selectedSeats.some((s) => s.id === seat.id);
    if (alreadySelected) {
      removeSeat(selectedSeats.findIndex((s) => s.id === seat.id));
      return;
    }
    if (allowedZoneId && seat.zoneId !== allowedZoneId) return;
    if (selectedSeats.length >= MAX_SEATS) return;
    setSelectedSeats((prev) => [...prev, seat]);
    setHolderDrafts((prev) => [...prev, { ...EMPTY_HOLDER }]);
  }

  function removeSeat(index: number) {
    setSelectedSeats((prev) => prev.filter((_, i) => i !== index));
    setHolderDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHolder(index: number, patch: Partial<HolderDraft>) {
    setHolderDrafts((prev) => prev.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }

  async function handlePay() {
    if (!allowedZoneId || selectedSeats.length === 0) return;
    if (!purchaserEmail.trim() || !purchaserPhone.trim() || !allHoldersComplete) return;

    setSubmitting(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/boletas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchLabel,
          zoneId: allowedZoneId,
          seats: selectedSeats.map((seat, i) => ({
            seatNumber: seat.seatNumber,
            holderFullName: holderDrafts[i].fullName,
            holderDocumentId: holderDrafts[i].documentId,
            holderPhone: holderDrafts[i].phone,
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return <p className="py-20 text-center text-sm text-rose-300">{error}</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="font-heading text-2xl uppercase text-white sm:text-3xl">Comprar boleta</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Elige tu silla en el mapa y paga en línea con Wompi — recibirás tu boleta en PDF con código QR
        por correo.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(380px,100%)] lg:items-start">
        <div className="min-w-0">
          <StadiumGrandstandMap
            seats={seats}
            selectedSeatIds={selectedSeats.map((s) => s.id)}
            onSelectSeat={toggleSeat}
            hoveredSeat={hoveredSeat}
            setHoveredSeat={setHoveredSeat}
            activeZoneId={activeZoneId}
            setActiveZoneId={setActiveZoneId}
            allowedZoneId={allowedZoneId}
            selectionEnabled={true}
            abonoCount={MAX_SEATS}
            itemLabel="Boleta"
          />
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-primary/25 bg-[#18181B]/95 p-5 shadow-card sm:p-6 lg:sticky lg:top-6">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Ticket className="size-5 shrink-0 text-primary" />
              <h2 className="font-heading text-lg uppercase tracking-wide text-white">
                {step === "seats" ? "Tus sillas" : "Tus datos"}
              </h2>
            </div>
            <StepDots step={step} />
          </div>

          <AnimatePresence mode="wait">
            {step === "seats" ? (
              <motion.div
                key="seats"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {selectedSeats.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-muted-foreground">
                    Haz clic en una silla disponible del mapa. Puedes elegir hasta {MAX_SEATS}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedSeats.map((seat, i) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-lg font-bold leading-none text-primary">#{seat.id}</p>
                          <p className="truncate text-xs text-white/80">{formatSeatLabel(seat)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <p className="text-sm text-white">{formatCop(CATEDRAL_TICKET_PRICE_COP)}</p>
                          <button
                            type="button"
                            onClick={() => removeSeat(i)}
                            aria-label="Quitar silla"
                            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedSeats.length > 0 ? (
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-heading text-lg text-primary">{formatCop(totalPrice)}</span>
                  </div>
                ) : null}

                <Button
                  type="button"
                  disabled={selectedSeats.length === 0}
                  onClick={() => setStep("details")}
                  className={cn(
                    "h-12 font-heading uppercase tracking-wider",
                    selectedSeats.length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-white/10 text-muted-foreground"
                  )}
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
                  {selectedSeats.map((seat, index) => (
                    <div key={seat.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-primary" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-white">
                            Titular {index + 1}
                          </span>
                        </div>
                        <span className="font-mono text-sm text-primary">#{seat.id}</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="relative">
                          <FieldIcon Icon={User} />
                          <input
                            type="text"
                            placeholder="Nombre completo"
                            value={holderDrafts[index]?.fullName ?? ""}
                            onChange={(e) => updateHolder(index, { fullName: e.target.value })}
                            className={fieldClassName}
                          />
                        </div>
                        <div className="relative">
                          <FieldIcon Icon={IdCard} />
                          <input
                            type="text"
                            placeholder="Cédula"
                            value={holderDrafts[index]?.documentId ?? ""}
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
                            value={holderDrafts[index]?.phone ?? ""}
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
                    onClick={() => setStep("seats")}
                    disabled={submitting}
                    className="sm:w-auto"
                  >
                    Volver al mapa
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
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Shirt, Ticket, User } from "lucide-react";
import type { AbonoHolderDraft, Seat, StadiumBookingStep } from "@/lib/stadium-seating";
import {
  formatSeatLabel,
  isHolderDraftComplete,
  JERSEY_SIZES,
  STADIUM_ZONES,
} from "@/lib/stadium-seating";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SeatBookingPanelProps = {
  abonoCount: number;
  bookingStep: StadiumBookingStep;
  onBookingStepChange: (step: StadiumBookingStep) => void;
  selectedSeats: Seat[];
  holderDrafts: AbonoHolderDraft[];
  onHolderDraftChange: (index: number, patch: Partial<AbonoHolderDraft>) => void;
  purchaserEmail: string;
  onPurchaserEmailChange: (email: string) => void;
  onClearSeat: (index: number) => void;
  allowedZoneId?: import("@/lib/stadium-seating").StadiumZoneId | null;
  accessToken?: string | null;
  emailLocked?: boolean;
  isSubmitting?: boolean;
  confirmError?: string | null;
  onConfirm?: () => Promise<void>;
  readOnly?: boolean;
};

export function SeatBookingPanel({
  abonoCount,
  bookingStep,
  onBookingStepChange,
  selectedSeats,
  holderDrafts,
  onHolderDraftChange,
  purchaserEmail,
  onPurchaserEmailChange,
  onClearSeat,
  allowedZoneId = null,
  emailLocked = false,
  isSubmitting = false,
  confirmError = null,
  onConfirm,
  readOnly = false,
}: SeatBookingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const seatsComplete = selectedSeats.length === abonoCount;
  const allHoldersComplete = holderDrafts.every(isHolderDraftComplete);
  const zoneLabel = allowedZoneId ? STADIUM_ZONES[allowedZoneId].shortName : null;

  useEffect(() => {
    if (bookingStep === "details" && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [bookingStep]);

  function handleContinueToDetails() {
    if (!seatsComplete) return;
    onBookingStepChange("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!purchaserEmail.trim()) return;
    if (!allHoldersComplete) return;
    if (allowedZoneId && selectedSeats.some((s) => s.zoneId !== allowedZoneId)) return;

    if (onConfirm) {
      await onConfirm();
      return;
    }

    onBookingStepChange("confirmed");
  }

  return (
    <div
      ref={panelRef}
      className="flex h-full flex-col rounded-2xl border border-primary/25 bg-[#18181B]/95 p-5 shadow-2xl sm:p-6"
    >
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Ticket className="size-5 text-primary" />
          <h3 className="font-heading text-lg uppercase tracking-wide text-white">
            {bookingStep === "seats"
              ? abonoCount > 1
                ? "Paso 1 · Elige las sillas"
                : "Paso 1 · Elige tu silla"
              : bookingStep === "details"
              ? "Paso 2 · Datos de cada abonado"
              : "¡Registro completado!"}
          </h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {bookingStep === "seats" ? (
            <>
              Selecciona en el mapa{" "}
              <strong className="text-white">
                {abonoCount === 1 ? "tu silla" : `las ${abonoCount} sillas`}
              </strong>
              . Después completarás nombre, documento y talla de camiseta de cada abonado.
            </>
          ) : bookingStep === "details" ? (
            <>
              Cada abono necesita sus datos. El correo de compra es único; nombre, documento y
              camiseta van por persona.
            </>
          ) : (
            "Guardamos tu elección. Te enviaremos confirmación al correo de compra."
          )}
          {zoneLabel ? (
            <span className="mt-1 block text-primary">Zona de tu abono: {zoneLabel}</span>
          ) : null}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {bookingStep === "confirmed" ? (
          <ConfirmedView
            selectedSeats={selectedSeats}
            holderDrafts={holderDrafts}
            purchaserEmail={purchaserEmail}
            onEdit={readOnly ? undefined : () => onBookingStepChange("details")}
          />
        ) : bookingStep === "details" ? (
          <DetailsForm
            key="details"
            abonoCount={abonoCount}
            selectedSeats={selectedSeats}
            holderDrafts={holderDrafts}
            onHolderDraftChange={onHolderDraftChange}
            purchaserEmail={purchaserEmail}
            onPurchaserEmailChange={onPurchaserEmailChange}
            allHoldersComplete={allHoldersComplete}
            onBack={() => onBookingStepChange("seats")}
            onSubmit={handleSubmit}
            emailLocked={emailLocked}
            isSubmitting={isSubmitting}
            confirmError={confirmError}
            readOnly={readOnly}
          />
        ) : (
          <SeatsStep
            key="seats"
            abonoCount={abonoCount}
            selectedSeats={selectedSeats}
            seatsComplete={seatsComplete}
            onClearSeat={onClearSeat}
            readOnly={readOnly}
            onContinue={handleContinueToDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SeatsStep({
  abonoCount,
  selectedSeats,
  seatsComplete,
  onClearSeat,
  onContinue,
  readOnly,
}: {
  abonoCount: number;
  selectedSeats: Seat[];
  seatsComplete: boolean;
  onClearSeat: (index: number) => void;
  onContinue: () => void;
  readOnly?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col gap-4 pt-4"
    >
      <div className={cn("space-y-2", abonoCount > 4 && "max-h-72 overflow-y-auto pr-1")}>
        {Array.from({ length: abonoCount }, (_, index) => {
          const seat = selectedSeats[index] ?? null;
          const isNext = !seat && index === selectedSeats.length;
          return (
            <div
              key={index}
              className={cn(
                "rounded-xl border p-3 transition-all sm:p-4",
                seat
                  ? "border-primary/40 bg-primary/10"
                  : isNext
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                  : "border-dashed border-white/15 bg-black/20"
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Abono {index + 1}
                {isNext ? (
                  <span className="ml-2 text-primary">· Elige ahora en el mapa</span>
                ) : null}
              </p>
              {seat ? (
                <div className="mt-1 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-2xl font-bold text-primary">#{seat.id}</p>
                    <p className="text-sm text-white">{formatSeatLabel(seat)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onClearSeat(index)}
                    disabled={readOnly}
                    className="shrink-0 text-xs text-muted-foreground underline hover:text-white disabled:hidden"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {isNext
                    ? "Haz clic en una silla disponible del mapa"
                    : "Pendiente — completa los abonos anteriores primero"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "rounded-xl border p-4 text-center transition-all",
          seatsComplete
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-white/10 bg-white/[0.02]"
        )}
      >
        {seatsComplete ? (
          <p className="text-sm text-emerald-200">
            <CheckCircle2 className="mr-1 inline size-4" />
            Todas las sillas elegidas. Siguiente paso: datos de cada abonado.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Faltan{" "}
            <strong className="text-white">{abonoCount - selectedSeats.length}</strong> silla
            {abonoCount - selectedSeats.length === 1 ? "" : "s"} por elegir en el mapa.
          </p>
        )}
      </div>

      <Button
        type="button"
        disabled={!seatsComplete || readOnly}
        onClick={onContinue}
        className={cn(
          "h-12 w-full font-heading uppercase tracking-wider",
          seatsComplete
            ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(169,146,89,0.35)] hover:bg-primary/90"
            : "bg-white/10 text-muted-foreground"
        )}
      >
        Continuar con los datos
        <ArrowRight className="ml-2 size-4" />
      </Button>

      {!seatsComplete ? (
        <p className="text-center text-[11px] text-muted-foreground">
          Este botón se activa cuando elijas {abonoCount === 1 ? "tu silla" : "todas las sillas"}.
        </p>
      ) : null}
    </motion.div>
  );
}

function DetailsForm({
  abonoCount,
  selectedSeats,
  holderDrafts,
  onHolderDraftChange,
  purchaserEmail,
  onPurchaserEmailChange,
  allHoldersComplete,
  onBack,
  onSubmit,
  emailLocked,
  isSubmitting,
  confirmError,
  readOnly,
}: {
  abonoCount: number;
  selectedSeats: Seat[];
  holderDrafts: AbonoHolderDraft[];
  onHolderDraftChange: (index: number, patch: Partial<AbonoHolderDraft>) => void;
  purchaserEmail: string;
  onPurchaserEmailChange: (email: string) => void;
  allHoldersComplete: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  emailLocked?: boolean;
  isSubmitting?: boolean;
  confirmError?: string | null;
  readOnly?: boolean;
}) {
  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={onSubmit}
      className="flex flex-1 flex-col gap-4 pt-4"
    >
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white">
          Correo de la compra (Tu Boleta)
        </label>
        <input
          type="email"
          required
          readOnly={emailLocked}
          placeholder="correo@ejemplo.com"
          value={purchaserEmail}
          onChange={(e) => onPurchaserEmailChange(e.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none",
            emailLocked && "cursor-not-allowed opacity-80"
          )}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          El mismo correo con el que compraste {abonoCount > 1 ? "los abonos" : "el abono"}.
        </p>
      </div>

      <div className="space-y-4">
        {selectedSeats.map((seat, index) => (
          <HolderCard
            key={seat.id}
            index={index}
            seat={seat}
            holder={holderDrafts[index] ?? { fullName: "", documentId: "", jerseySize: "" }}
            onChange={(patch) => onHolderDraftChange(index, patch)}
          />
        ))}
      </div>

      {confirmError ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {confirmError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack} className="sm:flex-1" disabled={isSubmitting}>
          Volver al mapa
        </Button>
        <Button
          type="submit"
          disabled={!purchaserEmail.trim() || !allHoldersComplete || isSubmitting || readOnly}
          className={cn(
            "h-12 font-heading uppercase tracking-wider sm:flex-[2]",
            allHoldersComplete && purchaserEmail.trim() && !isSubmitting
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-white/10 text-muted-foreground"
          )}
        >
          {isSubmitting ? "Guardando…" : `Confirmar ${abonoCount > 1 ? "todos los abonos" : "mi abono"}`}
        </Button>
      </div>

      {!allHoldersComplete ? (
        <p className="text-center text-[11px] text-muted-foreground">
          Completa nombre, documento y talla de cada abonado para confirmar.
        </p>
      ) : null}
    </motion.form>
  );
}

function HolderCard({
  index,
  seat,
  holder,
  onChange,
}: {
  index: number;
  seat: Seat;
  holder: AbonoHolderDraft;
  onChange: (patch: Partial<AbonoHolderDraft>) => void;
}) {
  const complete = isHolderDraftComplete(holder);

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        complete ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-black/30"
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <User className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white">
            Abonado {index + 1}
          </span>
        </div>
        <span className="font-mono text-sm text-primary">#{seat.id}</span>
      </div>

      <div className="mb-3">
        <label className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Shirt className="size-3.5 text-primary" />
          Talla de camiseta
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {JERSEY_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onChange({ jerseySize: size })}
              className={cn(
                "rounded-lg border py-2 text-xs font-semibold transition-all",
                holder.jerseySize === size
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/15 bg-black/40 text-white hover:border-primary/40"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Nombre completo"
          value={holder.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          className="h-10 rounded-lg border border-white/15 bg-black/50 px-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
        />
        <input
          type="text"
          placeholder="Cédula o documento"
          value={holder.documentId}
          onChange={(e) => onChange({ documentId: e.target.value })}
          className="h-10 rounded-lg border border-white/15 bg-black/50 px-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  );
}

function ConfirmedView({
  selectedSeats,
  holderDrafts,
  purchaserEmail,
  onEdit,
}: {
  selectedSeats: Seat[];
  holderDrafts: AbonoHolderDraft[];
  purchaserEmail: string;
  onEdit?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4 py-6"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="size-8" />
        </div>
        <p className="font-heading text-xl uppercase text-white">¡Todo registrado!</p>
        <p className="text-sm text-muted-foreground">
          Confirmación a <strong className="text-white">{purchaserEmail}</strong>
        </p>
      </div>

      <div className="space-y-3">
        {selectedSeats.map((seat, index) => {
          const holder = holderDrafts[index];
          return (
          <div
            key={seat.id}
            className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-left"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Abonado {index + 1}
            </p>
            <p className="font-mono text-2xl font-bold text-primary">#{seat.id}</p>
            <p className="text-sm text-white">{formatSeatLabel(seat)}</p>
            {holder ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {holder.fullName} · Doc. {holder.documentId}
                </p>
                <p className="text-sm text-muted-foreground">
                  Camiseta <strong className="text-white">{holder.jerseySize}</strong>
                </p>
              </>
            ) : null}
          </div>
          );
        })}
      </div>

      {onEdit ? (
        <Button type="button" variant="outline" onClick={onEdit}>
          Editar datos
        </Button>
      ) : null}
    </motion.div>
  );
}

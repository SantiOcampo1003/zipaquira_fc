"use client";

import { Check, Minus, Plus } from "lucide-react";
import { MAX_ABONOS_PER_EMAIL, type StadiumBookingStep } from "@/lib/stadium-seating";
import { cn } from "@/lib/utils";

const STEPS: { id: StadiumBookingStep; label: string; short: string }[] = [
  { id: "seats", label: "Elige tus sillas", short: "Sillas" },
  { id: "details", label: "Datos y camisetas", short: "Datos" },
  { id: "confirmed", label: "Confirmación", short: "Listo" },
];

type BookingStepIndicatorProps = {
  currentStep: StadiumBookingStep;
  abonoCount: number;
  seatsSelected: number;
  purchaseLocked?: boolean;
  onAbonoCountChange?: (count: number) => void;
};

export function BookingStepIndicator({
  currentStep,
  abonoCount,
  seatsSelected,
  purchaseLocked = false,
  onAbonoCountChange,
}: BookingStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const canEditCount = !purchaseLocked && currentStep === "seats" && onAbonoCountChange;

  return (
    <div className="rounded-xl border border-white/10 bg-[#18181B]/80 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Tu proceso de abono{abonoCount > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-sm text-white">
            {purchaseLocked
              ? abonoCount > 1
                ? `Tu compra incluye ${abonoCount} abonos. Elige una silla por cada uno.`
                : "Tu compra incluye 1 abono. Elige tu silla en el mapa."
              : abonoCount > 1
              ? `Indica cuántos abonos compraste y elige ${abonoCount} sillas en el mapa.`
              : "Si compraste 1 abono, elige 1 silla. Si compraste más, súbelo abajo."}
          </p>

          {canEditCount ? (
            <div className="mt-4 inline-flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                ¿Cuántos abonos compraste? (máx. {MAX_ABONOS_PER_EMAIL})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAbonoCountChange(Math.max(1, abonoCount - 1))}
                  disabled={abonoCount <= 1}
                  className="flex size-9 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white disabled:opacity-30"
                  aria-label="Menos abonos"
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-[3rem] text-center font-mono text-xl font-bold text-primary">
                  {abonoCount}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onAbonoCountChange(Math.min(MAX_ABONOS_PER_EMAIL, abonoCount + 1))
                  }
                  disabled={abonoCount >= MAX_ABONOS_PER_EMAIL}
                  className="flex size-9 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white disabled:opacity-30"
                  aria-label="Más abonos"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          ) : purchaseLocked ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Cantidad de abonos confirmada por tu compra en Tu Boleta.
            </p>
          ) : null}
        </div>

        {currentStep === "seats" ? (
          <div className="shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-center">
            <p className="font-mono text-lg font-bold text-primary">
              {seatsSelected}/{abonoCount}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {abonoCount === 1 ? "silla elegida" : "sillas elegidas"}
            </p>
          </div>
        ) : null}
      </div>

      <ol className="mt-5 flex items-center gap-2 sm:gap-3">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-white/15 bg-black/40 text-muted-foreground"
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "hidden truncate text-xs font-medium sm:inline",
                  active ? "text-white" : done ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.short}
              </span>
              {index < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mx-1 hidden h-px flex-1 sm:block",
                    done ? "bg-primary/60" : "bg-white/10"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionBadge } from "@/components/SectionBadge";
import { Separator } from "@/components/ui/separator";
import { BookingStepIndicator } from "@/components/stadium/BookingStepIndicator";
import { StadiumGrandstandMap } from "@/components/stadium/StadiumGrandstandMap";
import { StadiumPerspectiveView } from "@/components/stadium/StadiumPerspectiveView";
import { SeatBookingPanel } from "@/components/stadium/SeatBookingPanel";
import type { AbonoSessionPurchase, AbonoSessionRegistration } from "@/lib/stadium-db";
import {
  clampAbonoCount,
  createEmptyHolderDrafts,
  generateInitialStadiumSeats,
  isSeatSelectable,
  parseAbonoCountParam,
  type AbonoHolderDraft,
  type Seat,
  type StadiumBookingStep,
  type StadiumZoneId,
  STADIUM_ZONES,
} from "@/lib/stadium-seating";

type StadiumSeatingSectionProps = {
  purchaseAbonoCount?: number;
};

type SessionResponse = {
  purchase: AbonoSessionPurchase | null;
  registrations: AbonoSessionRegistration[];
  seats: Seat[];
  error?: string;
};

export function StadiumSeatingSection({ purchaseAbonoCount }: StadiumSeatingSectionProps) {
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("token")?.trim() || null;

  const [localAbonoCount, setLocalAbonoCount] = useState(() =>
    parseAbonoCountParam(searchParams.get("abonos"))
  );

  const [sessionPurchase, setSessionPurchase] = useState<AbonoSessionPurchase | null>(null);
  const [seats, setSeats] = useState<Seat[]>(() => generateInitialStadiumSeats());
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const purchaseLocked = purchaseAbonoCount != null || sessionPurchase != null;

  const abonoCount = useMemo(() => {
    if (purchaseAbonoCount != null) return clampAbonoCount(purchaseAbonoCount);
    if (sessionPurchase) return sessionPurchase.abonoCount;
    return clampAbonoCount(localAbonoCount);
  }, [purchaseAbonoCount, sessionPurchase, localAbonoCount]);

  const allowedZoneId: StadiumZoneId | null = sessionPurchase?.zoneId ?? null;

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<StadiumZoneId | "all">("all");
  const [bookingStep, setBookingStep] = useState<StadiumBookingStep>("seats");
  const [holderDrafts, setHolderDrafts] = useState<AbonoHolderDraft[]>(() =>
    createEmptyHolderDrafts(abonoCount)
  );
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setSessionLoading(true);
    setSessionError(null);

    try {
      const params = new URLSearchParams();
      if (accessToken) params.set("token", accessToken);

      const res = await fetch(`/api/abonos/session?${params.toString()}`);
      const data = (await res.json()) as SessionResponse;

      if (!res.ok) {
        setSessionError(data.error ?? "No pudimos cargar tu sesión de abono.");
        setSeats(generateInitialStadiumSeats());
        return;
      }

      setSeats(data.seats);

      if (data.purchase) {
        setSessionPurchase(data.purchase);
        setPurchaserEmail(data.purchase.purchaserEmail);
        setActiveZoneId(data.purchase.zoneId);

        if (data.purchase.status === "completed" && data.registrations.length > 0) {
          setSelectedSeatIds(
            data.registrations
              .sort((a, b) => a.abonoIndex - b.abonoIndex)
              .map((r) => r.seatId)
          );
          setHolderDrafts(
            data.registrations
              .sort((a, b) => a.abonoIndex - b.abonoIndex)
              .map((r) => ({
                fullName: r.holderFullName,
                documentId: r.holderDocumentId,
                jerseySize: r.jerseySize,
              }))
          );
          setBookingStep("confirmed");
        } else {
          setHolderDrafts(createEmptyHolderDrafts(data.purchase.abonoCount));
          setBookingStep("seats");
        }
      }
    } catch {
      setSessionError("Error de conexión. Recarga la página.");
      setSeats(generateInitialStadiumSeats());
    } finally {
      setSessionLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    loadSession();
  }, [accessToken, loadSession]);

  useEffect(() => {
    setHolderDrafts((prev) => {
      if (prev.length === abonoCount) return prev;
      if (prev.length < abonoCount) {
        return [...prev, ...createEmptyHolderDrafts(abonoCount - prev.length)];
      }
      return prev.slice(0, abonoCount);
    });
    setSelectedSeatIds((prev) => prev.slice(0, abonoCount));
    if (!purchaseLocked && bookingStep !== "confirmed") {
      setBookingStep("seats");
      setSelectionMessage(null);
    }
  }, [abonoCount, purchaseLocked, bookingStep]);

  const handleAbonoCountChange = useCallback(
    (count: number) => {
      if (purchaseLocked) return;
      setLocalAbonoCount(clampAbonoCount(count));
    },
    [purchaseLocked]
  );

  const seatById = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats]);

  const selectedSeats = useMemo(
    () =>
      selectedSeatIds
        .map((id) => seatById.get(id))
        .filter((s): s is Seat => s != null),
    [selectedSeatIds, seatById]
  );

  const selectSeat = useCallback(
    (seat: Seat) => {
      if (!isSeatSelectable(seat)) return;
      if (bookingStep !== "seats") return;
      if (allowedZoneId && seat.zoneId !== allowedZoneId) {
        setSelectionMessage(
          `Tu abono es ${STADIUM_ZONES[allowedZoneId].shortName}. Solo puedes elegir sillas de esa zona.`
        );
        return;
      }

      setSelectionMessage(null);
      setSelectedSeatIds((prev) => {
        const existing = prev.indexOf(seat.id);
        if (existing >= 0) {
          return prev.filter((id) => id !== seat.id);
        }
        if (prev.length >= abonoCount) {
          setSelectionMessage(
            abonoCount === 1
              ? "Solo tienes 1 abono. Quita esta silla para cambiarla."
              : `Ya elegiste las ${abonoCount} sillas. Quita una para cambiarla.`
          );
          return prev;
        }
        return [...prev, seat.id];
      });
    },
    [bookingStep, abonoCount, allowedZoneId]
  );

  const clearSeatAt = useCallback((index: number) => {
    setSelectedSeatIds((prev) => prev.filter((_, i) => i !== index));
    setBookingStep("seats");
    setSelectionMessage(null);
  }, []);

  const updateHolderDraft = useCallback((index: number, patch: Partial<AbonoHolderDraft>) => {
    setHolderDrafts((prev) =>
      prev.map((holder, i) => (i === index ? { ...holder, ...patch } : holder))
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!accessToken) return;

    setConfirmError(null);
    setIsSubmitting(true);

    try {
      const assignments = selectedSeats.map((seat, index) => {
        const holder = holderDrafts[index] ?? { fullName: "", documentId: "", jerseySize: "" as const };
        return {
          abono_index: index + 1,
          seat_number: seat.seatNumber,
          holder_full_name: holder.fullName.trim(),
          holder_document_id: holder.documentId.trim(),
          jersey_size: holder.jerseySize,
        };
      });

      const res = await fetch("/api/abonos/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: accessToken,
          purchaserEmail: purchaserEmail.trim(),
          assignments,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setConfirmError(data.error ?? "No pudimos confirmar tu abono.");
        await loadSession();
        return;
      }

      setBookingStep("confirmed");
      await loadSession();
    } catch {
      setConfirmError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken, selectedSeats, holderDrafts, purchaserEmail, loadSession]);

  const seatsComplete = selectedSeatIds.length === abonoCount;
  const isCompletedPurchase = sessionPurchase?.status === "completed";

  // Sección privada: solo visible para quien entra con el link personal del correo.
  if (!accessToken) return null;

  return (
    <section
      id="silleteria"
      className="rz-section scroll-mt-[3.5rem] border-t border-primary/25 bg-gradient-to-b from-[#121215] via-[#09110d] to-[#121215] sm:scroll-mt-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center">
          <SectionBadge>Abonados · Elección de silla</SectionBadge>
          <h2 className="rz-h2 mt-5 text-balance sm:mt-6">
            Elige tu silla en la tribuna
            <span className="mt-2 block text-primary">Numeración oficial 001 – 568</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Si ya compraste tu abono por zona, selecciona aquí tu silla exacta y la talla de
            camiseta. Puedes comprar entre 1 y 10 abonos con el mismo correo en Tu Boleta.
          </p>
          <Separator className="mx-auto mt-8 max-w-xs bg-primary/30" />
        </RevealOnScroll>

        {sessionLoading ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Cargando mapa y tu compra…
          </p>
        ) : null}

        {sessionError ? (
          <p className="mt-8 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-300">
            {sessionError}
          </p>
        ) : null}

        {!sessionLoading ? (
          <>
            <div className="mt-8">
              <RevealOnScroll>
                <BookingStepIndicator
                  currentStep={bookingStep}
                  abonoCount={abonoCount}
                  seatsSelected={selectedSeatIds.length}
                  purchaseLocked={purchaseLocked}
                  onAbonoCountChange={handleAbonoCountChange}
                />
              </RevealOnScroll>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {(Object.keys(STADIUM_ZONES) as StadiumZoneId[]).map((zoneId) => {
                const zone = STADIUM_ZONES[zoneId];
                return (
                  <div
                    key={zoneId}
                    className={`rounded-xl border p-4 ${zone.accentBorder} ${zone.accentBg}`}
                  >
                    <p className="font-heading text-sm uppercase text-white">{zone.shortName}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {zone.seatsPerRow} sillas × 4 filas = {zone.totalSeats} total
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 w-full">
              <RevealOnScroll>
                <StadiumGrandstandMap
                  seats={seats}
                  selectedSeatIds={selectedSeatIds}
                  onSelectSeat={selectSeat}
                  hoveredSeat={hoveredSeat}
                  setHoveredSeat={setHoveredSeat}
                  activeZoneId={activeZoneId}
                  setActiveZoneId={setActiveZoneId}
                  allowedZoneId={allowedZoneId}
                  selectionEnabled={bookingStep === "seats" && !isCompletedPurchase}
                  abonoCount={abonoCount}
                />
              </RevealOnScroll>

              {bookingStep === "seats" && selectionMessage ? (
                <p className="mt-3 text-center text-sm text-amber-400">{selectionMessage}</p>
              ) : null}

              {bookingStep === "seats" && seatsComplete ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingStep("details");
                      document.getElementById("booking-panel")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="inline-flex h-12 items-center rounded-xl bg-primary px-6 font-heading text-sm uppercase tracking-wider text-primary-foreground shadow-[0_0_24px_rgba(169,146,89,0.4)] transition hover:bg-primary/90"
                  >
                    Sillas listas · Continuar con los datos →
                  </button>
                </div>
              ) : null}
            </div>

            <div id="booking-panel" className="mt-8 grid gap-8 lg:grid-cols-2">
              <RevealOnScroll>
                <StadiumPerspectiveView
                  activeZoneId={activeZoneId}
                  hoveredSeat={hoveredSeat ?? selectedSeats[selectedSeats.length - 1] ?? null}
                />
              </RevealOnScroll>
              <RevealOnScroll>
                <SeatBookingPanel
                  abonoCount={abonoCount}
                  bookingStep={bookingStep}
                  onBookingStepChange={setBookingStep}
                  selectedSeats={selectedSeats}
                  holderDrafts={holderDrafts}
                  onHolderDraftChange={updateHolderDraft}
                  purchaserEmail={purchaserEmail}
                  onPurchaserEmailChange={setPurchaserEmail}
                  onClearSeat={clearSeatAt}
                  allowedZoneId={allowedZoneId}
                  accessToken={accessToken}
                  emailLocked={purchaseLocked}
                  isSubmitting={isSubmitting}
                  confirmError={confirmError}
                  onConfirm={accessToken ? handleConfirm : undefined}
                  readOnly={isCompletedPurchase}
                />
              </RevealOnScroll>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

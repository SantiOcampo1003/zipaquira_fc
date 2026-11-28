"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  IdCard,
  Tag,
  Loader2,
  ImagePlus,
  Mail,
  Phone,
  Ticket,
  User,
  X,
} from "lucide-react";
import { BetssonLogo } from "@/components/stadium/BetssonLogo";
import { BETSSON_MAX_SEATS, BETSSON_REGISTER_URL } from "@/lib/betsson";
import { adminFetch, getSupabaseBrowser } from "@/lib/supabase-browser";
import { StadiumGrandstandMap } from "@/components/stadium/StadiumGrandstandMap";
import { Button } from "@/components/ui/button";
import {
  CATEDRAL_BASE_PRICE_COP,
  CATEDRAL_DISCOUNT_PCT,
  CATEDRAL_PLAYER_PRICE_COP,
  CATEDRAL_TICKET_PRICE_COP,
  formatCop,
  formatSeatLabel,
  generateInitialStadiumSeats,
  twoForOneTotalCop,
  type Seat,
  type StadiumZoneId,
} from "@/lib/stadium-seating";
import { cn } from "@/lib/utils";

type HolderDraft = { fullName: string; documentId: string; phone: string };
const EMPTY_HOLDER: HolderDraft = { fullName: "", documentId: "", phone: "" };
const MAX_SEATS = 10;

/** Reduce el pantallazo (JPEG, máx. 1800px) para que suba rápido y quepa en el límite del servidor. */
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "pantallazo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

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
  mode = "venta",
}: {
  matchLabel: string;
  /** Correo de la cuenta de Google ya autenticada — si viene, el campo queda bloqueado. */
  userEmail?: string;
  /**
   * venta: compra normal · cortesia (solo admin): sin cobro ni Wompi, la boleta
   * se envía directo al correo · 2x1 (solo admin): paga 1 de cada 2 por Wompi.
   */
  mode?: "venta" | "cortesia" | "2x1" | "betsson";
}) {
  const courtesy = mode === "cortesia";
  const twoForOne = mode === "2x1";
  const betsson = mode === "betsson";
  const maxSeats = betsson ? BETSSON_MAX_SEATS : MAX_SEATS;
  const [betssonImage, setBetssonImage] = useState<File | null>(null);
  const [betssonPreview, setBetssonPreview] = useState<string | null>(null);
  const [confirmAdult, setConfirmAdult] = useState(false);
  const [confirmData, setConfirmData] = useState(false);
  const [confirmMinor, setConfirmMinor] = useState(false);
  const [betssonDone, setBetssonDone] = useState<{ status: "approved" | "pending"; email: string; emailSent: boolean; seats: number } | null>(null);
  const [courtesyDone, setCourtesyDone] = useState<{ seats: number; email: string; emailSent: boolean } | null>(null);
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
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  const unitPrice = courtesy || betsson ? 0 : twoForOne ? CATEDRAL_BASE_PRICE_COP / 2 : appliedCode ? CATEDRAL_PLAYER_PRICE_COP : CATEDRAL_TICKET_PRICE_COP;
  const allowedZoneId: StadiumZoneId | null = selectedSeats[0]?.zoneId ?? null;
  const totalPrice = twoForOne ? twoForOneTotalCop(selectedSeats.length) : selectedSeats.length * unitPrice;
  const oddForTwoForOne = twoForOne && selectedSeats.length % 2 !== 0;
  const allHoldersComplete = holderDrafts.every(
    (h, i) =>
      h.fullName.trim().length > 1 &&
      h.documentId.trim().length > 2 &&
      // En Betsson el menor usa el celular del adulto que lo acompaña.
      (h.phone.trim().length > 6 || (betsson && i === 1))
  );
  const betssonReady =
    !betsson || (!!betssonImage && confirmAdult && confirmData && (selectedSeats.length < 2 || confirmMinor));

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
    if (selectedSeats.length >= maxSeats) return;
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

  async function applyCode() {
    const code = codeInput.trim();
    if (!code) return;
    setCheckingCode(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/boletas/discount-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCodeError(data.error ?? "Código de descuento inválido.");
        return;
      }
      setAppliedCode(code);
    } catch {
      setCodeError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCheckingCode(false);
    }
  }

  function removeCode() {
    setAppliedCode(null);
    setCodeInput("");
    setCodeError(null);
  }

  async function pickBetssonImage(file: File | null) {
    if (betssonPreview) URL.revokeObjectURL(betssonPreview);
    if (!file) {
      setBetssonImage(null);
      setBetssonPreview(null);
      return;
    }
    const compressed = await compressImage(file);
    setBetssonImage(compressed);
    setBetssonPreview(URL.createObjectURL(compressed));
  }

  async function handleBetsson() {
    if (!allowedZoneId || !betssonImage || selectedSeats.length === 0) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const { data: sessionData } = await getSupabaseBrowser().auth.getSession();
      const token = sessionData.session?.access_token;
      const form = new FormData();
      form.append(
        "data",
        JSON.stringify({
          matchLabel,
          zoneId: allowedZoneId,
          seats: selectedSeats.map((seat, i) => ({
            seatNumber: seat.seatNumber,
            holderFullName: holderDrafts[i].fullName,
            holderDocumentId: holderDrafts[i].documentId,
            holderPhone: i === 1 ? holderDrafts[0].phone : holderDrafts[i].phone,
          })),
          purchaserPhone,
          confirmAdult,
          confirmData,
          confirmMinor: selectedSeats.length === 2 ? confirmMinor : undefined,
        })
      );
      form.append("image", betssonImage);
      const res = await fetch("/api/betsson/checkout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? "No pudimos procesar tu registro.");
        return;
      }
      setBetssonDone({ status: data.status, email: data.email ?? purchaserEmail, emailSent: data.emailSent !== false, seats: selectedSeats.length });
    } catch {
      setCheckoutError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay() {
    if (betsson) return handleBetsson();
    if (!allowedZoneId || selectedSeats.length === 0) return;
    if (!purchaserEmail.trim() || !purchaserPhone.trim() || !allHoldersComplete) return;

    setSubmitting(true);
    setCheckoutError(null);
    try {
      const doFetch = courtesy || twoForOne ? adminFetch : fetch;
      const res = await doFetch(courtesy ? "/api/cortesias/checkout" : "/api/boletas/checkout", {
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
          ...(!courtesy && !twoForOne && appliedCode ? { discountCode: appliedCode } : {}),
          ...(twoForOne ? { promo: "2x1" } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? (courtesy ? "No pudimos emitir la cortesía." : "No pudimos iniciar el pago."));
        return;
      }
      if (courtesy) {
        setCourtesyDone({ seats: data.seats, email: purchaserEmail, emailSent: data.emailSent });
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setCheckoutError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (betssonDone) {
    const approved = betssonDone.status === "approved";
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center text-white">
        <BetssonLogo className="mb-4 text-4xl" />
        <CheckCircle2 className="mb-4 size-12 text-primary" />
        <h1 className="font-heading text-2xl uppercase">{approved ? "¡Tu entrada está lista!" : "Recibimos tu registro"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {approved
            ? betssonDone.emailSent
              ? `Verificamos tu registro. Enviamos ${betssonDone.seats === 1 ? "tu boleta" : "tus boletas"} con código QR a ${betssonDone.email}.`
              : `Verificamos tu registro y tus sillas quedaron reservadas, pero no pudimos enviar el correo a ${betssonDone.email}. Escríbenos para reenviártelas.`
            : `Estamos revisando tu pantallazo. Cuando lo aprobemos te enviamos la boleta a ${betssonDone.email}. Tus sillas se asignan al aprobar, según disponibilidad.`}
        </p>
        <p className="mt-4 text-xs text-white/50">Betsson patrocina este partido. +18 · Juega con responsabilidad.</p>
      </div>
    );
  }

  if (courtesyDone) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center text-white">
        <CheckCircle2 className="mb-4 size-12 text-primary" />
        <h1 className="font-heading text-2xl uppercase">
          {courtesyDone.seats === 1 ? "Cortesía emitida" : `${courtesyDone.seats} cortesías emitidas`}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {courtesyDone.emailSent
            ? `Enviamos la boleta con su código QR a ${courtesyDone.email}.`
            : `Las sillas quedaron reservadas, pero NO se pudo enviar el correo a ${courtesyDone.email}. Avísale al desarrollador para reenviarla.`}
        </p>
        <Button type="button" onClick={() => window.location.reload()} className="mt-6 bg-primary text-primary-foreground">
          Emitir otra cortesía
        </Button>
      </div>
    );
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
      <h1 className="font-heading text-2xl uppercase text-white sm:text-3xl">
        {courtesy ? "Emitir cortesía" : twoForOne ? "Venta 2x1" : betsson ? "Tu entrada con Betsson" : "Comprar boleta"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {betsson
          ? "Regístrate en Betsson con el link del club, sube el pantallazo de tu perfil y elige tu silla. Es gratis: tu boleta con código QR llega a tu correo."
          : courtesy
          ? "Elige las sillas y los datos de cada titular. No se cobra: la boleta en PDF con código QR se envía al correo que indiques."
          : twoForOne
          ? "Promo 2x1: elige las sillas de a pares y se cobra una por cada dos (a $35.100 c/u). Se paga con Wompi y las boletas llegan al correo que indiques."
          : "Elige tu silla en el mapa y paga en línea con Wompi — recibirás tu boleta en PDF con código QR por correo."}
      </p>

      {betsson ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#F26B21]/40 bg-gradient-to-r from-[#F26B21]/20 via-[#18181B] to-[#18181B] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <BetssonLogo className="text-4xl" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">patrocina tu partido</span>
          </div>
          <ol className="mt-4 grid gap-3 text-sm text-white/90 sm:grid-cols-3">
            <li className="rounded-xl border border-white/10 bg-black/30 p-3">
              <span className="font-heading text-[#F26B21]">1.</span> Regístrate en Betsson con el link del club.
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 p-3">
              <span className="font-heading text-[#F26B21]">2.</span> Toma un pantallazo de tu perfil (Datos Personales).
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 p-3">
              <span className="font-heading text-[#F26B21]">3.</span> Elige tu silla, sube el pantallazo y recibe tu boleta.
            </li>
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={BETSSON_REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex h-11 items-center rounded-lg bg-[#F26B21] px-5 font-heading text-sm uppercase tracking-wider text-black transition hover:bg-[#ff7c35]"
            >
              Registrarme en Betsson
            </a>
            <p className="text-xs text-white/60">
              Un menor de edad puede entrar gratis acompañado por una persona registrada (una boleta extra por registro).
              Solo mayores de 18 pueden registrarse en Betsson. Juega con responsabilidad.
            </p>
          </div>
        </div>
      ) : null}

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
            abonoCount={maxSeats}
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
                    {betsson ? "Haz clic en tu silla. Si te acompaña un menor de edad, elige una segunda silla para él (máximo 2)." : `Haz clic en una silla disponible del mapa. Puedes elegir hasta ${maxSeats}.`}
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
                          <p className="text-sm text-white">
                            {courtesy ? (
                              "Cortesía"
                            ) : betsson ? (
                              i === 1 ? "Menor" : "Gratis"
                            ) : twoForOne ? (
                              "2x1"
                            ) : (
                              <>
                                {CATEDRAL_DISCOUNT_PCT > 0 && (
                                  <span className="mr-1 text-xs text-white/40 line-through">
                                    {formatCop(CATEDRAL_BASE_PRICE_COP)}
                                  </span>
                                )}
                                {formatCop(unitPrice)}
                              </>
                            )}
                          </p>
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

                {selectedSeats.length > 0 && !courtesy && !betsson ? (
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                    <span className="text-muted-foreground">
                      {twoForOne ? "Total · 2x1 (pagas 1 de cada 2)" : appliedCode ? "Total · precio con código" : CATEDRAL_DISCOUNT_PCT > 0 ? `Total · ${CATEDRAL_DISCOUNT_PCT}% de descuento` : "Total"}
                    </span>
                    <span className="font-heading text-lg text-primary">{formatCop(totalPrice)}</span>
                  </div>
                ) : null}

                {courtesy || twoForOne || betsson ? null : (
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  {appliedCode ? (
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-primary">
                        <Check className="size-4" />
                        Código aplicado: {formatCop(CATEDRAL_PLAYER_PRICE_COP)} por boleta
                      </span>
                      <button
                        type="button"
                        onClick={removeCode}
                        className="text-xs text-muted-foreground underline-offset-2 hover:text-white hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <>
                      <label htmlFor="discount-code" className="mb-1.5 block text-xs text-muted-foreground">
                        ¿Tienes un código de descuento?
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <FieldIcon Icon={Tag} />
                          <input
                            id="discount-code"
                            type="text"
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            placeholder="Código"
                            value={codeInput}
                            onChange={(e) => {
                              setCodeInput(e.target.value);
                              setCodeError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                applyCode();
                              }
                            }}
                            className={fieldClassName}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!codeInput.trim() || checkingCode}
                          onClick={applyCode}
                          className="h-11 shrink-0"
                        >
                          {checkingCode ? <Loader2 className="size-4 animate-spin" /> : "Aplicar"}
                        </Button>
                      </div>
                      {codeError ? <p className="mt-1.5 text-xs text-rose-300">{codeError}</p> : null}
                    </>
                  )}
                </div>
                )}

                {oddForTwoForOne ? (
                  <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    El 2x1 es por parejas: elige una silla más (o quita una) para continuar.
                  </p>
                ) : null}

                <Button
                  type="button"
                  disabled={selectedSeats.length === 0 || oddForTwoForOne}
                  onClick={() => setStep("details")}
                  className={cn(
                    "h-12 font-heading uppercase tracking-wider",
                    selectedSeats.length > 0 && !oddForTwoForOne
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
                    {courtesy || twoForOne || betsson ? "Correo donde se envía la boleta" : "Correo de contacto"}
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
                            {betsson ? (index === 0 ? "Persona registrada en Betsson" : "Menor de edad acompañante") : `Titular ${index + 1}`}
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
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={12}
                            placeholder={betsson && index === 1 ? "Documento del menor (TI / registro civil)" : "Cédula"}
                            value={holderDrafts[index]?.documentId ?? ""}
                            onChange={(e) => updateHolder(index, { documentId: e.target.value.replace(/\D/g, "") })}
                            className={fieldClassName}
                          />
                        </div>
                        <div className={cn("relative sm:col-span-2", betsson && index === 1 && "hidden")}>
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

                {betsson ? (
                  <div className="space-y-3 rounded-xl border border-[#F26B21]/30 bg-[#F26B21]/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white">Pantallazo de tu perfil de Betsson</p>
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-white/25 bg-black/30 p-4 text-center text-xs text-muted-foreground transition-colors hover:border-[#F26B21]/60">
                      {betssonPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={betssonPreview} alt="Pantallazo seleccionado" className="max-h-56 w-auto rounded-md" />
                      ) : (
                        <ImagePlus className="size-8 text-[#F26B21]" />
                      )}
                      <span>{betssonImage ? "Toca para cambiar la imagen" : "Toca para subir la imagen (Datos Personales de Betsson)"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => pickBetssonImage(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Debe verse que es betsson.co y tu nombre y correo, tal cual aparecen en tu cuenta. Cada correo de Betsson y cada
                      pantallazo solo se puede usar una vez.
                    </p>
                    <label className="flex items-start gap-2 text-xs text-white/90">
                      <input type="checkbox" checked={confirmAdult} onChange={(e) => setConfirmAdult(e.target.checked)} className="mt-0.5 accent-[#F26B21]" />
                      Soy mayor de 18 años y me registré en Betsson con el link del club.
                    </label>
                    {selectedSeats.length === 2 ? (
                      <label className="flex items-start gap-2 text-xs text-white/90">
                        <input type="checkbox" checked={confirmMinor} onChange={(e) => setConfirmMinor(e.target.checked)} className="mt-0.5 accent-[#F26B21]" />
                        La segunda boleta es para un menor de 18 años que va conmigo.
                      </label>
                    ) : null}
                    <label className="flex items-start gap-2 text-xs text-white/90">
                      <input type="checkbox" checked={confirmData} onChange={(e) => setConfirmData(e.target.checked)} className="mt-0.5 accent-[#F26B21]" />
                      Autorizo el tratamiento de mis datos y del pantallazo solo para validar mi registro y emitir mi boleta.
                    </label>
                  </div>
                ) : null}

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                  <span className="text-muted-foreground">{courtesy || betsson ? "Valor" : "Total a pagar"}</span>
                  <span className="font-heading text-lg text-primary">{courtesy ? "Cortesía — $0" : betsson ? "Gratis con Betsson" : formatCop(totalPrice)}</span>
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
                    disabled={!purchaserEmail.trim() || !purchaserPhone.trim() || !allHoldersComplete || !betssonReady || submitting}
                    onClick={handlePay}
                    className="h-12 flex-1 bg-primary font-heading uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> {betsson ? "Verificando tu pantallazo…" : courtesy ? "Emitiendo…" : "Conectando con Wompi…"}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" /> {betsson ? "Enviar y recibir mi boleta" : courtesy ? "Emitir cortesía y enviar boleta" : "Pagar con Wompi"}
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

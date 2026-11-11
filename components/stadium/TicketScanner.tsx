"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SCANNER_ELEMENT_ID = "ticket-qr-reader";

type ScanResult = {
  result: "OK" | "ALREADY_USED" | "INVALID";
  message?: string;
  holderFullName?: string;
  seatNumber?: number;
};

export function TicketScanner() {
  const searchParams = useSearchParams();
  const adminKey = searchParams.get("key")?.trim() || "";
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [checking, setChecking] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!adminKey) return;

    let scanner: import("html5-qrcode").Html5QrcodeScanner | null = null;
    let cancelled = false;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (cancelled) return;
      scanner = new Html5QrcodeScanner(
        SCANNER_ELEMENT_ID,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText) => {
          if (busyRef.current) return;
          busyRef.current = true;
          setChecking(true);
          try {
            const res = await fetch("/api/tickets/checkin", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-admin-secret": adminKey },
              body: JSON.stringify({ ticketCode: decodedText }),
            });
            const data = await res.json();
            setLastResult({
              result: data.result ?? "INVALID",
              message: data.message,
              holderFullName: data.holderFullName,
              seatNumber: data.seatNumber,
            });
          } catch {
            setLastResult({ result: "INVALID", message: "Error de conexión." });
          } finally {
            setChecking(false);
            setTimeout(() => {
              busyRef.current = false;
            }, 2000);
          }
        },
        () => {}
      );
    });

    return () => {
      cancelled = true;
      scanner?.clear().catch(() => {});
    };
  }, [adminKey]);

  if (!adminKey) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-white">
        <ShieldAlert className="mx-auto mb-4 size-12 text-rose-400" />
        <h1 className="font-heading text-2xl uppercase">No autorizado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Este escáner necesita un link con <code>?key=</code> válido.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-white">
      <h1 className="font-heading text-2xl uppercase">Escanear boleta</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Apunta la cámara al código QR de la boleta de cada persona en la entrada.
      </p>

      <div id={SCANNER_ELEMENT_ID} className="mt-6 overflow-hidden rounded-2xl border border-primary/25" />

      {checking ? <p className="mt-4 text-center text-sm text-muted-foreground">Verificando…</p> : null}

      {lastResult ? (
        <div
          className={cn(
            "mt-4 rounded-2xl border p-5 text-center",
            lastResult.result === "OK" && "border-emerald-500/40 bg-emerald-500/10",
            lastResult.result === "ALREADY_USED" && "border-amber-500/40 bg-amber-500/10",
            lastResult.result === "INVALID" && "border-rose-500/40 bg-rose-500/10"
          )}
        >
          {lastResult.result === "OK" ? (
            <CheckCircle2 className="mx-auto mb-2 size-10 text-emerald-400" />
          ) : (
            <XCircle
              className={cn(
                "mx-auto mb-2 size-10",
                lastResult.result === "ALREADY_USED" ? "text-amber-400" : "text-rose-400"
              )}
            />
          )}
          <p className="font-heading text-lg uppercase">
            {lastResult.result === "OK"
              ? "Ingreso válido"
              : lastResult.result === "ALREADY_USED"
              ? "Ya ingresó"
              : "Boleta no válida"}
          </p>
          {lastResult.holderFullName ? (
            <p className="mt-1 text-sm text-white">
              {lastResult.holderFullName} · Silla #{lastResult.seatNumber}
            </p>
          ) : lastResult.message ? (
            <p className="mt-1 text-sm text-muted-foreground">{lastResult.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import type { AbonoSessionPurchase } from "@/lib/stadium-db";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

export function BoletaResultadoSection() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const [purchase, setPurchase] = useState<AbonoSessionPurchase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!token) {
      setError("Enlace inválido.");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/abonos/session?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? "No pudimos verificar tu pago.");
          return;
        }

        setPurchase(data.purchase);

        if (data.purchase?.status === "awaiting_payment" && pollCount.current < MAX_POLLS) {
          pollCount.current += 1;
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setError("Error de conexión.");
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      {error ? (
        <>
          <XCircle className="mb-4 size-14 text-rose-400" />
          <h1 className="font-heading text-xl uppercase text-white">Algo salió mal</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </>
      ) : !purchase || purchase.status === "awaiting_payment" ? (
        <>
          <Loader2 className="mb-4 size-14 animate-spin text-primary" />
          <h1 className="font-heading text-xl uppercase text-white">Confirmando tu pago…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esto puede tomar unos segundos. No cierres esta página.
          </p>
        </>
      ) : purchase.status === "completed" ? (
        <>
          <CheckCircle2 className="mb-4 size-14 text-emerald-400" />
          <h1 className="font-heading text-xl uppercase text-white">¡Listo! 🟢⚪🔴</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Te enviamos tu boleta en PDF con el código QR a{" "}
            <strong className="text-white">{purchase.purchaserEmail}</strong>. Revisa tu correo (y la
            carpeta de spam) antes del partido.
          </p>
          <a
            href={`/api/boletas/${purchase.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 text-sm text-primary underline"
          >
            Ver / descargar mi boleta
          </a>
        </>
      ) : (
        <>
          <XCircle className="mb-4 size-14 text-rose-400" />
          <h1 className="font-heading text-xl uppercase text-white">El pago no se completó</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Puedes intentar de nuevo eligiendo tu silla otra vez.
          </p>
          <Link href="/boletas" className="mt-4 text-sm text-primary underline">
            Volver a elegir silla
          </Link>
        </>
      )}
    </div>
  );
}

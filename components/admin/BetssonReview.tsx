"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useFanAuth } from "@/components/auth/FanAuthProvider";
import { BetssonLogo } from "@/components/stadium/BetssonLogo";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

type SeatInfo = { seatNumber: number; holderFullName: string; holderDocumentId: string; isMinor: boolean };
type Item = {
  id: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  purchaserEmail: string;
  purchaserPhone: string;
  zoneId: string;
  seats: SeatInfo[];
  betssonEmail: string | null;
  betssonName: string | null;
  ai: { confidence?: number; notes?: string; looksEdited?: boolean } | null;
  match: string;
  imageUrl: string | null;
};

type Filter = "pending" | "approved" | "rejected";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "Por revisar" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
];

export function BetssonReview() {
  const { user, loading: authLoading } = useFanAuth();
  const [filter, setFilter] = useState<Filter>("pending");
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setItems(null);
    try {
      const res = await adminFetch(`/api/admin/betsson?status=${filter}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos cargar las solicitudes.");
        return;
      }
      setItems(data.items);
    } catch {
      setError("Error de conexión.");
    }
  }, [filter]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function act(item: Item, action: "approve" | "reject") {
    let reason: string | undefined;
    if (action === "reject") {
      const typed = window.prompt("Motivo del rechazo (le llega por correo a la persona):", "No pudimos validar tu pantallazo de Betsson.");
      if (typed === null) return;
      reason = typed || undefined;
    }
    setBusyId(item.id);
    setMessage(null);
    try {
      const res = await adminFetch(`/api/admin/betsson/${item.id}`, {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "No se pudo completar la acción.");
        return;
      }
      setMessage(
        action === "approve"
          ? data.emailSent
            ? "Aprobada: boleta enviada por correo."
            : "Aprobada, pero NO se pudo enviar el correo. Avísale al desarrollador."
          : "Rechazada."
      );
      await load();
    } catch {
      setMessage("Error de conexión.");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-heading text-xl uppercase text-white">Betsson · Revisión</h1>
        <GoogleSignInButton nextPath="/admin/betsson" label="Entrar con Google" fullWidth />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <BetssonLogo className="text-3xl" />
        <h1 className="font-heading text-xl uppercase text-white">Solicitudes de entrada</h1>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              filter === f.id ? "border-primary bg-primary/15 text-primary" : "border-white/15 text-muted-foreground hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message ? <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-white">{message}</p> : null}
      {error ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-rose-300">
          <ShieldAlert className="size-4" /> {error}
        </p>
      ) : items === null ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No hay solicitudes en esta lista.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="grid gap-4 rounded-2xl border border-white/10 bg-[#18181B]/95 p-4 sm:grid-cols-[180px_1fr]">
              {item.imageUrl ? (
                <a href={item.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="Pantallazo de Betsson" className="h-auto w-full" />
                </a>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/15 text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
              <div className="min-w-0 space-y-2 text-sm text-white">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.match} · zona {item.zoneId} · {new Date(item.createdAt).toLocaleString("es-CO")}
                </p>
                <p>
                  <span className="text-muted-foreground">Cuenta:</span> {item.purchaserEmail} · {item.purchaserPhone}
                </p>
                <p>
                  <span className="text-muted-foreground">Leído del pantallazo:</span> {item.betssonName ?? "—"} · {item.betssonEmail ?? "sin correo"}
                </p>
                <ul className="space-y-0.5">
                  {item.seats.map((s) => (
                    <li key={s.seatNumber}>
                      <span className="font-mono text-primary">#{s.seatNumber}</span> {s.holderFullName} · {s.holderDocumentId}
                      {s.isMinor ? <span className="ml-1 text-xs text-amber-300">(menor)</span> : null}
                    </li>
                  ))}
                </ul>
                {item.reason ? <p className="text-xs text-amber-200">Motivo: {item.reason}</p> : null}
                {item.ai ? (
                  <p className="text-xs text-muted-foreground">
                    Agente: confianza {Math.round((item.ai.confidence ?? 0) * 100)}%{item.ai.looksEdited ? " · parece editado" : ""} — {item.ai.notes}
                  </p>
                ) : null}
                {item.status === "pending" ? (
                  <div className="flex gap-2 pt-1">
                    <Button type="button" disabled={busyId === item.id} onClick={() => act(item, "approve")} className="bg-primary text-primary-foreground">
                      {busyId === item.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                      Aprobar y enviar boleta
                    </Button>
                    <Button type="button" variant="outline" disabled={busyId === item.id} onClick={() => act(item, "reject")}>
                      <XCircle className="mr-2 size-4" /> Rechazar
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

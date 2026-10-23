"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { StadiumGrandstandMap } from "@/components/stadium/StadiumGrandstandMap";
import { Button } from "@/components/ui/button";
import {
  generateInitialStadiumSeats,
  STADIUM_ZONES,
  type Seat,
  type StadiumZoneId,
} from "@/lib/stadium-seating";

type MatchOption = {
  id: string;
  ticket_label: string | null;
  opponent: string;
  match_date: string;
};

type FormState = {
  fullName: string;
  documentId: string;
  phone: string;
  email: string;
  newSeatNumber: string;
};

const EMPTY_FORM: FormState = { fullName: "", documentId: "", phone: "", email: "", newSeatNumber: "" };

export function AdminSeatManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const adminKey = searchParams.get("key")?.trim() || "";
  const matchParam = searchParams.get("match")?.trim() || "";

  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [seats, setSeats] = useState<Seat[]>(() => generateInitialStadiumSeats());
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalSeat, setModalSeat] = useState<Seat | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<StadiumZoneId | "all">("all");
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  const fetchMatches = useCallback(async () => {
    const res = await fetch("/api/abonos/admin/matches", {
      headers: { "x-admin-secret": adminKey },
    });
    if (res.status === 401) {
      setUnauthorized(true);
      return;
    }
    const data = await res.json();
    if (res.ok) setMatches(data.matches ?? []);
  }, [adminKey]);

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ preview: "1" });
      if (matchParam) params.set("match", matchParam);
      const res = await fetch(`/api/abonos/session?${params.toString()}`, {
        headers: { "x-admin-secret": adminKey },
      });
      const data = await res.json();
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "No pudimos cargar el mapa.");
        return;
      }
      setSeats(data.seats);
    } catch {
      setError("Error de conexión. Recarga la página.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, matchParam]);

  useEffect(() => {
    if (!adminKey) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    fetchMatches();
    fetchSeats();
  }, [adminKey, fetchMatches, fetchSeats]);

  function changeMatch(label: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (label) params.set("match", label);
    else params.delete("match");
    router.push(`${pathname}?${params.toString()}`);
  }

  function openModal(seat: Seat) {
    if (seat.status === "courtesy") {
      alert("Esta silla es de cortesía y no se puede asignar desde acá.");
      return;
    }
    setModalError(null);
    if (seat.occupantPurchaseId) {
      setForm({
        fullName: seat.occupantName ?? "",
        documentId: seat.occupantDocumentId ?? "",
        phone: seat.occupantPhone ?? "",
        email: "",
        newSeatNumber: String(seat.seatNumber),
      });
    } else {
      setForm({ ...EMPTY_FORM, newSeatNumber: String(seat.seatNumber) });
    }
    setModalSeat(seat);
  }

  async function handleAssign() {
    if (!modalSeat) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const res = await fetch("/api/abonos/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminKey },
        body: JSON.stringify({
          zoneId: modalSeat.zoneId,
          seatNumber: modalSeat.seatNumber,
          holderFullName: form.fullName,
          holderDocumentId: form.documentId,
          holderPhone: form.phone,
          holderEmail: form.email,
          matchLabel: matchParam || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error ?? "No pudimos asignar la silla.");
        return;
      }
      setModalSeat(null);
      await fetchSeats();
    } catch {
      setModalError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!modalSeat?.occupantPurchaseId) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const newSeatNumber = Number(form.newSeatNumber);
      const res = await fetch("/api/abonos/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminKey },
        body: JSON.stringify({
          purchaseId: modalSeat.occupantPurchaseId,
          holderFullName: form.fullName,
          holderDocumentId: form.documentId,
          holderPhone: form.phone,
          newSeatNumber: Number.isFinite(newSeatNumber) ? newSeatNumber : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error ?? "No pudimos guardar los cambios.");
        return;
      }
      setModalSeat(null);
      await fetchSeats();
    } catch {
      setModalError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove() {
    if (!modalSeat?.occupantPurchaseId) return;
    if (!confirm(`¿Seguro que quieres borrar la asignación de la silla #${modalSeat.id}?`)) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const res = await fetch("/api/abonos/admin/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminKey },
        body: JSON.stringify({ purchaseId: modalSeat.occupantPurchaseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error ?? "No pudimos borrar la asignación.");
        return;
      }
      setModalSeat(null);
      await fetchSeats();
    } catch {
      setModalError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = !!modalSeat?.occupantPurchaseId;

  const summary = useMemo(() => {
    const total = seats.length;
    const available = seats.filter((s) => s.status === "available").length;
    const occupied = seats.filter((s) => s.status === "occupied").length;
    return { total, available, occupied };
  }, [seats]);

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-white">
        <h1 className="font-heading text-2xl uppercase">No autorizado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Este panel necesita un link con <code>?key=</code> válido.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl uppercase text-white sm:text-3xl">Admin · Asignar sillas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Haz clic en una silla libre para asignarla, o en una ocupada para editarla, moverla o
        borrarla.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-xs font-semibold uppercase tracking-wide text-primary">
          Contexto de asignación
        </label>
        <select
          value={matchParam}
          onChange={(e) => changeMatch(e.target.value)}
          className="h-10 rounded-lg border border-white/15 bg-black/50 px-3 text-sm text-white"
        >
          <option value="">Abono de temporada</option>
          {matches.map((m) => (
            <option key={m.id} value={m.ticket_label ?? m.opponent}>
              {m.ticket_label ?? m.opponent} — {m.match_date}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={() => fetchSeats()} className="h-10">
          Refrescar mapa
        </Button>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
        <span>Total: {summary.total}</span>
        <span className="text-emerald-400">Disponibles: {summary.available}</span>
        <span className="text-rose-300">Ocupadas: {summary.occupied}</span>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Cargando mapa…</p>
      ) : (
        <div className="mt-8">
          <StadiumGrandstandMap
            seats={seats}
            selectedSeatIds={[]}
            onSelectSeat={openModal}
            hoveredSeat={hoveredSeat}
            setHoveredSeat={setHoveredSeat}
            activeZoneId={activeZoneId}
            setActiveZoneId={setActiveZoneId}
            allowedZoneId={null}
            selectionEnabled={true}
            readOnlyHover={true}
            abonoCount={1}
          />
        </div>
      )}

      {modalSeat ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-[#18181B] p-6">
            <h2 className="font-heading text-lg uppercase text-white">
              {isEdit ? "Editar / mover silla" : "Asignar silla"}
            </h2>
            <p className="mt-1 text-sm text-primary">
              Silla #{modalSeat.id} · {STADIUM_ZONES[modalSeat.zoneId].shortName}
            </p>

            {modalError ? <p className="mt-3 text-sm text-rose-300">{modalError}</p> : null}

            <div className="mt-4 space-y-3">
              <input
                placeholder="Nombre completo"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="h-10 w-full rounded-lg border border-white/15 bg-rz-cream px-3 text-sm text-black"
              />
              <input
                placeholder="Cédula"
                value={form.documentId}
                onChange={(e) => setForm((f) => ({ ...f, documentId: e.target.value }))}
                className="h-10 w-full rounded-lg border border-white/15 bg-rz-cream px-3 text-sm text-black"
              />
              <input
                placeholder="Celular"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="h-10 w-full rounded-lg border border-white/15 bg-rz-cream px-3 text-sm text-black"
              />
              {!isEdit ? (
                <input
                  placeholder="Correo (opcional)"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-white/15 bg-rz-cream px-3 text-sm text-black"
                />
              ) : (
                <div>
                  <label className="text-xs text-muted-foreground">Número de silla (para mover)</label>
                  <input
                    type="number"
                    value={form.newSeatNumber}
                    onChange={(e) => setForm((f) => ({ ...f, newSeatNumber: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-rz-cream px-3 text-sm text-black"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setModalSeat(null)} disabled={submitting}>
                Cancelar
              </Button>
              {isEdit ? (
                <Button type="button" variant="outline" onClick={handleRemove} disabled={submitting} className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10">
                  Eliminar asignación
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={isEdit ? handleUpdate : handleAssign}
                disabled={submitting || !form.fullName.trim() || !form.documentId.trim() || !form.phone.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 sm:flex-1"
              >
                {submitting ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

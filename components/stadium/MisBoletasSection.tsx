"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2, MapPin, Ticket } from "lucide-react";
import { useFanAuth } from "@/components/auth/FanAuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { STADIUM_ZONES } from "@/lib/stadium-seating";

type MyPurchase = {
  id: string;
  zoneId: string;
  ticketCount: number;
  createdAt: string;
  opponent: string;
  competition: string;
  venue: string;
  matchDate: string | null;
  kickoffTime: string | null;
};

function formatMatchDate(matchDate: string | null, kickoffTime: string | null): string {
  if (!matchDate) return "";
  const label = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bogota",
  }).format(new Date(`${matchDate}T12:00:00`));
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
  if (!kickoffTime) return capitalized;
  const [h, m] = kickoffTime.split(":").map(Number);
  const period = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${capitalized} — ${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function tribunaLabel(zoneId: string): string {
  if (zoneId === "general") return "General";
  return STADIUM_ZONES[zoneId as keyof typeof STADIUM_ZONES]?.shortName ?? "Catedral";
}

function PurchaseCard({ purchase }: { purchase: MyPurchase }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-[#18181B]/90 p-5">
      <p className="font-heading text-lg uppercase text-white">Zipaquirá F.C. vs {purchase.opponent}</p>
      <p className="flex items-center gap-2 text-sm text-primary">
        <CalendarDays className="size-4 shrink-0" />
        {formatMatchDate(purchase.matchDate, purchase.kickoffTime)}
      </p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0" />
        {purchase.venue}
      </p>
      <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-xs uppercase tracking-wide text-white/70">
          {tribunaLabel(purchase.zoneId)} · {purchase.ticketCount}{" "}
          {purchase.ticketCount === 1 ? "boleta" : "boletas"}
        </span>
        <a
          href={`/api/boletas/${purchase.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-primary hover:underline"
        >
          <Ticket className="size-4" />
          Ver boleta
        </a>
      </div>
    </div>
  );
}

function MisBoletasList() {
  const { getAuthHeaders } = useFanAuth();
  const [purchases, setPurchases] = useState<MyPurchase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/boletas/mine", { headers });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "No pudimos cargar tus boletas.");
          return;
        }
        setPurchases(data.purchases ?? []);
      } catch {
        setError("Error de conexión. Recarga la página.");
      }
    }
    load();
  }, [getAuthHeaders]);

  if (error) {
    return <p className="py-20 text-center text-sm text-rose-300">{error}</p>;
  }

  if (purchases === null) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Todavía no has comprado ninguna boleta.
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {purchases.map((p) => (
        <PurchaseCard key={p.id} purchase={p} />
      ))}
    </div>
  );
}

export function MisBoletasSection() {
  const { user, loading } = useFanAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center text-white">
        <Ticket className="mb-4 size-12 text-primary" />
        <h1 className="font-heading text-2xl uppercase">Inicia sesión para ver tus boletas</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Usa la misma cuenta de Google con la que compraste tu boleta.
        </p>
        <GoogleSignInButton
          nextPath="/boletas/mis-boletas"
          label="Continuar con Google"
          fullWidth
          className="mt-6 max-w-xs"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl uppercase text-white sm:text-3xl">Mis boletas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Las boletas que has comprado con {user.email}.
      </p>
      <MisBoletasList />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2, MapPin, Ticket } from "lucide-react";
import { StadiumOverviewSelector } from "@/components/stadium/StadiumOverviewSelector";

type MatchOption = {
  id: string;
  ticket_label: string;
  opponent: string;
  match_date: string;
  kickoff_time: string | null;
  venue: string;
};

function formatMatchDate(matchDate: string, kickoffTime: string | null): string {
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

export function MatchSelectorSection({ userEmail }: { userEmail: string }) {
  const [matches, setMatches] = useState<MatchOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MatchOption | null>(null);

  useEffect(() => {
    fetch("/api/matches/upcoming")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setMatches(data.matches ?? []);
      })
      .catch(() => setError("Error de conexión. Recarga la página."));
  }, []);

  if (selected) {
    return <StadiumOverviewSelector matchLabel={selected.ticket_label} userEmail={userEmail} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl uppercase text-white sm:text-3xl">Elige tu partido</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Estos son los próximos partidos con venta de boletas en línea.
      </p>

      {error ? (
        <p className="mt-10 text-center text-sm text-rose-300">{error}</p>
      ) : matches === null ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : matches.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No hay partidos con venta de boletas abierta en este momento.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => setSelected(match)}
              className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-[#18181B]/90 p-5 text-left transition-colors hover:border-primary/50 hover:bg-[#18181B]"
            >
              <p className="font-heading text-lg uppercase text-white">
                Zipaquirá F.C. vs {match.opponent}
              </p>
              <p className="flex items-center gap-2 text-sm text-primary">
                <CalendarDays className="size-4" />
                {formatMatchDate(match.match_date, match.kickoff_time)}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {match.venue}
              </p>
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                <Ticket className="size-4" />
                Comprar boleta
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useFanAuth } from "@/components/auth/FanAuthProvider";
import { Button } from "@/components/ui/button";
import { playerShortName } from "@/lib/match-utils";
import type { MatchDisplay } from "@/lib/types/match";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type PlayerRatingPanelProps = {
  match: MatchDisplay;
};

const RATING_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function PlayerRatingPanel({ match }: PlayerRatingPanelProps) {
  const router = useRouter();
  const { user, loading: authLoading, getAuthHeaders } = useFanAuth();

  const [draft, setDraft] = useState<Record<string, number>>({});
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadMyRatings = useCallback(async () => {
    setLoadingVotes(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/ratings?matchId=${match.id}`, {
        headers: await getAuthHeaders(),
      });
      if (res.status === 401) {
        setDraft({});
        return;
      }
      if (!res.ok) throw new Error("No pudimos cargar tus votos.");
      const data = (await res.json()) as { ratings: Record<string, number> };
      setDraft(data.ratings ?? {});
    } catch {
      setSaveError("No pudimos cargar tus calificaciones.");
    } finally {
      setLoadingVotes(false);
    }
  }, [match.id, getAuthHeaders]);

  useEffect(() => {
    if (user) {
      void loadMyRatings();
    } else {
      setDraft({});
    }
  }, [user, loadMyRatings]);

  function setPlayerRating(playerId: string, rating: number) {
    setDraft((prev) => ({ ...prev, [playerId]: rating }));
    setSaveMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const ratings = Object.entries(draft).map(([playerId, rating]) => ({
      playerId,
      rating,
    }));

    if (!ratings.length) {
      setSaveError("Califica al menos un jugador antes de guardar.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ matchId: match.id, ratings }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al guardar.");

      setSaveMessage("¡Listo! Tus calificaciones ya suman al promedio de la hinchada.");
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  const ratedCount = Object.keys(draft).length;
  const starters = match.squad.filter((p) => p.is_starter).length;
  const bench = match.squad.filter((p) => !p.is_starter).length;

  return (
    <div className="min-w-0 rounded-xl border border-primary/20 bg-primary/[0.06] p-4 sm:rounded-2xl sm:p-5 md:p-6">
      <h4 className="font-heading text-base uppercase tracking-wide text-white sm:text-lg">
        Califica a los jugadores
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-3">
        Ponle nota del 1 al 10 a cada convocado. Un voto por hincha por jugador; puedes cambiar tu
        nota cuando quieras.
      </p>

      <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 sm:px-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Convocados</p>
        <p className="mt-1 font-heading text-2xl text-white">{match.squad.length}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {starters} titulares · {bench} suplentes
          {user ? ` · ${ratedCount} calificados por ti` : ""}
        </p>
      </div>

      {authLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Verificando sesión…
        </div>
      ) : !user ? (
        <p className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-sm text-muted-foreground">
          Pulsa <span className="font-semibold text-primary">Entrar con Google</span> arriba en el
          menú para calificar a los jugadores.
        </p>
      ) : (
        <>
          {loadingVotes ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Cargando tus votos…
            </div>
          ) : (
            <ul className="mt-5 max-h-[min(28rem,55dvh)] space-y-2.5 overflow-y-auto overscroll-contain pr-0.5 sm:mt-6 sm:max-h-[28rem] sm:space-y-3 sm:pr-1">
              {match.squad.map((entry) => {
                const selected = draft[entry.player.id];
                return (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-white/[0.08] bg-[#121215]/60 p-3 sm:p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          <span className="mr-2 font-heading text-primary">
                            #{entry.player.jersey_number}
                          </span>
                          {playerShortName(entry.player.full_name)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {entry.is_starter ? "Titular" : "Suplente"}
                          {entry.avg_rating != null
                            ? ` · Prom. ${entry.avg_rating.toFixed(1)} (${entry.vote_count})`
                            : ""}
                        </p>
                      </div>
                      {selected != null ? (
                        <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                          Tu nota: {selected}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-5 gap-1 sm:flex sm:flex-wrap sm:gap-1">
                      {RATING_SCALE.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPlayerRating(entry.player.id, value)}
                          className={cn(
                            "flex h-9 items-center justify-center rounded-md text-xs font-bold transition-colors sm:size-9",
                            selected === value
                              ? "bg-primary text-primary-foreground"
                              : "border border-white/10 bg-white/[0.04] text-white/70 hover:border-primary/40 hover:text-primary"
                          )}
                          aria-label={`Nota ${value} para ${entry.player.full_name}`}
                          aria-pressed={selected === value}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5 space-y-2">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loadingVotes}
              className="h-11 w-full text-xs font-bold uppercase tracking-wide"
            >
              {saving ? "Guardando…" : "Guardar calificaciones"}
            </Button>
            {saveMessage ? <p className="text-sm text-primary">{saveMessage}</p> : null}
            {saveError ? <p className="text-sm text-red-400">{saveError}</p> : null}
          </div>
        </>
      )}
    </div>
  );
}

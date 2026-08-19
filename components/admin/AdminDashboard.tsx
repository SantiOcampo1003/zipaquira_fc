"use client";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useFanAuth } from "@/components/auth/FanAuthProvider";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/supabase-browser";
import {
  FORMATION_OPTIONS,
  defaultPitchSlot,
  getFormationSlotIds,
  hasDuplicateStarterSlots,
  normalizeStarterSlots,
  remapPitchSlot,
} from "@/lib/formations";
import type { PlayerRow } from "@/lib/types/match";
import { cn } from "@/lib/utils";
import { Award, Loader2, LogOut, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AdminMatch = {
  id: string;
  opponent: string;
  match_date: string;
  kickoff_time: string | null;
  venue: string;
  competition: string;
  is_home: boolean;
  goals_for: number | null;
  goals_against: number | null;
  formation: string;
  status: "scheduled" | "played" | "cancelled";
  slug: string;
  is_featured: boolean;
  squad_count?: number;
};

type SquadDraftItem = {
  player_id: string;
  is_starter: boolean;
  pitch_slot: string | null;
  bench_order: number | null;
};

type MvpLeaderboardEntry = {
  player_id: string;
  avg_rating: number;
  vote_count: number;
  player: PlayerRow;
};

type MvpAdminData = {
  opponent: string;
  published: {
    player: PlayerRow;
    avg_rating: number;
    vote_count: number;
    published_at: string;
  } | null;
  leaderboard: MvpLeaderboardEntry[];
  total_votes: number;
  total_voters: number;
};

type Tab = "jugadores" | "partidos" | "convocatoria";

const POSITIONS = ["GK", "DF", "MF", "FW"] as const;

type MatchFormState = {
  opponent: string;
  match_date: string;
  kickoff_time: string;
  venue: string;
  competition: string;
  is_home: boolean;
  formation: string;
  status: "scheduled" | "played" | "cancelled";
  goals_for: string;
  goals_against: string;
  is_featured: boolean;
};

const emptyMatchForm: MatchFormState = {
  opponent: "",
  match_date: "",
  kickoff_time: "16:00",
  venue: "Estadio Municipal de Zipaquirá",
  competition: "Amistoso",
  is_home: true,
  formation: "4-3-3",
  status: "scheduled" as MatchFormState["status"],
  goals_for: "",
  goals_against: "",
  is_featured: true,
};

function matchToForm(m: AdminMatch): MatchFormState {
  return {
    opponent: m.opponent,
    match_date: m.match_date,
    kickoff_time: m.kickoff_time?.slice(0, 5) ?? "16:00",
    venue: m.venue,
    competition: m.competition,
    is_home: m.is_home,
    formation: m.formation,
    status: m.status,
    goals_for: m.goals_for != null ? String(m.goals_for) : "",
    goals_against: m.goals_against != null ? String(m.goals_against) : "",
    is_featured: m.is_featured,
  };
}

export function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useFanAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [tab, setTab] = useState<Tab>("partidos");
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [matchForm, setMatchForm] = useState<MatchFormState>(emptyMatchForm);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [squadMatchId, setSquadMatchId] = useState("");
  const [squadDraft, setSquadDraft] = useState<SquadDraftItem[]>([]);
  const [mvpData, setMvpData] = useState<MvpAdminData | null>(null);
  const [mvpLoading, setMvpLoading] = useState(false);
  const [mvpWorking, setMvpWorking] = useState(false);

  const checkAdmin = useCallback(async () => {
    const res = await adminFetch("/api/admin/me");
    setIsAdmin(res.ok);
    return res.ok;
  }, []);

  const loadPlayers = useCallback(async () => {
    const res = await adminFetch("/api/admin/players");
    if (!res.ok) throw new Error("Error cargando jugadores");
    const data = (await res.json()) as { players: PlayerRow[] };
    setPlayers(data.players);
  }, []);

  const loadMatches = useCallback(async () => {
    const res = await adminFetch("/api/admin/matches");
    if (!res.ok) throw new Error("Error cargando partidos");
    const data = (await res.json()) as { matches: AdminMatch[] };
    setMatches(data.matches);
    setSquadMatchId((current) => {
      if (current && data.matches.some((m) => m.id === current)) return current;
      const featured = data.matches.find((m) => m.is_featured);
      return featured?.id ?? data.matches[0]?.id ?? "";
    });
  }, []);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    setErrorMsg(null);
    try {
      await Promise.all([loadPlayers(), loadMatches()]);
    } catch {
      setErrorMsg("No pudimos cargar los datos.");
    } finally {
      setLoadingData(false);
    }
  }, [loadPlayers, loadMatches]);

  const loadSquad = useCallback(async (matchId: string) => {
    if (!matchId) return;
    const res = await adminFetch(`/api/admin/matches/${matchId}/squad`);
    if (!res.ok) throw new Error("Error cargando convocatoria");
    const data = (await res.json()) as {
      squad: Array<{
        player_id: string;
        is_starter: boolean;
        pitch_slot: string | null;
        bench_order: number | null;
      }>;
    };
    const formation =
      matches.find((m) => m.id === matchId)?.formation ?? "4-3-3";
    setSquadDraft(
      normalizeStarterSlots(
        data.squad.map((s) => ({
          player_id: s.player_id,
          is_starter: s.is_starter,
          pitch_slot:
            s.is_starter && s.pitch_slot
              ? remapPitchSlot(s.pitch_slot, formation)
              : s.pitch_slot,
          bench_order: s.bench_order,
          player: players.find((p) => p.id === s.player_id),
        })),
        formation
      ).map(({ player_id, is_starter, pitch_slot, bench_order }) => ({
        player_id,
        is_starter,
        pitch_slot,
        bench_order,
      }))
    );
  }, [matches, players]);

  const loadMvpStats = useCallback(async (matchId: string) => {
    if (!matchId) return;
    setMvpLoading(true);
    try {
      const res = await adminFetch(`/api/admin/matches/${matchId}/mvp`);
      if (!res.ok) {
        setMvpData(null);
        return;
      }
      setMvpData((await res.json()) as MvpAdminData);
    } catch {
      setMvpData(null);
    } finally {
      setMvpLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(null);
      return;
    }
    void checkAdmin();
  }, [user, checkAdmin]);

  useEffect(() => {
    if (isAdmin) void loadAll();
  }, [isAdmin, loadAll]);

  useEffect(() => {
    if (isAdmin && squadMatchId && tab === "convocatoria") {
      void loadSquad(squadMatchId).catch(() => setErrorMsg("No pudimos cargar la convocatoria."));
      void loadMvpStats(squadMatchId);
    }
  }, [isAdmin, squadMatchId, tab, loadSquad, loadMvpStats]);

  async function handleSignOut() {
    await signOut();
    setIsAdmin(null);
  }

  async function savePlayer(player: PlayerRow) {
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await adminFetch("/api/admin/players", {
      method: "PATCH",
      body: JSON.stringify({
        id: player.id,
        full_name: player.full_name,
        jersey_number: player.jersey_number,
        position: player.position,
        position_detail: player.position_detail,
        is_active: player.is_active,
      }),
    });
    if (!res.ok) {
      setErrorMsg("No pudimos guardar el jugador.");
      return;
    }
    setStatusMsg(`Guardado: ${player.full_name}`);
    await loadPlayers();
  }

  function startEditMatch(match: AdminMatch) {
    setEditingMatchId(match.id);
    setMatchForm(matchToForm(match));
    setStatusMsg(null);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditMatch() {
    setEditingMatchId(null);
    setMatchForm(emptyMatchForm);
  }

  async function saveMatch(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const payload = {
      ...matchForm,
      goals_for: matchForm.goals_for !== "" ? Number(matchForm.goals_for) : null,
      goals_against: matchForm.goals_against !== "" ? Number(matchForm.goals_against) : null,
    };

    const res = await adminFetch("/api/admin/matches", {
      method: editingMatchId ? "PATCH" : "POST",
      body: JSON.stringify(editingMatchId ? { id: editingMatchId, ...payload } : payload),
    });

    if (!res.ok) {
      setErrorMsg(editingMatchId ? "No pudimos guardar los cambios." : "No pudimos crear el partido.");
      return;
    }

    setStatusMsg(editingMatchId ? "Partido actualizado." : "Partido creado.");
    setEditingMatchId(null);
    setMatchForm(emptyMatchForm);
    await loadMatches();
  }

  async function setFeatured(matchId: string) {
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await adminFetch(`/api/admin/matches/${matchId}/featured`, { method: "POST" });
    if (!res.ok) {
      setErrorMsg("No pudimos destacar el partido.");
      return;
    }
    setStatusMsg("Partido destacado en la web.");
    await loadMatches();
  }

  function toggleSquadPlayer(playerId: string) {
    const formation =
      matches.find((m) => m.id === squadMatchId)?.formation ?? "4-3-3";
    setSquadDraft((prev) => {
      const exists = prev.find((s) => s.player_id === playerId);
      if (exists) return prev.filter((s) => s.player_id !== playerId);
      if (prev.length >= 18) return prev;
      const starters = prev.filter((s) => s.is_starter).length;
      const isStarter = starters < 11;
      const usedSlots = prev
        .filter((s) => s.is_starter && s.pitch_slot)
        .map((s) => s.pitch_slot as string);
      return [
        ...prev,
        {
          player_id: playerId,
          is_starter: isStarter,
          pitch_slot: isStarter ? defaultPitchSlot(formation, usedSlots) : null,
          bench_order: isStarter ? null : Math.min(7, prev.filter((s) => !s.is_starter).length + 1),
        },
      ];
    });
  }

  function autoAssignSquadSlots() {
    const formation =
      matches.find((m) => m.id === squadMatchId)?.formation ?? "4-3-3";
    setSquadDraft((prev) =>
      normalizeStarterSlots(
        prev.map((s) => ({
          ...s,
          player: players.find((p) => p.id === s.player_id),
        })),
        formation
      ).map(({ player_id, is_starter, pitch_slot, bench_order }) => ({
        player_id,
        is_starter,
        pitch_slot,
        bench_order,
      }))
    );
    setStatusMsg("Posiciones repartidas según la formación. Pulsa Guardar convocatoria.");
  }

  function updateSquadItem(playerId: string, patch: Partial<SquadDraftItem>) {
    setSquadDraft((prev) =>
      prev.map((s) => (s.player_id === playerId ? { ...s, ...patch } : s))
    );
  }

  async function importSquadFrom(sourceMatchId: string) {
    if (!squadMatchId || sourceMatchId === squadMatchId) return;
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await adminFetch(`/api/admin/matches/${sourceMatchId}/squad`);
    if (!res.ok) {
      setErrorMsg("No pudimos copiar la convocatoria.");
      return;
    }
    const data = (await res.json()) as {
      squad: Array<{
        player_id: string;
        is_starter: boolean;
        pitch_slot: string | null;
        bench_order: number | null;
      }>;
    };
    const formation =
      matches.find((m) => m.id === squadMatchId)?.formation ?? "4-3-3";
    setSquadDraft(
      normalizeStarterSlots(
        data.squad.map((s) => ({
          player_id: s.player_id,
          is_starter: s.is_starter,
          pitch_slot:
            s.is_starter && s.pitch_slot
              ? remapPitchSlot(s.pitch_slot, formation)
              : s.pitch_slot,
          bench_order: s.bench_order,
          player: players.find((p) => p.id === s.player_id),
        })),
        formation
      ).map(({ player_id, is_starter, pitch_slot, bench_order }) => ({
        player_id,
        is_starter,
        pitch_slot,
        bench_order,
      }))
    );
    setStatusMsg("Convocatoria copiada. Revisa posiciones y pulsa Guardar.");
  }

  async function saveSquad() {
    if (!squadMatchId) return;
    const selected = matches.find((m) => m.id === squadMatchId);
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await adminFetch(`/api/admin/matches/${squadMatchId}/squad`, {
      method: "PUT",
      body: JSON.stringify({ squad: squadDraft }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setErrorMsg(data.error ?? "No pudimos guardar la convocatoria.");
      return;
    }
    if (selected?.is_featured) {
      setStatusMsg("Convocatoria guardada. Ya se ve en la web.");
    } else {
      setStatusMsg(
        "Convocatoria guardada en este partido. Destácala en Partidos o cópiala al partido ★ de la web."
      );
    }
    await loadMatches();
  }

  async function publishMvp() {
    if (!squadMatchId) return;
    setMvpWorking(true);
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await adminFetch(`/api/admin/matches/${squadMatchId}/mvp`, { method: "POST" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setErrorMsg(data.error ?? "No pudimos calcular el MVP.");
      setMvpWorking(false);
      return;
    }
    const data = (await res.json()) as { mvp: MvpAdminData["published"] };
    setStatusMsg(
      `MVP publicado: #${data.mvp?.player.jersey_number} ${data.mvp?.player.full_name} (${data.mvp?.avg_rating.toFixed(1)})`
    );
    await loadMvpStats(squadMatchId);
    setMvpWorking(false);
  }

  async function clearMvp() {
    if (!squadMatchId) return;
    setMvpWorking(true);
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await adminFetch(`/api/admin/matches/${squadMatchId}/mvp`, { method: "DELETE" });
    if (!res.ok) {
      setErrorMsg("No pudimos quitar el MVP de la web.");
      setMvpWorking(false);
      return;
    }
    setStatusMsg("MVP retirado de la web.");
    await loadMvpStats(squadMatchId);
    setMvpWorking(false);
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
        Cargando…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-white/[0.08] bg-[#121215] p-6">
        <h1 className="font-heading text-2xl uppercase tracking-wide text-white">Admin Zipaquirá</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inicia sesión con Google usando <strong className="text-white/90">santi.720001@gmail.com</strong>.
        </p>
        <div className="mt-6">
          <GoogleSignInButton nextPath="/admin" label="Entrar con Google" fullWidth />
        </div>
        <Link href="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-primary">
          ← Volver al sitio
        </Link>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-[#121215] p-6 text-center">
        <p className="text-white">Correo: {user.email}</p>
        <p className="mt-3 text-sm text-red-400">No tienes permisos de administrador.</p>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-6 text-sm text-muted-foreground hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  if (isAdmin === null || loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
        Verificando acceso…
      </div>
    );
  }

  const selectedSquadMatch = matches.find((m) => m.id === squadMatchId);
  const squadFormation = selectedSquadMatch?.formation ?? "4-3-3";
  const squadPitchSlots = getFormationSlotIds(squadFormation);
  const squadSources = matches.filter(
    (m) => m.id !== squadMatchId && (m.squad_count ?? 0) > 0
  );
  const duplicateSlots = hasDuplicateStarterSlots(squadDraft);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl uppercase tracking-wide text-white">Panel admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/#partidos"
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 hover:border-primary/40 hover:text-primary"
          >
            Ver sitio
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-white"
          >
            <LogOut className="size-3.5" aria-hidden />
            Salir
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(["partidos", "jugadores", "convocatoria"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide",
              tab === t
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-white/10 text-white/60 hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {statusMsg ? <p className="mt-4 text-sm text-primary">{statusMsg}</p> : null}
      {errorMsg ? <p className="mt-4 text-sm text-red-400">{errorMsg}</p> : null}

      {tab === "partidos" ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <form
            onSubmit={saveMatch}
            className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#121215] p-5"
          >
            <h2 className="font-heading text-lg uppercase text-white">
              {editingMatchId ? "Editar partido" : "Nuevo partido"}
            </h2>
            {(
              [
                ["opponent", "Rival"],
                ["match_date", "Fecha (YYYY-MM-DD)", "date"],
                ["kickoff_time", "Hora"],
                ["venue", "Sede"],
                ["competition", "Competición"],
              ] as const
            ).map(([key, label, type]) => (
              <label key={key} className="block text-xs text-muted-foreground">
                {label}
                <input
                  type={type ?? "text"}
                  value={matchForm[key as keyof typeof matchForm] as string}
                  onChange={(e) =>
                    setMatchForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#F4EFE5] px-3 text-sm text-black"
                  required={key !== "kickoff_time"}
                />
              </label>
            ))}
            <label className="block text-xs text-muted-foreground">
              Formación
              <select
                value={matchForm.formation}
                onChange={(e) => setMatchForm((f) => ({ ...f, formation: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#18181B] px-3 text-sm text-white"
              >
                {FORMATION_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              Estado
              <select
                value={matchForm.status}
                onChange={(e) =>
                  setMatchForm((f) => ({
                    ...f,
                    status: e.target.value as typeof matchForm.status,
                  }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#18181B] px-3 text-sm text-white"
              >
                <option value="scheduled">Programado</option>
                <option value="played">Jugado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-muted-foreground">
                Goles Zipa
                <input
                  type="number"
                  min={0}
                  value={matchForm.goals_for}
                  onChange={(e) => setMatchForm((f) => ({ ...f, goals_for: e.target.value }))}
                  placeholder="—"
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#F4EFE5] px-3 text-sm text-black"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Goles rival
                <input
                  type="number"
                  min={0}
                  value={matchForm.goals_against}
                  onChange={(e) => setMatchForm((f) => ({ ...f, goals_against: e.target.value }))}
                  placeholder="—"
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#F4EFE5] px-3 text-sm text-black"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={matchForm.is_home}
                onChange={(e) => setMatchForm((f) => ({ ...f, is_home: e.target.checked }))}
              />
              Local
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={matchForm.is_featured}
                onChange={(e) => setMatchForm((f) => ({ ...f, is_featured: e.target.checked }))}
              />
              Mostrar destacado en la web
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" className="h-11 flex-1 min-w-[8rem]">
                {editingMatchId ? "Guardar cambios" : "Crear partido"}
              </Button>
              {editingMatchId ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={cancelEditMatch}
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>

          <div className="space-y-3">
            <h2 className="font-heading text-lg uppercase text-white">Partidos ({matches.length})</h2>
            {matches.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl border bg-[#121215] p-4",
                  editingMatchId === m.id
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-white/[0.08]"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">
                      vs {m.opponent}
                      {m.is_featured ? (
                        <Star className="ml-1 inline size-4 fill-primary text-primary" aria-hidden />
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.match_date} · {m.competition} · {m.squad_count ?? 0} convocados
                      {m.status !== "scheduled" ? ` · ${m.status}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-[10px] uppercase"
                      onClick={() => startEditMatch(m)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-[10px] uppercase"
                      onClick={() => {
                        setSquadMatchId(m.id);
                        setTab("convocatoria");
                      }}
                    >
                      Convocatoria
                    </Button>
                    {!m.is_featured ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-[10px] uppercase"
                        onClick={() => void setFeatured(m.id)}
                      >
                        Destacar
                      </Button>
                    ) : (
                      <span className="inline-flex h-8 items-center text-[10px] font-bold uppercase text-primary">
                        En la web
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "jugadores" ? (
        <div className="mt-8 space-y-3">
          <h2 className="font-heading text-lg uppercase text-white">Plantel ({players.length})</h2>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto">
            {players.map((p) => (
              <PlayerEditRow
                key={p.id}
                player={p}
                onChange={(updated) =>
                  setPlayers((list) => list.map((x) => (x.id === updated.id ? updated : x)))
                }
                onSave={() => void savePlayer(p)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "convocatoria" ? (
        <div className="mt-8 space-y-4">
          <label className="block text-sm text-muted-foreground">
            Partido
            <select
              value={squadMatchId}
              onChange={(e) => setSquadMatchId(e.target.value)}
              className="mt-1 h-10 w-full max-w-md rounded-lg border border-white/10 bg-[#18181B] px-3 text-sm text-white"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.is_featured ? "★ " : ""}vs {m.opponent} — {m.match_date} ({m.formation})
                </option>
              ))}
            </select>
          </label>

          {selectedSquadMatch?.is_featured ? (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              Este partido es el que ven los hinchas en la web (★ destacado).
            </p>
          ) : (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Este partido <strong>no</strong> es el destacado en la web. La hinchada no verá esta
              convocatoria hasta que lo marques como ★ en Partidos o copies la alineación al partido
              correcto.
            </p>
          )}

          {squadSources.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Copiar convocatoria desde:</span>
              {squadSources.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-[10px] uppercase"
                  onClick={() => void importSquadFrom(m.id)}
                >
                  vs {m.opponent} ({m.squad_count})
                </Button>
              ))}
            </div>
          ) : null}

          {duplicateSlots ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Varios titulares comparten la misma posición en cancha. Usa{" "}
              <strong>Repartir posiciones</strong> o asígnalas manualmente antes de guardar.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={autoAssignSquadSlots}>
              Repartir posiciones ({squadFormation})
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Formación: <strong className="text-white/90">{squadFormation}</strong> · Convocados:{" "}
            {squadDraft.length}/18 · Titulares: {squadDraft.filter((s) => s.is_starter).length}/11 ·
            Suplentes: {squadDraft.filter((s) => !s.is_starter).length}/7
          </p>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto rounded-xl border border-white/[0.08] p-3">
            {players.map((p) => {
              const inSquad = squadDraft.find((s) => s.player_id === p.id);
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-white/[0.06] bg-[#121215] p-3"
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!inSquad}
                      onChange={() => toggleSquadPlayer(p.id)}
                    />
                    <span className="text-sm text-white">
                      #{p.jersey_number} {p.full_name}
                    </span>
                  </label>
                  {inSquad ? (
                    <div className="mt-2 flex flex-wrap gap-2 pl-6">
                      <label className="text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={inSquad.is_starter}
                          onChange={(e) => {
                            const usedSlots = squadDraft
                              .filter((s) => s.is_starter && s.player_id !== p.id && s.pitch_slot)
                              .map((s) => s.pitch_slot as string);
                            updateSquadItem(p.id, {
                              is_starter: e.target.checked,
                              pitch_slot: e.target.checked
                                ? defaultPitchSlot(squadFormation, usedSlots)
                                : null,
                              bench_order: e.target.checked ? null : 1,
                            });
                          }}
                        />{" "}
                        Titular
                      </label>
                      {inSquad.is_starter ? (
                        <select
                          value={
                            inSquad.pitch_slot ??
                            defaultPitchSlot(
                              squadFormation,
                              squadDraft
                                .filter((s) => s.is_starter && s.pitch_slot)
                                .map((s) => s.pitch_slot as string)
                            )
                          }
                          onChange={(e) =>
                            updateSquadItem(p.id, { pitch_slot: e.target.value })
                          }
                          className="rounded border border-white/10 bg-[#18181B] px-2 py-1 text-xs text-white"
                        >
                          {squadPitchSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={inSquad.bench_order ?? 1}
                          onChange={(e) =>
                            updateSquadItem(p.id, { bench_order: Number(e.target.value) })
                          }
                          className="rounded border border-white/10 bg-[#18181B] px-2 py-1 text-xs text-white"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <option key={n} value={n}>
                              Banquillo {n}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Button type="button" onClick={() => void saveSquad()} className="h-11">
            Guardar convocatoria
          </Button>

          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-[#121215] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-heading text-lg uppercase text-white">
                  <Award className="size-5 text-primary" aria-hidden />
                  MVP de la hinchada
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Calcula el jugador mejor calificado y publícalo en la web.
                </p>
              </div>
              {mvpLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
              ) : null}
            </div>

            {mvpData ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-white/90">{mvpData.total_voters}</strong> hincha
                  {mvpData.total_voters === 1 ? "" : "s"} ·{" "}
                  <strong className="text-white/90">{mvpData.total_votes}</strong> calificaciones
                  totales
                </p>

                {mvpData.leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Top calificados
                    </p>
                    {mvpData.leaderboard.map((entry, idx) => (
                      <div
                        key={entry.player_id}
                        className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                      >
                        <span className="text-sm text-white">
                          {idx + 1}. #{entry.player.jersey_number} {entry.player.full_name}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                          <Star className="size-3.5 fill-primary" aria-hidden />
                          {entry.avg_rating.toFixed(1)}
                          <span className="font-normal text-muted-foreground">
                            ({entry.vote_count})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay votos para este partido.
                  </p>
                )}

                {mvpData.published ? (
                  <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                    En la web: #{mvpData.published.player.jersey_number}{" "}
                    {mvpData.published.player.full_name} ·{" "}
                    {mvpData.published.avg_rating.toFixed(1)} ({mvpData.published.vote_count}{" "}
                    votos)
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void publishMvp()}
                    disabled={mvpWorking || mvpData.leaderboard.length === 0}
                    className="h-10"
                  >
                    {mvpWorking ? "Calculando…" : "Calcular y publicar MVP"}
                  </Button>
                  {mvpData.published ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void clearMvp()}
                      disabled={mvpWorking}
                      className="h-10"
                    >
                      Quitar de la web
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : mvpLoading ? null : (
              <p className="mt-4 text-sm text-muted-foreground">
                Ejecuta la migración <code className="text-white/80">006_match_mvp.sql</code> en
                Supabase si no cargan los datos de MVP.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlayerEditRow({
  player,
  onChange,
  onSave,
}: {
  player: PlayerRow;
  onChange: (p: PlayerRow) => void;
  onSave: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-xl border border-white/[0.08] bg-[#121215] p-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="grid gap-2 sm:grid-cols-4">
        <input
          value={player.full_name}
          onChange={(e) => onChange({ ...player, full_name: e.target.value })}
          className="h-9 rounded-lg border border-white/10 bg-[#F4EFE5] px-2 text-sm text-black sm:col-span-2"
        />
        <input
          type="number"
          value={player.jersey_number}
          onChange={(e) => onChange({ ...player, jersey_number: Number(e.target.value) })}
          className="h-9 rounded-lg border border-white/10 bg-[#F4EFE5] px-2 text-sm text-black"
        />
        <select
          value={player.position}
          onChange={(e) =>
            onChange({ ...player, position: e.target.value as PlayerRow["position"] })
          }
          className="h-9 rounded-lg border border-white/10 bg-[#18181B] px-2 text-sm text-white"
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <input
          value={player.position_detail ?? ""}
          onChange={(e) => onChange({ ...player, position_detail: e.target.value })}
          placeholder="Detalle posición"
          className="h-9 rounded-lg border border-white/10 bg-[#F4EFE5] px-2 text-sm text-black sm:col-span-3"
        />
      </div>
      <Button type="button" size="sm" onClick={onSave} className="h-9 shrink-0">
        Guardar
      </Button>
    </div>
  );
}

"use client";

import { isBetssonMatch } from "@/lib/betsson";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Loader2, MapPin, ShieldAlert, Ticket } from "lucide-react";
import { useFanAuth } from "@/components/auth/FanAuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { BoletaCheckoutSection } from "@/components/stadium/BoletaCheckoutSection";
import { adminFetch } from "@/lib/supabase-browser";
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

/** Afiche oficial por rival (public/images/partidos). Sin afiche → tarjeta de texto. */
function posterFor(opponent: string): string | null {
  const o = opponent
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (o.includes("caqueta")) return "/images/partidos/zipa-vs-caqueta.jpg";
  if (o.includes("guajira")) return "/images/partidos/zipa-vs-guajira.jpg";
  return null;
}

type SaleMode = "venta" | "cortesia" | "2x1" | "betsson";

const MODE_PATH: Record<SaleMode, string> = { venta: "/boletas", cortesia: "/cortesias", "2x1": "/2x1", betsson: "/boletas" };

/**
 * `forcedMode`: páginas exclusivas de admin (/cortesias, /2x1). Sin él (/boletas)
 * el público compra normal, y un admin ve primero 3 botones para elegir cómo vender.
 */
export function MatchSelectorSection({ forcedMode }: { forcedMode?: "cortesia" | "2x1" }) {
  const basePath = MODE_PATH[forcedMode ?? "venta"];
  const courtesy = forcedMode === "cortesia";
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pickedMode, setPickedMode] = useState<SaleMode | null>(null);
  const { user, loading: authLoading } = useFanAuth();
  const searchParams = useSearchParams();
  const [matches, setMatches] = useState<MatchOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MatchOption | null>(null);

  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      setIsAdmin(null);
      return;
    }
    let cancelled = false;
    adminFetch("/api/admin/me")
      .then((res) => !cancelled && setIsAdmin(res.ok))
      .catch(() => !cancelled && setIsAdmin(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  // Al volver de Google, ?partido=<id> restaura el partido que eligió.
  const restoreId = searchParams.get("partido");
  useEffect(() => {
    if (selected || !restoreId || !matches) return;
    const found = matches.find((m) => m.id === restoreId);
    if (found) setSelected(found);
  }, [matches, restoreId, selected]);

  if (selected) {
    if (authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center text-white">
          <Ticket className="mb-4 size-12 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Zipaquirá F.C. vs {selected.opponent}
          </p>
          <h1 className="mt-2 font-heading text-2xl uppercase">Inicia sesión para continuar</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {forcedMode ? "Inicia sesión con tu cuenta de administrador para continuar." : "Usa tu cuenta de Google para elegir tu silla en el mapa del estadio y pagar en línea."}
          </p>
          <GoogleSignInButton
            nextPath={`${basePath}?partido=${selected.id}`}
            label="Continuar con Google"
            fullWidth
            className="mt-6 max-w-xs"
          />
          <button
            type="button"
            onClick={() => {
              window.history.replaceState(null, "", basePath);
              setSelected(null);
            }}
            className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Elegir otro partido
          </button>
        </div>
      );
    }

    const goBack = () => {
      window.history.replaceState(null, "", basePath);
      setPickedMode(null);
      setSelected(null);
    };

    // Esperando saber si es admin (o páginas/botones de admin).
    if (isAdmin === null && (forcedMode || userId)) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      );
    }

    if (forcedMode) {
      if (!isAdmin) {
        return (
          <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center text-white">
            <ShieldAlert className="mb-4 size-12 text-rose-400" />
            <h1 className="font-heading text-2xl uppercase">Sin permisos</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Esta página es solo para administradores. Tu cuenta ({user.email}) no tiene acceso.
            </p>
            <button type="button" onClick={goBack} className="mt-5 text-sm text-muted-foreground underline hover:text-white">
              Volver
            </button>
          </div>
        );
      }
      return <BoletaCheckoutSection matchLabel={selected.ticket_label} mode={forcedMode} />;
    }

    if (isAdmin && !pickedMode) {
      const options: { mode: SaleMode; title: string; desc: string }[] = [
        ...(isBetssonMatch(selected.ticket_label)
          ? [{ mode: "betsson" as SaleMode, title: "Betsson", desc: "Entrada gratis con el registro de Betsson (así lo ve el público)." }]
          : []),
        { mode: "venta", title: "Venta normal", desc: "Precio normal ($35.100 por silla), pago por Wompi." },
        { mode: "2x1", title: "Venta 2x1", desc: "Pagas 1 de cada 2 sillas ($35.100), pago por Wompi." },
        { mode: "cortesia", title: "Cortesía", desc: "Sin cobro: la boleta llega directo al correo." },
      ];
      return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Zipaquirá F.C. vs {selected.opponent}
          </p>
          <h1 className="mt-2 font-heading text-2xl uppercase">¿Cómo quieres vender?</h1>
          <div className="mt-6 flex flex-col gap-3">
            {options.map((o) => (
              <button
                key={o.mode}
                type="button"
                onClick={() => setPickedMode(o.mode)}
                className="rounded-2xl border border-primary/25 bg-[#18181B]/90 p-5 text-left transition-colors hover:border-primary/60"
              >
                <p className="font-heading text-lg uppercase text-primary">{o.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{o.desc}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={goBack}
            className="mt-5 inline-flex items-center gap-2 self-start text-sm text-muted-foreground transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Elegir otro partido
          </button>
        </div>
      );
    }

    if (pickedMode === "cortesia" || pickedMode === "2x1") {
      return <BoletaCheckoutSection matchLabel={selected.ticket_label} mode={pickedMode} />;
    }

    // Partido patrocinado por Betsson: el público entra con el registro de Betsson (sin Wompi).
    if (pickedMode === "betsson" || (!isAdmin && isBetssonMatch(selected.ticket_label))) {
      return <BoletaCheckoutSection matchLabel={selected.ticket_label} mode="betsson" userEmail={user.email ?? ""} />;
    }

    return <StadiumOverviewSelector matchLabel={selected.ticket_label} userEmail={user.email ?? ""} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl uppercase text-white sm:text-3xl">{courtesy ? "Cortesías — elige el partido" : forcedMode === "2x1" ? "Venta 2x1 — elige el partido" : "Elige tu partido"}</h1>
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
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {matches.map((match) => {
            const poster = posterFor(match.opponent);
            if (poster) {
              return (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => setSelected(match)}
                  aria-label={`Comprar boleta: Zipaquirá F.C. vs ${match.opponent}`}
                  className="group flex w-full max-w-sm flex-col items-center gap-3 text-center"
                >
                  <span className="relative block w-full overflow-hidden rounded-2xl border border-primary/25 shadow-lg transition group-hover:border-primary/60 group-hover:shadow-primary/20">
                    <Image
                      src={poster}
                      alt={`Zipaquirá F.C. vs ${match.opponent}`}
                      width={1288}
                      height={1652}
                      sizes="(min-width: 640px) 384px, 100vw"
                      className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
                      priority
                    />
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                    <Ticket className="size-4" />
                    {courtesy ? "Emitir cortesía" : forcedMode === "2x1" ? "Vender 2x1" : "Comprar boleta"}
                  </span>
                </button>
              );
            }
            return (
            <button
              key={match.id}
              type="button"
              onClick={() => setSelected(match)}
              className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-primary/25 bg-[#18181B]/90 p-5 text-left transition-colors hover:border-primary/50 hover:bg-[#18181B]"
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
                {courtesy ? "Emitir cortesía" : forcedMode === "2x1" ? "Vender 2x1" : "Comprar boleta"}
              </span>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Eye, MapPin, Sparkles } from "lucide-react";
import type { Seat, StadiumZoneId } from "@/lib/stadium-seating";
import { STADIUM_ZONES } from "@/lib/stadium-seating";

type StadiumPerspectiveViewProps = {
  activeZoneId: StadiumZoneId | "all";
  hoveredSeat: Seat | null;
};

export function StadiumPerspectiveView({
  activeZoneId,
  hoveredSeat,
}: StadiumPerspectiveViewProps) {
  const currentZone = hoveredSeat
    ? STADIUM_ZONES[hoveredSeat.zoneId]
    : activeZoneId !== "all"
    ? STADIUM_ZONES[activeZoneId]
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-[#18181B] to-[#0D1510] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-primary" aria-hidden />
          <h4 className="font-heading text-xs uppercase tracking-wider text-white sm:text-sm">
            Simulador de vista hacia la cancha
          </h4>
        </div>
        {hoveredSeat ? (
          <span className="rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Silla {hoveredSeat.id}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {currentZone ? currentZone.shortName : "Vista panorámica"}
          </span>
        )}
      </div>

      {/* Vista gráfica simulada de la cancha */}
      <div className="relative mt-4 h-36 w-full overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-t from-emerald-950/80 via-emerald-900/40 to-slate-950 sm:h-44">
        {/* Gradas y baranda en primer plano */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-end justify-center pb-1">
          <div className="h-1 w-full bg-primary/40 border-t border-primary/60 shadow-[0_-2px_10px_rgba(169,146,89,0.3)]" />
        </div>

        {/* Pista de atletismo */}
        <div className="absolute inset-x-0 bottom-8 h-10 bg-[#8b3127]/60 border-t border-rose-400/20 z-10">
          <div className="h-full w-full opacity-40 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.2)_40px,rgba(255,255,255,0.2)_42px)]" />
        </div>

        {/* Césped y líneas de cancha */}
        <div className="absolute inset-0 bottom-14 flex items-center justify-center">
          <div
            className="relative h-full w-[94%] rounded-lg border-2 border-white/30 shadow-inner overflow-hidden"
            style={{
              background:
                "repeating-linear-gradient(90deg, #0d5c2e 0, #0d5c2e 30px, #0f6c36 30px, #0f6c36 60px)",
            }}
          >
            {/* Línea central */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white/40" />
            {/* Círculo central */}
            <div className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
            {/* Puntos de penal y arcos */}
            <div className="absolute left-0 top-1/2 h-14 w-8 -translate-y-1/2 border-r border-t border-b border-white/40" />
            <div className="absolute right-0 top-1/2 h-14 w-8 -translate-y-1/2 border-l border-t border-b border-white/40" />
          </div>
        </div>

        {/* Ángulo dinámico según la zona */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-15"
          animate={{
            backdropFilter: "none",
            boxShadow:
              hoveredSeat?.zoneId === "verde" || activeZoneId === "verde"
                ? "inset 80px 0 60px -30px rgba(16,185,129,0.2)"
                : hoveredSeat?.zoneId === "roja" || activeZoneId === "roja"
                ? "inset -80px 0 60px -30px rgba(239,68,68,0.2)"
                : "inset 0 0 40px rgba(244,239,229,0.1)",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Marcador del punto de vista */}
        <div
          className="absolute top-3 transition-all duration-300 z-30"
          style={{
            left:
              hoveredSeat?.zoneId === "verde" || activeZoneId === "verde"
                ? "20%"
                : hoveredSeat?.zoneId === "roja" || activeZoneId === "roja"
                ? "80%"
                : "50%",
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-lg backdrop-blur-sm">
            <MapPin className="size-3 text-primary animate-bounce" />
            <span>
              {hoveredSeat ? `Fila ${hoveredSeat.row} · Silla #${hoveredSeat.id}` : "Tu posición"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Sparkles className="size-4 shrink-0 text-primary mt-0.5" />
        <p>
          {hoveredSeat
            ? `Zona ${hoveredSeat.zoneName} · Fila ${hoveredSeat.row} · Silla #${hoveredSeat.id}. ${currentZone?.viewAngle}`
            : currentZone
            ? currentZone.viewAngle
            : "Haz hover o toca cualquier silla en el plano para previsualizar la ubicación exacta y el ángulo de visión."}
        </p>
      </div>
    </div>
  );
}

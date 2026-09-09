"use client";

import { useCallback, useMemo, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { Seat, StadiumZoneId } from "@/lib/stadium-seating";
import {
  formatSeatId,
  formatSeatLabel,
  GRANDSTAND_ROWS,
  ROWS_DISPLAY_ORDER,
  STADIUM_ZONES,
} from "@/lib/stadium-seating";
import { cn } from "@/lib/utils";

/** Tamaño base de cada silla (px) a zoom 100% */
const BASE_SEAT_SIZE = 22;
const BASE_SEAT_GAP = 4;
const ZONE_PADDING = 16;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_DEFAULT = 0.75;
const ZOOM_STEP = 0.05;

function scaledSeatSize(zoom: number) {
  return Math.max(10, Math.round(BASE_SEAT_SIZE * zoom));
}

function scaledSeatGap(zoom: number) {
  return Math.max(2, Math.round(BASE_SEAT_GAP * zoom));
}

function zoneRowWidth(seatCount: number, seatSize: number, seatGap: number): number {
  return seatCount * seatSize + (seatCount - 1) * seatGap + ZONE_PADDING;
}

type StadiumGrandstandMapProps = {
  seats: Seat[];
  selectedSeatIds: string[];
  onSelectSeat: (seat: Seat) => void;
  hoveredSeat: Seat | null;
  setHoveredSeat: (seat: Seat | null) => void;
  activeZoneId: StadiumZoneId | "all";
  setActiveZoneId: (zoneId: StadiumZoneId | "all") => void;
  allowedZoneId?: StadiumZoneId | null;
  selectionEnabled?: boolean;
  abonoCount?: number;
};

export function StadiumGrandstandMap({
  seats,
  selectedSeatIds,
  onSelectSeat,
  hoveredSeat,
  setHoveredSeat,
  activeZoneId,
  setActiveZoneId,
  allowedZoneId = null,
  selectionEnabled = true,
  abonoCount = 1,
}: StadiumGrandstandMapProps) {
  const [zoomLevel, setZoomLevel] = useState(ZOOM_DEFAULT);

  const seatSize = scaledSeatSize(zoomLevel);
  const seatGap = scaledSeatGap(zoomLevel);

  const changeZoom = useCallback(
    (next: number) => {
      setZoomLevel(next);
      setHoveredSeat(null);
    },
    [setHoveredSeat]
  );

  const seatMap = useMemo(() => {
    const map = new Map<string, Seat>();
    seats.forEach((s) => map.set(s.id, s));
    return map;
  }, [seats]);

  const rowSpecs = useMemo(() => {
    const byRow = new Map(GRANDSTAND_ROWS.map((r) => [r.row, r]));
    return ROWS_DISPLAY_ORDER.map((row) => byRow.get(row)!);
  }, []);

  const selectedSeatOrder = useMemo(() => {
    const order = new Map<string, number>();
    selectedSeatIds.forEach((id, index) => order.set(id, index + 1));
    return order;
  }, [selectedSeatIds]);

  const lastSelectedSeat =
    selectedSeatIds.length > 0
      ? seatMap.get(selectedSeatIds[selectedSeatIds.length - 1]) ?? null
      : null;

  const highlightSeat = hoveredSeat ?? lastSelectedSeat;
  const isSelectedHighlight =
    highlightSeat != null &&
    selectedSeatIds.includes(highlightSeat.id) &&
    hoveredSeat == null;

  const mapWidth =
    zoneRowWidth(52, seatSize, seatGap) +
    zoneRowWidth(48, seatSize, seatGap) +
    zoneRowWidth(42, seatSize, seatGap) +
    24 +
    40;

  return (
    <div className="relative flex w-full flex-col rounded-2xl border border-primary/25 bg-[#0e1210] p-3 shadow-2xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveZoneId("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
              activeZoneId === "all"
                ? "border border-primary bg-primary/20 text-primary"
                : "border border-white/10 bg-[#18181B] text-muted-foreground hover:text-white"
            )}
          >
            Toda la tribuna
          </button>
          {(Object.keys(STADIUM_ZONES) as StadiumZoneId[]).map((zoneId) => {
            const zone = STADIUM_ZONES[zoneId];
            return (
              <button
                key={zoneId}
                type="button"
                onClick={() => setActiveZoneId(zoneId)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
                  activeZoneId === zoneId
                    ? `${zone.accentBorder} ${zone.accentBg} text-white ring-1 ring-white/20`
                    : "border border-white/10 bg-[#18181B] text-muted-foreground hover:text-white"
                )}
              >
                <span
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: zone.seatColor }}
                />
                {zone.shortName}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#18181B] p-1">
          <button
            type="button"
            onClick={() => changeZoom(Math.max(zoomLevel - ZOOM_STEP, ZOOM_MIN))}
            disabled={zoomLevel <= ZOOM_MIN}
            className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-[3rem] text-center font-mono text-xs text-muted-foreground">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => changeZoom(Math.min(zoomLevel + ZOOM_STEP, ZOOM_MAX))}
            disabled={zoomLevel >= ZOOM_MAX}
            className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => changeZoom(ZOOM_DEFAULT)}
            className="ml-1 flex size-8 items-center justify-center rounded text-muted-foreground hover:text-white"
            title="Restablecer zoom"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <SeatPreviewPanel
        highlightSeat={highlightSeat}
        isSelectedHighlight={isSelectedHighlight}
        seatsProgress={
          abonoCount > 1
            ? { selected: selectedSeatIds.length, total: abonoCount }
            : null
        }
      />

      <div className="relative mt-4 overflow-hidden rounded-t-xl border-x border-t border-blue-500/30 bg-gradient-to-r from-blue-900 via-sky-700 to-blue-900 px-4 py-2.5 text-center">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white sm:text-sm">
           TRIBUNA CATEDRAL DE SAL · ESTADIO HÉCTOR &quot;EL ZIPA&quot; GONZÁLEZ
        </p>
      </div>

      {/* Scroll horizontal — zoom real (tamaño de sillas), sin transform scale */}
      <div
        className="overflow-x-auto rounded-b-xl border border-white/10 bg-[#0a0c0b] p-4 scrollbar-thin scrollbar-thumb-primary/30"
        onScroll={() => setHoveredSeat(null)}
      >
        <div className="mx-auto w-max pb-2">
          {/* Encabezados de zona alineados con columnas de sillas */}
          <div className="mb-3 flex items-end justify-center gap-3 pl-10">
            {(
              [
                { zoneId: "verde" as const, seats: 52 },
                { zoneId: "blanca" as const, seats: 48 },
                { zoneId: "roja" as const, seats: 42 },
              ] as const
            ).map(({ zoneId, seats: seatCount }) => {
              const z = STADIUM_ZONES[zoneId];
              const width = zoneRowWidth(seatCount, seatSize, seatGap);
              return (
                <div
                  key={zoneId}
                  style={{ width }}
                  className={cn(
                    "shrink-0 rounded-t-lg border-x border-t px-2 py-2 text-center",
                    z.accentBorder,
                    z.accentBg
                  )}
                >
                  <p className="font-heading text-xs font-semibold uppercase text-white">
                    {z.shortName}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {seatCount} sillas por fila
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-0">
            {rowSpecs.map((spec, index) => (
              <div key={spec.row}>
                <GrandstandRow
                  spec={spec}
                  seatMap={seatMap}
                  selectedSeatIds={selectedSeatIds}
                  selectedSeatOrder={selectedSeatOrder}
                  hoveredSeatId={hoveredSeat?.id ?? null}
                  activeZoneId={activeZoneId}
                  allowedZoneId={allowedZoneId}
                  seatSize={seatSize}
                  seatGap={seatGap}
                  selectionEnabled={selectionEnabled}
                  onSelectSeat={onSelectSeat}
                  setHoveredSeat={setHoveredSeat}
                />
                {index < rowSpecs.length - 1 ? <HorizontalPasillo /> : null}
              </div>
            ))}
          </div>

          <div className="mt-5" style={{ width: mapWidth }}>
            <div className="h-1.5 rounded-full bg-primary/60" />
            <div className="mt-2 flex h-8 items-center justify-center rounded bg-[#96372b] text-[10px] font-bold uppercase tracking-widest text-rose-100">
              Pista atlética
            </div>
            <div className="mt-2 flex h-10 items-center justify-center rounded-lg border border-emerald-500/40 bg-gradient-to-b from-emerald-800 to-emerald-950 text-xs font-semibold uppercase tracking-widest text-emerald-200">
              ⚽ Cancha · Fila 1 es la más cercana
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-muted-foreground">
        <LegendItem color="#10B981" label="Verde" />
        <LegendItem color="#F4EFE5" label="Blanca" />
        <LegendItem color="#EF4444" label="Roja" />
        <LegendItem color="#A99259" label="Tu silla" border />
        <LegendItem color="#3f3f46" label="Ocupada" />
        <LegendItem color="#6b5b45" label="Cortesía" striped />
        <span className="text-[10px] text-white/40">Cada cuadrito = 1 silla numerada</span>
      </div>
    </div>
  );
}

function SeatPreviewPanel({
  highlightSeat,
  isSelectedHighlight,
  seatsProgress,
}: {
  highlightSeat: Seat | null;
  isSelectedHighlight: boolean;
  seatsProgress: { selected: number; total: number } | null;
}) {
  const headline = highlightSeat
    ? highlightSeat.status === "courtesy"
      ? "Cortesía · no disponible"
      : isSelectedHighlight
      ? "Silla seleccionada"
      : "Vista previa"
    : null;

  const footnote = highlightSeat
    ? highlightSeat.status === "courtesy"
      ? "Cortesías zona blanca · Fila 4 (#479 – #504)"
      : !isSelectedHighlight
      ? "Toca para confirmar esta silla"
      : "\u00a0"
    : "Toca una silla para ver su número oficial · Desliza horizontalmente el mapa";

  return (
    <div
      className={cn(
        "mt-3 flex min-h-[8.75rem] flex-col items-center justify-center rounded-xl border-2 px-4 py-3 text-center transition-colors duration-150",
        highlightSeat
          ? isSelectedHighlight
            ? "border-primary bg-primary/20 shadow-[0_0_24px_rgba(169,146,89,0.25)]"
            : "border-white/20 bg-white/5"
          : "border-white/10 bg-white/[0.02]"
      )}
    >
      <p
        className={cn(
          "min-h-[1rem] text-[10px] font-semibold uppercase tracking-[0.2em]",
          headline ? "text-muted-foreground" : "text-transparent"
        )}
      >
        {headline ?? "\u00a0"}
      </p>
      {seatsProgress ? (
        <p className="mb-1 font-mono text-xs text-primary/80">
          Abono {seatsProgress.selected} de {seatsProgress.total} · sillas en el mapa
        </p>
      ) : null}
      <p
        className={cn(
          "min-h-[3rem] font-mono text-4xl font-bold leading-none tracking-widest sm:min-h-[3.5rem] sm:text-5xl",
          highlightSeat
            ? highlightSeat.status === "courtesy"
              ? "text-amber-600"
              : "text-primary"
            : "text-transparent"
        )}
      >
        {highlightSeat ? `#${highlightSeat.id}` : "—"}
      </p>
      <p
        className={cn(
          "mt-1 min-h-[1.25rem] text-sm",
          highlightSeat ? "text-rz-cream/90" : "text-transparent"
        )}
      >
        {highlightSeat ? formatSeatLabel(highlightSeat) : "\u00a0"}
      </p>
      <p
        className={cn(
          "mt-1 min-h-[1rem] text-xs",
          highlightSeat?.status === "courtesy"
            ? "text-amber-500/90"
            : highlightSeat && !isSelectedHighlight
            ? "text-muted-foreground"
            : !highlightSeat
            ? "text-muted-foreground"
            : "text-transparent"
        )}
      >
        {footnote}
      </p>
    </div>
  );
}

function LegendItem({
  color,
  label,
  border,
  striped,
}: {
  color: string;
  label: string;
  border?: boolean;
  striped?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn("size-4 rounded-sm", border && "ring-2 ring-white")}
        style={
          striped
            ? {
                backgroundColor: color,
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 4px)",
              }
            : { backgroundColor: color }
        }
      />
      {label}
    </span>
  );
}

function GrandstandRow({
  spec,
  seatMap,
  selectedSeatIds,
  selectedSeatOrder,
  hoveredSeatId,
  activeZoneId,
  allowedZoneId,
  seatSize,
  seatGap,
  selectionEnabled,
  onSelectSeat,
  setHoveredSeat,
}: {
  spec: (typeof GRANDSTAND_ROWS)[number];
  seatMap: Map<string, Seat>;
  selectedSeatIds: string[];
  selectedSeatOrder: Map<string, number>;
  hoveredSeatId: string | null;
  activeZoneId: StadiumZoneId | "all";
  allowedZoneId: StadiumZoneId | null;
  seatSize: number;
  seatGap: number;
  selectionEnabled: boolean;
  onSelectSeat: (seat: Seat) => void;
  setHoveredSeat: (seat: Seat | null) => void;
}) {
  const segments: { zoneId: StadiumZoneId; range: [number, number] }[] = [
    { zoneId: "verde", range: spec.verde },
    { zoneId: "blanca", range: spec.blanca },
    { zoneId: "roja", range: spec.roja },
  ];

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex w-10 shrink-0 flex-col items-center justify-center">
        <span className="font-mono text-sm font-bold text-primary">F{spec.row}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {segments.map(({ zoneId, range }) => (
          <ZoneSegment
            key={zoneId}
            zoneId={zoneId}
            range={range}
            seatMap={seatMap}
            selectedSeatIds={selectedSeatIds}
            selectedSeatOrder={selectedSeatOrder}
            hoveredSeatId={hoveredSeatId}
            activeZoneId={activeZoneId}
            allowedZoneId={allowedZoneId}
            seatSize={seatSize}
            seatGap={seatGap}
            selectionEnabled={selectionEnabled}
            onSelectSeat={onSelectSeat}
            setHoveredSeat={setHoveredSeat}
          />
        ))}
      </div>
      <p className="shrink-0 font-mono text-[10px] text-white/30">
        {formatSeatId(spec.verde[0])}–{formatSeatId(spec.roja[1])}
      </p>
    </div>
  );
}

function ZoneSegment({
  zoneId,
  range,
  seatMap,
  selectedSeatIds,
  selectedSeatOrder,
  hoveredSeatId,
  activeZoneId,
  allowedZoneId,
  seatSize,
  seatGap,
  selectionEnabled,
  onSelectSeat,
  setHoveredSeat,
}: {
  zoneId: StadiumZoneId;
  range: [number, number];
  seatMap: Map<string, Seat>;
  selectedSeatIds: string[];
  selectedSeatOrder: Map<string, number>;
  hoveredSeatId: string | null;
  activeZoneId: StadiumZoneId | "all";
  allowedZoneId: StadiumZoneId | null;
  seatSize: number;
  seatGap: number;
  selectionEnabled: boolean;
  onSelectSeat: (seat: Seat) => void;
  setHoveredSeat: (seat: Seat | null) => void;
}) {
  const zone = STADIUM_ZONES[zoneId];
  const [start, end] = range;
  const isFaded =
    (activeZoneId !== "all" && activeZoneId !== zoneId) ||
    (allowedZoneId != null && allowedZoneId !== zoneId);

  const seatNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div
      className={cn(
        "shrink-0 overflow-visible rounded-lg border-2 p-2 pt-5",
        zone.accentBorder,
        zone.accentBg,
        isFaded && "pointer-events-none opacity-25 grayscale"
      )}
      style={{ width: zoneRowWidth(seatNumbers.length, seatSize, seatGap) }}
    >
      <p className="mb-1.5 text-center font-mono text-[9px] text-white/50">
        {formatSeatId(start)} – {formatSeatId(end)}
      </p>
      <div className="flex flex-nowrap" style={{ gap: seatGap }}>
        {seatNumbers.map((num) => {
          const id = formatSeatId(num);
          const seat = seatMap.get(id);
          if (!seat) return null;
          const isSelected = selectedSeatIds.includes(id);
          const abonoOrder = selectedSeatOrder.get(id);
          const isHovered = hoveredSeatId === id;
          const isOccupied = seat.status === "occupied";
          const isCourtesy = seat.status === "courtesy";
          const isBlocked = isOccupied || isCourtesy;
          const showLabel = isSelected || isHovered;

          return (
            <div
              key={id}
              className="relative shrink-0"
              style={{ width: seatSize, height: seatSize }}
            >
              {showLabel ? (
                <div
                  className={cn(
                    "pointer-events-none absolute bottom-full left-1/2 z-40 mb-1 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none shadow-lg",
                    isSelected
                      ? "border border-primary bg-primary text-black"
                      : "border border-white/30 bg-black/90 text-white"
                  )}
                >
                  {abonoOrder ? `${abonoOrder}·` : ""}#{id}
                </div>
              ) : null}
              {isSelected && abonoOrder ? (
                <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-50 flex size-3.5 items-center justify-center rounded-full bg-black text-[8px] font-bold text-primary ring-1 ring-primary">
                  {abonoOrder}
                </span>
              ) : null}
              <button
                type="button"
                disabled={isBlocked || (!selectionEnabled && !isSelected)}
                aria-label={
                  isCourtesy
                    ? `Cortesía · Silla #${id} · Fila ${seat.row} · no disponible`
                    : formatSeatLabel(seat)
                }
                title={isCourtesy ? "Reservada para cortesía" : undefined}
                onClick={() => onSelectSeat(seat)}
                onMouseEnter={() => setHoveredSeat(seat)}
                onMouseLeave={() => setHoveredSeat(null)}
                onFocus={() => setHoveredSeat(seat)}
                onBlur={() => setHoveredSeat(null)}
                style={{
                  width: seatSize,
                  height: seatSize,
                  backgroundColor: isSelected
                    ? "#A99259"
                    : isCourtesy
                    ? "#6b5b45"
                    : isOccupied
                    ? "#3f3f46"
                    : zone.seatColor,
                  backgroundImage: isCourtesy
                    ? "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)"
                    : undefined,
                }}
                className={cn(
                  "rounded-[3px] border border-black/20",
                  isBlocked
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:z-20 hover:ring-2 hover:ring-white/70",
                  isSelected && "z-30 border-2 border-white shadow-[0_0_12px_#A99259] opacity-100",
                  isHovered && !isSelected && !isBlocked && "z-20 ring-2 ring-white/80"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HorizontalPasillo() {
  return (
    <div className="my-2 ml-10 flex h-5 items-center justify-center rounded border border-dashed border-yellow-500/40 bg-yellow-500/5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-500/70">
        Pasillo
      </span>
    </div>
  );
}

"use client";

import { Download, Printer } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  formatCop,
  STADIUM_ZONES,
  type Seat,
  type StadiumZoneId,
} from "@/lib/stadium-seating";

type PreviewSummaryPanelProps = {
  seats: Seat[];
  matchLabel: string | null;
};

type ZoneSummary = {
  zoneId: StadiumZoneId;
  label: string;
  total: number;
  available: number;
  occupied: number;
  courtesy: number;
};

function csvEscape(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function PreviewSummaryPanel({ seats, matchLabel }: PreviewSummaryPanelProps) {
  const zoneSummaries: ZoneSummary[] = useMemo(() => {
    return (Object.keys(STADIUM_ZONES) as StadiumZoneId[]).map((zoneId) => {
      const zoneSeats = seats.filter((s) => s.zoneId === zoneId);
      return {
        zoneId,
        label: STADIUM_ZONES[zoneId].shortName,
        total: zoneSeats.length,
        available: zoneSeats.filter((s) => s.status === "available").length,
        occupied: zoneSeats.filter((s) => s.status === "occupied").length,
        courtesy: zoneSeats.filter((s) => s.status === "courtesy").length,
      };
    });
  }, [seats]);

  const roster = useMemo(
    () =>
      seats
        .filter((s) => s.occupantName)
        .sort((a, b) => a.seatNumber - b.seatNumber)
        .map((s) => ({
          seatId: s.id,
          zoneLabel: STADIUM_ZONES[s.zoneId].shortName,
          occupantName: s.occupantName as string,
          typeLabel:
            s.occupantType === "boleta"
              ? "Boleta individual"
              : s.occupantType === "cortesia"
              ? "Abono de cortesía"
              : "Abono",
          price: s.price,
        })),
    [seats]
  );

  const title = matchLabel
    ? `Resumen de ocupación — ${matchLabel}`
    : "Resumen de ocupación de la tribuna";

  function handleDownloadCsv() {
    const header = ["Silla", "Zona", "Ocupante", "Tipo", "Valor"];
    const lines = [header.join(";")];
    for (const row of roster) {
      lines.push(
        [
          row.seatId,
          csvEscape(row.zoneLabel),
          csvEscape(row.occupantName),
          csvEscape(row.typeLabel),
          String(row.price),
        ].join(";")
      );
    }
    const filename = matchLabel
      ? `sillas-${matchLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`
      : "sillas-tribuna.csv";
    downloadFile(filename, lines.join("\n"), "text/csv;charset=utf-8;");
  }

  function handleDownloadPdf() {
    window.print();
  }

  return (
    <div id="preview-report" className="mt-8 rounded-xl border border-white/10 bg-[#18181B]/80 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-heading text-base uppercase tracking-wide text-white sm:text-lg">
          {title}
        </h3>
        <div className="flex gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadCsv}
            className="h-9 border-white/15 bg-transparent text-xs text-white hover:bg-white/10"
          >
            <Download className="mr-1.5 size-3.5" />
            Descargar CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadPdf}
            className="h-9 border-white/15 bg-transparent text-xs text-white hover:bg-white/10"
          >
            <Printer className="mr-1.5 size-3.5" />
            Descargar PDF
          </Button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground print:hidden">
        &ldquo;Descargar PDF&rdquo; abre el diálogo de impresión — elige &ldquo;Guardar como PDF&rdquo; como destino.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">Zona</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Disponibles</th>
              <th className="py-2 pr-3">Ocupadas</th>
              <th className="py-2 pr-3">Cortesía</th>
            </tr>
          </thead>
          <tbody>
            {zoneSummaries.map((z) => (
              <tr key={z.zoneId} className="border-b border-white/5 text-white">
                <td className="py-2 pr-3">{z.label}</td>
                <td className="py-2 pr-3 font-mono">{z.total}</td>
                <td className="py-2 pr-3 font-mono text-emerald-400">{z.available}</td>
                <td className="py-2 pr-3 font-mono text-rose-300">{z.occupied}</td>
                <td className="py-2 pr-3 font-mono text-amber-300">{z.courtesy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="mt-6 font-heading text-sm uppercase tracking-wide text-white">
        Detalle de sillas ocupadas ({roster.length})
      </h4>
      <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-white/10 print:max-h-none print:overflow-visible">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-[#18181B] print:static">
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pl-3 pr-3">Silla</th>
              <th className="py-2 pr-3">Zona</th>
              <th className="py-2 pr-3">Ocupante</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((row) => (
              <tr key={row.seatId} className="border-b border-white/5 text-white">
                <td className="py-1.5 pl-3 pr-3 font-mono">#{row.seatId}</td>
                <td className="py-1.5 pr-3">{row.zoneLabel}</td>
                <td className="py-1.5 pr-3">{row.occupantName}</td>
                <td className="py-1.5 pr-3">{row.typeLabel}</td>
                <td className="py-1.5 pr-3 font-mono">{formatCop(row.price)}</td>
              </tr>
            ))}
            {roster.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  No hay sillas ocupadas con nombre registrado todavía.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { InscripcionButton } from "@/components/InscripcionButton";
import { convocatoriaCalls } from "@/lib/brand";
import { cn } from "@/lib/utils";

type ConvocatoriaCtasProps = {
  className?: string;
  buttonClassName?: string;
  primaryButtonClassName?: string;
  secondaryButtonClassName?: string;
  layout?: "stack" | "row";
};

export function ConvocatoriaCtas({
  className,
  buttonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  layout = "row",
}: ConvocatoriaCtasProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-3",
        layout === "row" ? "flex-col sm:flex-row sm:flex-wrap" : "flex-col",
        className
      )}
    >
      {convocatoriaCalls.map((call, index) => (
        <InscripcionButton
          key={call.id}
          label={call.inscripcionLabel}
          className={cn(
            "h-12 w-full px-6 text-sm font-semibold uppercase tracking-wide sm:w-auto sm:px-8",
            index === 0 ? primaryButtonClassName : secondaryButtonClassName,
            buttonClassName
          )}
        />
      ))}
    </div>
  );
}

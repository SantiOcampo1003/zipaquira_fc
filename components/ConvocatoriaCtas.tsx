"use client";

import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  convocatoriaCalls,
  convocatoriaFormUrl,
  convocatoriaRegistrationsOpen,
} from "@/lib/brand";
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
  if (!convocatoriaRegistrationsOpen) {
    return (
      <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
        <span
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "cursor-default border border-white/10 bg-white/[0.06] text-muted-foreground",
            buttonClassName
          )}
        >
          Inscripciones cerradas
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        layout === "row" ? "flex-col sm:flex-row sm:flex-wrap" : "flex-col",
        className
      )}
    >
      {convocatoriaCalls.map((call, index) => (
        <a
          key={call.id}
          href={convocatoriaFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: index === 0 ? "default" : "secondary" }),
            "h-12 w-full px-6 text-sm font-semibold uppercase tracking-wide gap-2 sm:w-auto sm:px-8 inline-flex items-center justify-center rounded-md",
            index === 0
              ? cn("bg-primary text-primary-foreground hover:bg-primary/90", primaryButtonClassName)
              : cn("border border-primary/35 bg-primary/10 text-primary hover:bg-primary/20", secondaryButtonClassName),
            buttonClassName
          )}
        >
          <span>{call.inscripcionLabel}</span>
          <ExternalLink className="size-4 shrink-0" aria-hidden />
        </a>
      ))}
    </div>
  );
}

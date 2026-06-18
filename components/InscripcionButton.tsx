"use client";

import { ExternalLink } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { convocatoriaFormUrl } from "@/lib/brand";
import { cn } from "@/lib/utils";

type InscripcionButtonProps = {
  label?: string;
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
} & VariantProps<typeof buttonVariants>;

export function InscripcionButton({
  label = "Inscribirme en las convocatorias",
  showIcon = true,
  variant = "default",
  size = "default",
  className,
  children,
}: InscripcionButtonProps) {
  return (
    <a
      href={convocatoriaFormUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), "gap-2", className)}
    >
      {children ?? label}
      {showIcon ? <ExternalLink className="size-4 shrink-0" aria-hidden /> : null}
    </a>
  );
}

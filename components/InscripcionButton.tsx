"use client";

import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { matchTicketCta } from "@/lib/brand";
import { scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/utils";

type InscripcionButtonProps = {
  label?: string;
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
} & VariantProps<typeof buttonVariants>;

/** CTA hacia el registro de interés en boletas del partido inaugural. */
export function InscripcionButton({
  label = matchTicketCta,
  variant = "default",
  size = "default",
  className,
  children,
}: InscripcionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => scrollToId("boletas")}
      className={cn(buttonVariants({ variant, size }), "gap-2", className)}
    >
      {children ?? label}
    </button>
  );
}

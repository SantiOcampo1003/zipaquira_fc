import Image from "next/image";
import { cn } from "@/lib/utils";

/** Isologo oficial ZIPA F.C. (manual de marca). */
export const ESCUDO_PATH = "/images/escudo-zipa-fc.jpg";

export const escudoAlt =
  "Escudo oficial Zipa F.C.: montañas y sol en verde, ZIPA F.C., cristal de sal y año 2026 en burdeos";

type ClubCrestProps = {
  className?: string;
  /** En header conviene prioridad para LCP */
  priority?: boolean;
  /** header: compacto · hero: más aire alrededor del escudo */
  variant?: "header" | "hero";
  /** Sobrescribe `sizes` de next/image (p. ej. tarjeta hero ancha) */
  sizes?: string;
};

/** Escudo institucional centrado. */
export function ClubCrest({
  className,
  priority = false,
  variant = "header",
  sizes: sizesProp,
}: ClubCrestProps) {
  const sizes =
    sizesProp ??
    (variant === "hero" ? "(max-width: 768px) 90vw, 380px" : "48px");

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        variant === "hero" ? "bg-rz-forest-dark" : "bg-transparent",
        className
      )}
      data-slot="club-crest"
    >
      <Image
        src={ESCUDO_PATH}
        alt={escudoAlt}
        fill
        sizes={sizes}
        className={cn(
          "object-contain object-center",
          variant === "hero" ? "p-1.5" : "p-0"
        )}
        priority={priority}
      />
    </div>
  );
}

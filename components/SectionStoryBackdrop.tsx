import { cn } from "@/lib/utils";

type Overlay = "light" | "medium" | "heavy";

const overlayClass: Record<Overlay, string> = {
  heavy:
    "bg-gradient-to-br from-[#061a0a]/[0.94] via-[#0b2810]/[0.78] to-[#061a0a]/[0.92]",
  medium:
    "bg-gradient-to-br from-[#061a0a]/[0.88] via-[#0b2810]/[0.68] to-[#061a0a]/[0.86]",
  light:
    "bg-gradient-to-br from-[#061a0a]/[0.78] via-[#0b2810]/[0.52] to-[#061a0a]/[0.74]",
};

type SectionStoryBackdropProps = {
  imageSrc: string;
  overlay?: Overlay;
  /** Encuadre para banners muy anchos (texto del sitio va por encima, no el de la imagen). */
  focal?: "center" | "left" | "right";
  /**
   * Ajuste vertical del `background-position` (con `cover`).
   * Valores como `40%` o `42%` suben el encuadre y suelen mostrar más la parte superior de la foto (p. ej. rostro).
   */
  positionY?: string;
};

/**
 * Fondo fijo por sección: imagen + velos para legibilidad del contenido HTML.
 */
export function SectionStoryBackdrop({
  imageSrc,
  overlay = "medium",
  focal = "center",
  positionY,
}: SectionStoryBackdropProps) {
  const y = positionY ?? "center";
  const position =
    focal === "left"
      ? ({ backgroundPosition: `18% ${y}`, backgroundSize: "cover" } as const)
      : focal === "right"
        ? ({ backgroundPosition: `82% ${y}`, backgroundSize: "cover" } as const)
        : ({ backgroundPosition: `center ${y}`, backgroundSize: "cover" } as const);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${imageSrc})`,
          ...position,
        }}
      />
      <div className={cn("absolute inset-0", overlayClass[overlay])} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />
    </div>
  );
}

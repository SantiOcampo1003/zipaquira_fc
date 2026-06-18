/**
 * Separador premium entre bloques: línea dorada + gradientes de luz.
 * No altera el orden de las secciones; solo añade ritmo visual.
 */
export function SectionDivider() {
  return (
    <div className="relative h-px w-full shrink-0 overflow-visible" aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-[15%] -top-6 h-12 bg-[radial-gradient(ellipse_at_50%_0%,rgba(169,146,89,0.14),transparent_70%)] blur-xl" />
      <div className="pointer-events-none absolute inset-x-1/4 -top-3 h-6 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.06),transparent_70%)] blur-md" />
    </div>
  );
}

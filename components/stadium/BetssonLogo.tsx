import { cn } from "@/lib/utils";

/**
 * Wordmark de Betsson en su naranja de marca. Si el club tiene el logo oficial,
 * basta con reemplazar este componente por un <Image src="/images/betsson-logo.png" />.
 */
export function BetssonLogo({ className }: { className?: string }) {
  return (
    <span
      aria-label="Betsson"
      className={cn("select-none font-heading font-extrabold lowercase leading-none tracking-tight text-[#F26B21]", className)}
    >
      betsson
    </span>
  );
}

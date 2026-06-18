import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  className?: string;
  /** Para grillas estrechas (p. ej. panel del hero). */
  compact?: boolean;
};

export function StatCard({ label, value, className, compact = false }: StatCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] text-center ring-1 ring-white/[0.04] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_16px_40px_-14px_rgba(0,0,0,0.55)] motion-reduce:hover:translate-y-0",
        compact ? "px-2 py-2.5 sm:px-3 sm:py-3" : "px-4 py-3 sm:px-5 sm:py-4",
        className
      )}
    >
      <p
        className={cn(
          "font-heading font-normal leading-none text-white",
          compact
            ? "text-sm tracking-wide sm:text-base"
            : "text-2xl sm:text-3xl"
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-1.5 truncate font-medium uppercase tracking-wider text-muted-foreground",
          compact ? "text-[0.58rem] sm:text-[0.62rem]" : "text-[0.65rem] sm:text-xs"
        )}
      >
        {label}
      </p>
    </div>
  );
}

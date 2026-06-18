import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionBadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionBadge({ children, className }: SectionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto max-w-full whitespace-normal text-balance border-primary/35 bg-primary/10 px-2.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-primary sm:px-3 sm:text-[0.65rem] sm:tracking-[0.22em] lg:text-xs",
        className
      )}
    >
      {children}
    </Badge>
  );
}

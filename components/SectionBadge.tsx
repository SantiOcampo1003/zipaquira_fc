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
        "h-auto border-primary/35 bg-primary/10 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-primary sm:text-xs",
        className
      )}
    >
      {children}
    </Badge>
  );
}

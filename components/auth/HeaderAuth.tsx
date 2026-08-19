"use client";

import { useFanAuth } from "@/components/auth/FanAuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { defaultAuthNextPath } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

type HeaderAuthProps = {
  className?: string;
  compact?: boolean;
  onNavigate?: () => void;
};

export function HeaderAuth({ className, compact = false, onNavigate }: HeaderAuthProps) {
  const { user, loading, signOut } = useFanAuth();

  if (loading) {
    return (
      <span
        className={cn(
          "inline-flex h-8 items-center text-[10px] uppercase tracking-wide text-white/40 sm:h-9",
          className
        )}
      >
        …
      </span>
    );
  }

  if (user) {
    const label = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Cuenta";
    return (
      <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
        <span
          className={cn(
            "hidden max-w-[7rem] truncate text-[10px] font-medium text-white/70 sm:inline sm:max-w-[9rem] sm:text-[11px]",
            compact && "inline"
          )}
          title={user.email ?? undefined}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void signOut();
          }}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[9px] font-semibold uppercase tracking-wide text-white/70 transition-colors hover:border-white/20 hover:text-white sm:h-9 sm:px-3 sm:text-[10px]"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-3.5 shrink-0" aria-hidden />
          <span className={compact ? "inline" : "hidden sm:inline"}>Salir</span>
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <GoogleSignInButton
        nextPath={defaultAuthNextPath()}
        label="Entrar con Google"
        fullWidth
        className={className}
      />
    );
  }

  return (
    <GoogleSignInButton
      nextPath={defaultAuthNextPath()}
      label="Entrar"
      className={className}
    />
  );
}

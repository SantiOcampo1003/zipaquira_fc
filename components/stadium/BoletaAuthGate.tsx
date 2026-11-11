"use client";

import { Loader2, Ticket } from "lucide-react";
import { useFanAuth } from "@/components/auth/FanAuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MatchSelectorSection } from "@/components/stadium/MatchSelectorSection";

/** Exige inicio de sesión con Google antes de dejar elegir partido y comprar boleta. */
export function BoletaAuthGate() {
  const { user, loading } = useFanAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center text-white">
        <Ticket className="mb-4 size-12 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Compra tu boleta</p>
        <h1 className="mt-2 font-heading text-2xl uppercase">Inicia sesión para continuar</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Usa tu cuenta de Google para elegir tu silla en el mapa del estadio y pagar en línea.
        </p>
        <GoogleSignInButton
          nextPath="/boletas"
          label="Continuar con Google"
          fullWidth
          className="mt-6 max-w-xs"
        />
      </div>
    );
  }

  return <MatchSelectorSection userEmail={user.email ?? ""} />;
}

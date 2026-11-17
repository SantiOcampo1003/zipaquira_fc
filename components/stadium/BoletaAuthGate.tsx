"use client";

import { MatchSelectorSection } from "@/components/stadium/MatchSelectorSection";

/**
 * La lista de partidos es pública; el inicio de sesión con Google se pide
 * justo después de elegir el partido (ver MatchSelectorSection).
 */
export function BoletaAuthGate() {
  return <MatchSelectorSection />;
}

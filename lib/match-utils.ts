import type { MatchRow } from "@/lib/types/match";

export function formatMatchDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatMatchScore(match: MatchRow): string | null {
  if (match.goals_for == null || match.goals_against == null) return null;
  return `${match.goals_for} – ${match.goals_against}`;
}

export function playerShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return parts[parts.length - 1];
}

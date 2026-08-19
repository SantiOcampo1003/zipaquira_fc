/** Convierte destinos con # a query ?scroll= para redirects del servidor (evita 404). */
export function toSafeRedirectPath(next: string): string {
  if (next.startsWith("/#")) {
    const sectionId = next.slice(2);
    return sectionId ? `/?scroll=${encodeURIComponent(sectionId)}` : "/";
  }
  if (next.startsWith("#")) {
    return `/?scroll=${encodeURIComponent(next.slice(1))}`;
  }
  return next.startsWith("/") ? next : `/${next}`;
}

/** URL de retorno tras OAuth (Google) vía Supabase. */
export function buildAuthCallbackUrl(nextPath: string): string {
  const safe = toSafeRedirectPath(nextPath);
  if (typeof window === "undefined") {
    return `/auth/callback?next=${encodeURIComponent(safe)}`;
  }
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(safe)}`;
}

export function defaultAuthNextPath(): string {
  return "/?scroll=partidos";
}

export function resolveAuthRedirect(origin: string, next: string): string {
  const safe = toSafeRedirectPath(next);
  return new URL(safe, origin).toString();
}

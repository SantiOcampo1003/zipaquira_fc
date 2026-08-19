"use client";

import { defaultAuthNextPath } from "@/lib/auth-redirect";
import { useEffect } from "react";

/**
 * Si Supabase no tiene /auth/callback en Redirect URLs, cae en Site URL (/)
 * con ?code=... Sin esto el código nunca se intercambia por sesión.
 */
export function AuthOAuthFallback() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code || url.pathname === "/auth/callback") return;

    const next =
      url.searchParams.get("next") ??
      (url.searchParams.get("scroll")
        ? `/?scroll=${encodeURIComponent(url.searchParams.get("scroll")!)}`
        : defaultAuthNextPath());

    const callback = new URL("/auth/callback", url.origin);
    callback.searchParams.set("code", code);
    callback.searchParams.set("next", next);

    window.location.replace(callback.toString());
  }, []);

  return null;
}

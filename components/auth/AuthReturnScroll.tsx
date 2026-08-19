"use client";

import { scrollToId } from "@/lib/scroll";
import { useEffect } from "react";

/** Tras OAuth, el servidor redirige con ?scroll=partidos (no # en Location). */
export function AuthReturnScroll() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sectionId = params.get("scroll");
    if (!sectionId) return;

    const timer = window.setTimeout(() => {
      scrollToId(sectionId);
    }, 100);

    params.delete("scroll");
    const query = params.toString();
    const clean = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", clean);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

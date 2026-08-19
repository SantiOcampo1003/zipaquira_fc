"use client";

import { AuthOAuthFallback } from "@/components/auth/AuthOAuthFallback";
import { AuthReturnScroll } from "@/components/auth/AuthReturnScroll";
import { FanAuthProvider } from "@/components/auth/FanAuthProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FanAuthProvider>
      <AuthOAuthFallback />
      <AuthReturnScroll />
      {children}
    </FanAuthProvider>
  );
}

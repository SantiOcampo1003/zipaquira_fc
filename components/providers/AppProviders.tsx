"use client";

import { AuthReturnScroll } from "@/components/auth/AuthReturnScroll";
import { FanAuthProvider } from "@/components/auth/FanAuthProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FanAuthProvider>
      <AuthReturnScroll />
      {children}
    </FanAuthProvider>
  );
}

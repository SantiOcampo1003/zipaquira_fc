"use client";

import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { buildAuthCallbackUrl, defaultAuthNextPath } from "@/lib/auth-redirect";
import { mapAuthError } from "@/lib/auth-errors";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type FanAuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (nextPath?: string) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  getAuthHeaders: () => Promise<HeadersInit>;
};

const FanAuthContext = createContext<FanAuthContextValue | null>(null);

export function FanAuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [supabase]);

  const signInWithGoogle = useCallback(
    async (nextPath = defaultAuthNextPath()) => {
      const redirectTo = buildAuthCallbackUrl(nextPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        return { ok: false, message: mapAuthError(error) };
      }

      return { ok: true };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signOut, getAuthHeaders }),
    [user, loading, signInWithGoogle, signOut, getAuthHeaders]
  );

  return <FanAuthContext.Provider value={value}>{children}</FanAuthContext.Provider>;
}

export function useFanAuth() {
  const ctx = useContext(FanAuthContext);
  if (!ctx) {
    throw new Error("useFanAuth debe usarse dentro de FanAuthProvider.");
  }
  return ctx;
}

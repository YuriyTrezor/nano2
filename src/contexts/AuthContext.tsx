import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionReady: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName: string, phone?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isPreviewEnvironment = () => {
  const hostname = window.location.hostname;
  return hostname.includes("lovableproject.com") || hostname.includes("id-preview--");
};

const getProjectRef = () => {
  try {
    const url = new URL(import.meta.env.VITE_SUPABASE_URL as string);
    return url.hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
};

const clearStoredAuthState = () => {
  if (typeof window === "undefined") return;

  const projectRef = getProjectRef();
  const knownKeys = [
    "supabase.auth.token",
    projectRef ? `sb-${projectRef}-auth-token` : null,
    projectRef ? `sb-${projectRef}-auth-token-code-verifier` : null,
  ].filter(Boolean) as string[];

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    knownKeys.forEach((key) => {
      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
    });

    if (!projectRef) return;

    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (!key || !key.includes(projectRef) || !key.includes("auth-token")) continue;

      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
    }
  });
};

const isStaleSessionError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");

  return /refresh token|refresh_token_not_found|invalid refresh token/i.test(message);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const applySession = (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      setTimeout(() => checkAdmin(nextSession.user.id), 0);
    } else {
      setIsAdmin(false);
    }

    setLoading(false);
    setSessionReady(true);
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const trackLogin = () => {
    try {
      Promise.resolve(supabase.functions.invoke("track-login")).catch(() => {});
    } catch {
      // ignore
    }
  };

  const signInFromPreviewFallback = async (email: string, password: string) => {
    const { data, error } = await supabase.functions.invoke("preview-password-login", {
      body: { email, password },
    });

    if (error) {
      return { error };
    }

    const sessionData = data?.session;

    if (!sessionData?.access_token || !sessionData?.refresh_token) {
      return { error: new Error("Не удалось получить сессию") };
    }

    const { data: sessionDataResult, error: sessionError } = await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    if (!sessionError) {
      applySession(sessionDataResult.session);
    }

    return { error: sessionError };
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error && isStaleSessionError(error)) {
        clearStoredAuthState();
        applySession(null);
        return;
      }

      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, phone?: string, lastName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, last_name: lastName || null, phone: phone || null },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error && isStaleSessionError(error)) {
        clearStoredAuthState();

        const retryResult = await supabase.auth.signInWithPassword({ email, password });
        if (!retryResult.error) {
          applySession(retryResult.data.session);
          trackLogin();
        }

        return { error: retryResult.error };
      }

      if (error && isPreviewEnvironment() && /failed to fetch/i.test(error.message)) {
        const fallbackResult = await signInFromPreviewFallback(email, password);
        if (!fallbackResult.error) {
          trackLogin();
        }
        return fallbackResult;
      }

      if (!error) {
        applySession(data.session);
        trackLogin();
      }

      return { error };
    } catch (error) {
      if (isStaleSessionError(error)) {
        clearStoredAuthState();

        const retryResult = await supabase.auth.signInWithPassword({ email, password });
        if (!retryResult.error) {
          applySession(retryResult.data.session);
          trackLogin();
        }

        return { error: retryResult.error };
      }

      if (isPreviewEnvironment()) {
        const fallbackResult = await signInFromPreviewFallback(email, password);
        if (!fallbackResult.error) {
          trackLogin();
        }
        return fallbackResult;
      }

      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sessionReady, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

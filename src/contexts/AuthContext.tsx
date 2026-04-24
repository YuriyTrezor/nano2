import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    return { error: sessionError };
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkAdmin(session.user.id), 0);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
      }
      setLoading(false);
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error && isPreviewEnvironment() && /failed to fetch/i.test(error.message)) {
        const fallbackResult = await signInFromPreviewFallback(email, password);
        if (!fallbackResult.error) {
          trackLogin();
        }
        return fallbackResult;
      }

      if (!error) {
        trackLogin();
      }

      return { error };
    } catch (error) {
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
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  cpf: string;
  display_name: string;
  avatar_url: string | null;
  level: string;
  points: number;
  streak: number;
  subscription_tier: "free" | "premium";
  recovery_email: string | null;
  two_factor_enabled: boolean;
  notification_push: boolean;
  notification_whatsapp: boolean;
  notification_email: boolean;
  theme_preference: string;
  app_lock_pin: string | null;
  language: string;
  country: string;
  timezone: string;
  locale_configured: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (cpf: string, name: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

// Convert CPF to a fake email for Supabase auth (CPF-only login)
const cpfToEmail = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "");
  return `${digits}@cerebralta.app`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (cpf: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: cpfToEmail(cpf),
      password,
    });
    return { error: error?.message ?? null };
  };

  const register = async (cpf: string, name: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: cpfToEmail(cpf),
      password,
      options: {
        data: { cpf: cpf.replace(/\D/g, ""), display_name: name },
      },
    });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

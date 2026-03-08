import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const themes: Record<string, { primary: string; ring: string; sidebarPrimary: string; sidebarRing: string }> = {
  "azul-alluzion": { primary: "213 72% 42%", ring: "213 72% 42%", sidebarPrimary: "213 72% 42%", sidebarRing: "213 72% 42%" },
  "azul-cobalto": { primary: "220 80% 50%", ring: "220 80% 50%", sidebarPrimary: "220 80% 50%", sidebarRing: "220 80% 50%" },
  "azul-noturno": { primary: "230 60% 35%", ring: "230 60% 35%", sidebarPrimary: "230 60% 35%", sidebarRing: "230 60% 35%" },
  "azul-celeste": { primary: "200 75% 50%", ring: "200 75% 50%", sidebarPrimary: "200 75% 50%", sidebarRing: "200 75% 50%" },
  "azul-royal": { primary: "240 65% 45%", ring: "240 65% 45%", sidebarPrimary: "240 65% 45%", sidebarRing: "240 65% 45%" },
};

interface ThemeContextType {
  currentTheme: string;
  setTheme: (theme: string) => void;
  themeOptions: string[];
}

const ThemeContext = createContext<ThemeContextType>({ currentTheme: "azul-alluzion", setTheme: () => {}, themeOptions: [] });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [currentTheme, setCurrentTheme] = useState("azul-alluzion");

  useEffect(() => {
    if (profile && (profile as any).theme_preference) {
      setCurrentTheme((profile as any).theme_preference);
    }
  }, [profile]);

  useEffect(() => {
    const t = themes[currentTheme] ?? themes["azul-alluzion"];
    const root = document.documentElement;
    root.style.setProperty("--primary", t.primary);
    root.style.setProperty("--ring", t.ring);
    root.style.setProperty("--sidebar-primary", t.sidebarPrimary);
    root.style.setProperty("--sidebar-ring", t.sidebarRing);
  }, [currentTheme]);

  const setTheme = async (theme: string) => {
    setCurrentTheme(theme);
    if (user) {
      await supabase.from("profiles").update({ theme_preference: theme } as any).eq("user_id", user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themeOptions: Object.keys(themes) }}>
      {children}
    </ThemeContext.Provider>
  );
};

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const DEFAULT_COLOR = "#2563EB";

interface ThemeContextType {
  accentHex: string;
  setAccentColor: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({ accentHex: DEFAULT_COLOR, setAccentColor: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [accentHex, setAccentHex] = useState(DEFAULT_COLOR);

  // Load from profile
  useEffect(() => {
    if (profile?.theme_preference) {
      const pref = profile.theme_preference;
      // If it starts with # it's a hex color, otherwise use default
      if (pref.startsWith("#")) {
        setAccentHex(pref);
      }
    }
  }, [profile]);

  // Apply CSS vars whenever accentHex changes
  useEffect(() => {
    const hsl = hexToHsl(accentHex);
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-ring", hsl);
  }, [accentHex]);

  const setAccentColor = async (hex: string) => {
    setAccentHex(hex);
    if (user) {
      await supabase.from("profiles").update({ theme_preference: hex }).eq("user_id", user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ accentHex, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

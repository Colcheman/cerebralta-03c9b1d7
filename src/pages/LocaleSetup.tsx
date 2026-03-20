import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, MapPin, Clock, Check, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "it-IT", label: "Italiano" },
  { code: "ja-JP", label: "日本語" },
];

const COUNTRIES = [
  { code: "BR", label: "Brasil" },
  { code: "PT", label: "Portugal" },
  { code: "US", label: "Estados Unidos" },
  { code: "GB", label: "Reino Unido" },
  { code: "ES", label: "Espanha" },
  { code: "FR", label: "França" },
  { code: "DE", label: "Alemanha" },
  { code: "IT", label: "Itália" },
  { code: "JP", label: "Japão" },
  { code: "AR", label: "Argentina" },
  { code: "MX", label: "México" },
  { code: "CO", label: "Colômbia" },
  { code: "CL", label: "Chile" },
  { code: "AO", label: "Angola" },
  { code: "MZ", label: "Moçambique" },
];

const getTimezones = (): string[] => {
  try {
    return (Intl as any).supportedValuesOf("timeZone");
  } catch {
    return [
      "America/Sao_Paulo", "America/Manaus", "America/Bahia", "America/Fortaleza",
      "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
      "America/Buenos_Aires", "America/Santiago", "America/Bogota", "America/Mexico_City",
      "Europe/London", "Europe/Lisbon", "Europe/Paris", "Europe/Berlin",
      "Europe/Madrid", "Europe/Rome", "Asia/Tokyo", "Africa/Luanda", "Africa/Maputo",
    ];
  }
};

const TIMEZONES = getTimezones();

const LocaleSetup = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("pt-BR");
  const [country, setCountry] = useState("BR");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Try to detect user timezone on mount
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && TIMEZONES.includes(detected)) {
        setTimezone(detected);
      }
    } catch {}
  }, []);

  const formattedDateTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(language, {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now);
    } catch {
      return now.toLocaleString();
    }
  }, [now, timezone, language]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        language,
        country,
        timezone,
        locale_configured: true,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    navigate("/feed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-primary mb-4">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Configure seu perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione seu idioma, país e fuso horário
          </p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-5">
          {/* Language */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Globe className="w-4 h-4" /> Idioma
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" /> País
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Clock className="w-4 h-4" /> Fuso Horário
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Live Preview */}
          <motion.div
            key={timezone}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">Data e hora no seu fuso:</p>
            <p className="text-sm font-semibold text-foreground capitalize">{formattedDateTime}</p>
          </motion.div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-primary text-primary-foreground py-3.5 rounded-lg font-semibold shadow-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? "Salvando..." : (
              <>
                <Check className="w-4 h-4" /> Confirmar e Continuar
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LocaleSetup;

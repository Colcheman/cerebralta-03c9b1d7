import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LEVELS = [
  { name: "Iniciante", minPoints: 0 },
  { name: "Consciente", minPoints: 100 },
  { name: "Disciplinado", minPoints: 500 },
  { name: "Estrategista", minPoints: 1500 },
  { name: "Dominante", minPoints: 3000 },
  { name: "Cerebralta", minPoints: 5000 },
];

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

const Conquistas = () => {
  const { user, profile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const currentLevelIdx = LEVELS.findIndex((l) => l.name === (profile?.level ?? "Iniciante"));

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: achs }, { data: userAchs }] = await Promise.all([
        supabase.from("achievements").select("*").order("requirement_value", { ascending: true }),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id),
      ]);
      setAchievements((achs ?? []) as Achievement[]);
      setUnlockedIds(new Set((userAchs ?? []).map((ua: any) => ua.achievement_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  const tryUnlock = async (achievementId: string) => {
    if (unlockedIds.has(achievementId)) return;
    const { data: success } = await supabase.rpc("unlock_achievement", { _achievement_id: achievementId });
    if (success) {
      setUnlockedIds(prev => new Set(prev).add(achievementId));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Conquistas</h1>
        <p className="text-sm text-muted-foreground mb-6">Sua jornada de evolução</p>
      </motion.div>

      {/* Level progression */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent" />
          Níveis de Desenvolvimento
        </h2>
        <div className="space-y-3">
          {LEVELS.map((level, i) => {
            const isActive = i === currentLevelIdx;
            const isUnlocked = i <= currentLevelIdx;
            return (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  isActive ? "bg-primary/10 border border-primary/30" : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isActive
                    ? "bg-gradient-primary text-primary-foreground animate-pulse-gold"
                    : isUnlocked
                    ? "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {level.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{level.minPoints} pontos necessários</p>
                </div>
                {isActive && (
                  <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-medium">
                    Atual
                  </span>
                )}
                {!isUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <h2 className="text-sm font-semibold text-foreground mb-3">Medalhas</h2>
      {achievements.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nenhuma conquista cadastrada pelo administrador ainda.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((ach, i) => {
            const isUnlocked = unlockedIds.has(ach.id);
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => tryUnlock(ach.id)}
                className={`glass rounded-xl p-4 text-center transition-all cursor-pointer ${
                  isUnlocked ? "hover:border-accent/30" : "opacity-50"
                }`}
              >
                <div className="text-3xl mb-2">{ach.icon}</div>
                <p className="text-sm font-semibold text-foreground">{ach.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{ach.description}</p>
                {isUnlocked ? (
                  <p className="text-xs text-accent mt-2 font-medium">✅ Desbloqueada</p>
                ) : (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Bloqueada</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Conquistas;

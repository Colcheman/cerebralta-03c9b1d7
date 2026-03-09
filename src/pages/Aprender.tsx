import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  icon: string;
}

interface UserMission {
  mission_id: string;
  completed: boolean;
}

const Aprender = () => {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userMissions, setUserMissions] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Fetch active missions
      const { data: missionsData } = await supabase
        .from("missions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setMissions((missionsData ?? []) as Mission[]);

      // Fetch user's mission progress for today
      const { data: userMissionsData } = await supabase
        .from("user_missions")
        .select("mission_id, completed")
        .eq("user_id", user.id);

      const map = new Map<string, boolean>();
      (userMissionsData ?? []).forEach((um: UserMission) => map.set(um.mission_id, um.completed));
      setUserMissions(map);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleComplete = async (missionId: string) => {
    if (!user || completing) return;
    const alreadyCompleted = userMissions.get(missionId);
    if (alreadyCompleted) return;

    setCompleting(missionId);

    // Assign mission if not yet assigned
    if (!userMissions.has(missionId)) {
      await supabase.from("user_missions").insert({ user_id: user.id, mission_id: missionId });
    }

    // Complete via RPC
    const { data: success } = await supabase.rpc("complete_mission", { _mission_id: missionId });

    if (success) {
      setUserMissions(prev => new Map(prev).set(missionId, true));
    }
    setCompleting(null);
  };

  const completedCount = missions.filter(m => userMissions.get(m.id) === true).length;
  const totalPoints = missions.filter(m => userMissions.get(m.id) === true).reduce((s, m) => s + m.points, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Aprendizado</h1>
        <p className="text-sm text-muted-foreground mb-6">Missões diárias para evolução constante</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
      ) : (
        <>
          {/* Daily Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="glass rounded-xl p-4 text-center">
              <Zap className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Pontos ganhos</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Check className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{completedCount}/{missions.length}</p>
              <p className="text-xs text-muted-foreground">Completas</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{profile?.points ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total geral</p>
            </div>
          </div>

          {/* Progress bar */}
          {missions.length > 0 && (
            <div className="glass rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground font-medium">Progresso</span>
                <span className="text-accent font-semibold">{Math.round((completedCount / missions.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / missions.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Missions */}
          {missions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma missão disponível no momento.</p>
              <p className="text-xs text-muted-foreground mt-1">O administrador ainda não publicou missões.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission, i) => {
                const isCompleted = userMissions.get(mission.id) === true;
                const isCompleting = completing === mission.id;
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleComplete(mission.id)}
                    className={`glass rounded-xl p-4 cursor-pointer transition-all hover:border-primary/20 ${
                      isCompleted ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isCompleted
                          ? "bg-success border-success"
                          : "border-border"
                      }`}>
                        {isCompleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : isCompleted ? (
                          <Check className="w-3.5 h-3.5 text-foreground" />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mission.icon}</span>
                          <h3 className={`text-sm font-semibold ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {mission.title}
                          </h3>
                          <span className="ml-auto text-xs font-medium text-accent">+{mission.points} pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{mission.description}</p>
                        <span className="inline-block mt-2 text-xs bg-muted rounded-full px-2.5 py-0.5 text-muted-foreground">
                          {mission.category}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Aprender;

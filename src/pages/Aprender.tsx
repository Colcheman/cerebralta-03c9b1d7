import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, BookOpen, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [reflections, setReflections] = useState<Map<string, string>>(new Map());
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const { data: missionsData } = await supabase
      .from("missions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setMissions((missionsData ?? []) as Mission[]);

    const { data: userMissionsData } = await supabase
      .from("user_missions")
      .select("mission_id, completed")
      .eq("user_id", user.id);

    const map = new Map<string, boolean>();
    (userMissionsData ?? []).forEach((um: UserMission) => map.set(um.mission_id, um.completed));
    setUserMissions(map);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const allCompleted = missions.length > 0 && missions.every(m => userMissions.get(m.id) === true);

  const handleGenerateMissions = async () => {
    if (!user || generating) return;
    setGenerating(true);
    toast.info("🧠 Gerando novas missões com IA...");

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { mode: "generate_missions", context: `Nível: ${profile?.level}, Pontos: ${profile?.points}` },
      });

      if (error) throw error;
      toast.success("✅ Novas missões geradas!");
      await loadData();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao gerar missões");
    } finally {
      setGenerating(false);
    }
  };

  const handleExpand = (missionId: string) => {
    const isCompleted = userMissions.get(missionId) === true;
    if (isCompleted) return;
    setExpandedMission(expandedMission === missionId ? null : missionId);
  };

  const handleComplete = async (missionId: string) => {
    if (!user || completing) return;
    const alreadyCompleted = userMissions.get(missionId);
    if (alreadyCompleted) return;

    const reflection = reflections.get(missionId)?.trim();
    if (!reflection || reflection.length < 20) return;

    setCompleting(missionId);

    if (!userMissions.has(missionId)) {
      await supabase.from("user_missions").insert({ user_id: user.id, mission_id: missionId });
    }

    const { data: success } = await supabase.rpc("complete_mission", { _mission_id: missionId });

    if (success) {
      setUserMissions(prev => new Map(prev).set(missionId, true));
      setExpandedMission(null);
      toast.success(`+${missions.find(m => m.id === missionId)?.points ?? 0} pontos!`);
    }
    setCompleting(null);
  };

  const completedCount = missions.filter(m => userMissions.get(m.id) === true).length;
  const totalPoints = missions.filter(m => userMissions.get(m.id) === true).reduce((s, m) => s + m.points, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Missões</h1>
        <p className="text-sm text-muted-foreground mb-6">Pratique, reflita e evolua de verdade</p>
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

          {/* Generate button - shows when all completed or no missions */}
          {(allCompleted || missions.length === 0) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleGenerateMissions}
              disabled={generating}
              className="w-full mb-6 p-5 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center justify-center gap-3">
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Sparkles className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                )}
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">
                    {missions.length === 0 ? "Gerar minhas primeiras missões" : "🎉 Todas completas! Gerar novas missões"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A IA vai criar desafios personalizados para seu nível
                  </p>
                </div>
              </div>
            </motion.button>
          )}

          {/* Missions */}
          {missions.length === 0 && !generating ? (
            <div className="text-center py-12">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma missão disponível.</p>
              <p className="text-xs text-muted-foreground mt-1">Clique acima para gerar suas primeiras missões!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission, i) => {
                const isCompleted = userMissions.get(mission.id) === true;
                const isCompleting = completing === mission.id;
                const isExpanded = expandedMission === mission.id;
                const reflection = reflections.get(mission.id) ?? "";
                const canSubmit = reflection.trim().length >= 20;

                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`glass rounded-xl overflow-hidden transition-all ${
                      isCompleted ? "opacity-70" : "hover:border-primary/20"
                    }`}
                  >
                    <div onClick={() => handleExpand(mission.id)} className="p-4 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isCompleted ? "bg-success border-success" : "border-border"
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
                    </div>

                    {isExpanded && !isCompleted && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="border-t border-border px-4 pb-4 pt-3"
                      >
                        <label className="text-xs font-semibold text-foreground block mb-2">
                          📝 Como você cumpriu essa missão? O que aprendeu?
                        </label>
                        <Textarea
                          value={reflection}
                          onChange={(e) => setReflections(prev => new Map(prev).set(mission.id, e.target.value))}
                          placeholder="Escreva aqui sua reflexão honesta sobre como praticou essa missão... (mínimo 20 caracteres)"
                          className="text-sm min-h-[80px] bg-muted/50 border-border"
                        />
                        <div className="flex items-center justify-between mt-3">
                          <span className={`text-xs ${canSubmit ? "text-success" : "text-muted-foreground"}`}>
                            {reflection.trim().length}/20 caracteres mín.
                          </span>
                          <button
                            onClick={() => handleComplete(mission.id)}
                            disabled={!canSubmit || !!completing}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                              canSubmit
                                ? "bg-primary text-primary-foreground hover:opacity-90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                          >
                            {isCompleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Concluir Missão"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Honesty warning */}
          {missions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 glass rounded-xl p-5 border-destructive/20"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive mb-1">Aviso sobre honestidade</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Você pode até escrever qualquer coisa para ganhar pontos e conseguir mais conteúdo para estudar, 
                    mas você não estará enganando ninguém a não ser <span className="font-bold text-foreground">você mesmo</span>. 
                    Esse espaço existe para que você <span className="italic">realmente</span> pratique e reflita. 
                    Evolução exige verdade.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Aprender;

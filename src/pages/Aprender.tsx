import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Circle, Zap, BookOpen } from "lucide-react";
import { mockMissions, mockUser } from "@/lib/mock-data";
import type { Mission } from "@/lib/mock-data";

const Aprender = () => {
  const [missions, setMissions] = useState<Mission[]>(mockMissions);

  const toggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const completedCount = missions.filter((m) => m.completed).length;
  const totalPoints = missions.filter((m) => m.completed).reduce((s, m) => s + m.points, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Aprendizado</h1>
        <p className="text-sm text-muted-foreground mb-6">Missões diárias para evolução constante</p>
      </motion.div>

      {/* Daily Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <Zap className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">Pontos hoje</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Check className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{completedCount}/{missions.length}</p>
          <p className="text-xs text-muted-foreground">Completas</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{mockUser.missionsCompleted}</p>
          <p className="text-xs text-muted-foreground">Total geral</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground font-medium">Progresso diário</span>
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

      {/* Missions */}
      <div className="space-y-3">
        {missions.map((mission, i) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => toggleMission(mission.id)}
            className={`glass rounded-xl p-4 cursor-pointer transition-all hover:border-primary/20 ${
              mission.completed ? "opacity-70" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                mission.completed
                  ? "bg-success border-success"
                  : "border-border"
              }`}>
                {mission.completed && <Check className="w-3.5 h-3.5 text-foreground" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{mission.icon}</span>
                  <h3 className={`text-sm font-semibold ${mission.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
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
        ))}
      </div>
    </div>
  );
};

export default Aprender;

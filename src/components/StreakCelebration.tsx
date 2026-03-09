import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import confetti from "canvas-confetti";

interface StreakCelebrationProps {
  streak: number;
  onDismiss: () => void;
}

const MILESTONES = [
  { days: 7, title: "1 Semana de Fogo! 🔥", message: "Você manteve a disciplina por 7 dias seguidos. A maioria desiste no terceiro dia.", color: "from-orange-500 to-amber-500" },
  { days: 30, title: "1 Mês Imparável! 💎", message: "30 dias de presença constante. Você já está no top 5% dos membros.", color: "from-blue-500 to-cyan-500" },
  { days: 100, title: "Centurião Mental! 👑", message: "100 dias consecutivos. Você provou que disciplina é seu estilo de vida.", color: "from-yellow-500 to-amber-600" },
];

const StreakCelebration = ({ streak, onDismiss }: StreakCelebrationProps) => {
  const milestone = MILESTONES.find(m => m.days === streak);

  useEffect(() => {
    if (!milestone) return;
    // Fire confetti
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FFD700", "#FF6B00", "#FF3366"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FFD700", "#FF6B00", "#FF3366"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [milestone]);

  if (!milestone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", damping: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
          <button onClick={onDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>

          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${milestone.color} flex items-center justify-center mx-auto mb-5`}
          >
            <Flame className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-foreground mb-2"
          >
            {milestone.title}
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground mb-4"
          >
            {milestone.message}
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary"
          >
            {streak} 🔥
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={onDismiss}
            className="mt-6 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Continuar Evoluindo
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StreakCelebration;

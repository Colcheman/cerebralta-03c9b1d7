import { motion } from "framer-motion";
import { Brain, Lock, Star, Zap, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: BookOpen, text: "Acesso ilimitado ao conteúdo educativo" },
  { icon: Zap, text: "Missões exclusivas e recompensas premium" },
  { icon: Users, text: "Comunidade e grupos de Arquitetos Mentais" },
  { icon: Star, text: "Feed completo com reflexões da comunidade" },
];

const PaywallModal = () => (
  <div className="min-h-[80vh] flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full glass rounded-2xl p-8 text-center"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-gold mb-6">
        <Lock className="w-8 h-8 text-accent-foreground" />
      </div>

      <h2 className="font-display text-2xl font-bold text-foreground mb-2">
        Desbloqueie o Cerebralta
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Assine o plano Premium para acessar todo o ecossistema de evolução mental.
      </p>

      <div className="space-y-3 mb-8 text-left">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <f.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-foreground">{f.text}</span>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-4 mb-6">
        <div className="text-3xl font-bold text-foreground">
          R$ 29<span className="text-lg text-muted-foreground">,90/mês</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Cancele quando quiser</p>
      </div>

      <Button className="w-full bg-gradient-gold text-accent-foreground font-bold py-6 text-base shadow-gold hover:opacity-90">
        Assinar Premium
      </Button>

      <p className="text-xs text-muted-foreground mt-4">
        Pagamento processado via Asaas · Integração em breve
      </p>
    </motion.div>
  </div>
);

export default PaywallModal;

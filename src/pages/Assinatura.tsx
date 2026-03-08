import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, BookOpen, Zap, Users, Star, Crown, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  { icon: BookOpen, text: "Acesso completo a todos os cursos e módulos" },
  { icon: Star, text: "Selo exclusivo de Arquiteto Prime" },
  { icon: Users, text: "Acesso a Grupos Exclusivos Premium" },
  { icon: Zap, text: "Missões avançadas com recompensas dobradas" },
  { icon: Crown, text: "Feed completo e reflexões da comunidade" },
];

const Assinatura = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payMethod, setPayMethod] = useState<"pix" | "card">("pix");
  const [processing, setProcessing] = useState(false);

  const handleSubscription = async () => {
    setProcessing(true);
    // TODO: Call edge function to create Asaas subscription
    // 1. POST to /functions/v1/asaas-checkout with { payMethod, userId }
    // 2. Receive payment link / PIX QR code
    // 3. Redirect user or show QR
    // 4. Webhook updates subscription_tier to 'premium'
    setTimeout(() => {
      setProcessing(false);
      toast({
        title: "Integração Asaas pendente",
        description: "O checkout será ativado quando a API Key do Asaas for configurada.",
      });
    }, 1500);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-gold mb-4">
            <Lock className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Desbloqueie o Cerebralta
          </h1>
          <p className="text-sm text-muted-foreground">
            Olá, <span className="text-foreground font-medium">{profile?.display_name ?? "Arquiteto Mental"}</span>. 
            Assine o Premium para acessar o ecossistema completo.
          </p>
        </div>

        {/* Benefits */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">O que você desbloqueia:</h2>
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="glass rounded-2xl p-6 mb-6 text-center">
          <p className="text-xs text-muted-foreground mb-1">Assinatura mensal</p>
          <p className="text-4xl font-bold text-foreground">
            R$ 29<span className="text-xl text-muted-foreground">,90</span>
            <span className="text-sm text-muted-foreground font-normal">/mês</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Cancele quando quiser</p>
        </div>

        {/* Payment method */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPayMethod("pix")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
              payMethod === "pix" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            PIX
          </button>
          <button
            onClick={() => setPayMethod("card")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
              payMethod === "card" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Cartão de Crédito
          </button>
        </div>

        <Button
          onClick={handleSubscription}
          disabled={processing}
          className="w-full gap-2 bg-gradient-gold text-accent-foreground hover:opacity-90 py-6 text-base font-bold shadow-gold"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
          {processing ? "Processando..." : "Assinar Premium"}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Pagamento processado com segurança via Asaas.
        </p>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full mt-6 py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </motion.div>
    </div>
  );
};

export default Assinatura;

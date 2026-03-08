import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, BookOpen, Users, Award, Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  { icon: BookOpen, text: "Acesso completo a todos os cursos e módulos" },
  { icon: Award, text: "Selo exclusivo de Arquiteto Prime" },
  { icon: Users, text: "Acesso a Grupos Exclusivos Premium" },
  { icon: Zap, text: "Missões avançadas com recompensas dobradas" },
];

const PremiumCheckoutModal = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [payMethod, setPayMethod] = useState<"pix" | "card">("pix");
  const [processing, setProcessing] = useState(false);

  const handleSubscription = async () => {
    setProcessing(true);
    // TODO: Integrate with Asaas API via Edge Function
    // 1. Call edge function to create Asaas subscription
    // 2. Receive payment link or QR code
    // 3. On webhook confirmation, update subscription_tier to 'premium'
    setTimeout(() => {
      setProcessing(false);
      toast({
        title: "Integração Asaas pendente",
        description: "O sistema de pagamento será ativado quando a API Key do Asaas for configurada.",
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5 text-accent" /> Assinar Premium
          </DialogTitle>
        </DialogHeader>

        {/* Benefits */}
        <div className="space-y-3 mt-2">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <b.icon className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-foreground">{b.text}</p>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="glass rounded-xl p-4 mt-4 text-center">
          <p className="text-xs text-muted-foreground">Assinatura mensal</p>
          <p className="text-3xl font-bold text-foreground mt-1">
            R$ 29<span className="text-lg text-muted-foreground">,90</span><span className="text-sm text-muted-foreground">/mês</span>
          </p>
        </div>

        {/* Payment method */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setPayMethod("pix")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              payMethod === "pix" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            PIX
          </button>
          <button
            onClick={() => setPayMethod("card")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              payMethod === "card" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            Cartão de Crédito
          </button>
        </div>

        <Button onClick={handleSubscription} disabled={processing} className="w-full mt-4 gap-2 bg-gradient-gold text-accent-foreground hover:opacity-90">
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
          {processing ? "Processando..." : "Assinar Agora"}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Pagamento processado com segurança via Asaas. Cancele a qualquer momento.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumCheckoutModal;

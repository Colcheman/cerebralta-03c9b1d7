import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface RecoveryEmailPromptProps {
  userId: string;
  onDismiss: () => void;
}

const RecoveryEmailPrompt = ({ userId, onDismiss }: RecoveryEmailPromptProps) => {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ recovery_email: email.trim() })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao salvar. Tente novamente.");
    } else {
      toast.success("✅ E-mail de recuperação salvo!");
      onDismiss();
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass rounded-2xl p-6 max-w-sm w-full border border-destructive/20 shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-base font-bold text-foreground">Proteja sua conta</h2>
            </div>
            <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-1 leading-relaxed">
            Você ainda não cadastrou um <span className="font-semibold text-foreground">e-mail de recuperação</span>. 
            Sem ele, você pode perder acesso à sua conta permanentemente.
          </p>
          <p className="text-xs text-destructive/80 mb-5 font-medium">
            ⚠️ Adicione agora para garantir a segurança da sua conta.
          </p>

          <div className="relative mb-4">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
            >
              Depois
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isValid && !saving
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Salvar e-mail"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecoveryEmailPrompt;

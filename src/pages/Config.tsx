import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Bell, Palette, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Config = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [recoveryEmail, setRecoveryEmail] = useState(profile?.recovery_email ?? "");
  const [savingEmail, setSavingEmail] = useState(false);
  const [twoFactor, setTwoFactor] = useState(profile?.two_factor_enabled ?? false);
  const [notifPush, setNotifPush] = useState(profile?.notification_push ?? true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(profile?.notification_whatsapp ?? false);
  const [notifEmail, setNotifEmail] = useState(profile?.notification_email ?? true);

  const updateProfile = async (field: string, value: any) => {
    if (!user) return;
    await supabase.from("profiles").update({ [field]: value }).eq("user_id", user.id);
  };

  const saveRecoveryEmail = async () => {
    if (!recoveryEmail.trim() || !user) return;
    setSavingEmail(true);
    await updateProfile("recovery_email", recoveryEmail.trim());
    toast({ title: "Email salvo", description: "Seu email de recuperação foi atualizado." });
    setSavingEmail(false);
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: (val: boolean) => void }) => (
    <button
      onClick={() => onToggle(!on)}
      className={`w-11 h-6 rounded-full transition-all ${on ? "bg-primary" : "bg-border"}`}
    >
      <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-sm text-muted-foreground mb-6">Ajuste sua experiência, Arquiteto Mental</p>
      </motion.div>

      <div className="space-y-4">
        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Segurança</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Autenticação 2FA</p>
                <p className="text-xs text-muted-foreground">Proteja sua conta com verificação dupla</p>
              </div>
              <Toggle on={twoFactor} onToggle={(v) => { setTwoFactor(v); updateProfile("two_factor_enabled", v); }} />
            </div>
          </div>
        </motion.div>

        {/* Recovery Email */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recuperação de Senha</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Vincule um email ao seu perfil para receber instruções de recuperação de senha.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={recoveryEmail}
              onChange={e => setRecoveryEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button onClick={saveRecoveryEmail} disabled={!recoveryEmail.trim() || savingEmail} size="sm">
              {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Notificações</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Lembretes diários</p>
                <p className="text-xs text-muted-foreground">Receba lembretes de missões</p>
              </div>
              <Toggle on={notifPush} onToggle={(v) => { setNotifPush(v); updateProfile("notification_push", v); }} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Notificações via WhatsApp</p>
              </div>
              <Toggle on={notifWhatsapp} onToggle={(v) => { setNotifWhatsapp(v); updateProfile("notification_whatsapp", v); }} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Email</p>
                <p className="text-xs text-muted-foreground">Resumo semanal por email</p>
              </div>
              <Toggle on={notifEmail} onToggle={(v) => { setNotifEmail(v); updateProfile("notification_email", v); }} />
            </div>
          </div>
        </motion.div>

        {/* Personalização */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Personalização</h2>
          </div>
          <p className="text-xs text-muted-foreground">Opções de personalização em breve.</p>
        </motion.div>

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Privacidade</h2>
          </div>
          <div className="py-2">
            <p className="text-sm text-foreground">Dados criptografados</p>
            <p className="text-xs text-muted-foreground">Seus dados são protegidos com criptografia de ponta a ponta</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Config;

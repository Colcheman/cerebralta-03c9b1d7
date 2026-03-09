import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Bell, Palette, Lock, Mail, Loader2, KeyRound, User, Camera, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import WhatsAppModal from "@/components/WhatsAppModal";
import { hashPin } from "@/lib/crypto";

const presetColors = [
  "#2563EB", "#1D4ED8", "#1E3A5F", "#0EA5E9", "#4F46E5",
  "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#16A34A",
  "#0D9488", "#CA8A04",
];

const Config = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const { accentHex, setAccentColor } = useTheme();

  // Profile editing
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState((profile as any)?.bio ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recoveryEmail, setRecoveryEmail] = useState(profile?.recovery_email ?? "");
  const [savingEmail, setSavingEmail] = useState(false);
  const [twoFactor, setTwoFactor] = useState(profile?.two_factor_enabled ?? false);
  const [notifPush, setNotifPush] = useState(profile?.notification_push ?? true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(profile?.notification_whatsapp ?? false);
  const [notifEmail, setNotifEmail] = useState(profile?.notification_email ?? true);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [customHex, setCustomHex] = useState(accentHex);


  // App Lock PIN
  const [lockEnabled, setLockEnabled] = useState(!!profile?.app_lock_pin);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStep, setPinStep] = useState<"idle" | "enter" | "confirm">("idle");
  const [savingPin, setSavingPin] = useState(false);

  const updateProfile = async (field: string, value: any) => {
    if (!user) return;
    await supabase.from("profiles").update({ [field]: value }).eq("user_id", user.id);
  };

  const saveProfileInfo = async () => {
    if (!user) return;
    const name = displayName.trim();
    if (!name || name.length > 60) { toast({ title: "Nome inválido", description: "Entre 1 e 60 caracteres.", variant: "destructive" }); return; }
    if (bio.length > 300) { toast({ title: "Bio muito longa", description: "Máximo 300 caracteres.", variant: "destructive" }); return; }
    setSavingProfile(true);
    await supabase.from("profiles").update({ display_name: name, bio: bio.trim() }).eq("user_id", user.id);
    toast({ title: "✅ Perfil atualizado!", description: "As pessoas já podem ver suas novas informações." });
    setSavingProfile(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" }); return; }
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      toast({ title: "📸 Foto atualizada!" });
    }
    setAvatarUploading(false);
  };

  const saveRecoveryEmail = async () => {
    if (!recoveryEmail.trim() || !user) return;
    setSavingEmail(true);
    await updateProfile("recovery_email", recoveryEmail.trim());
    toast({ title: "Email salvo", description: "Seu email de recuperação foi atualizado." });
    setSavingEmail(false);
  };



  const handleWhatsappToggle = (val: boolean) => {
    if (val) setWhatsappModalOpen(true);
    setNotifWhatsapp(val);
    updateProfile("notification_whatsapp", val);
  };

  const handleColorPick = (hex: string) => {
    setCustomHex(hex);
    setAccentColor(hex);
  };

  const handleCustomHexSubmit = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) {
      setAccentColor(customHex);
    } else {
      setCustomHex(accentHex); // Revert invalid input
    }
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: (val: boolean) => void }) => (
    <button onClick={() => onToggle(!on)} className={`w-11 h-6 rounded-full transition-all ${on ? "bg-primary" : "bg-border"}`}>
      <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <WhatsAppModal open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-sm text-muted-foreground mb-6">Ajuste sua experiência, Arquiteto Mental</p>
      </motion.div>

      <div className="space-y-4">
        {/* Edit Profile */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Meu Perfil Público</h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  (displayName || profile?.display_name || "AM").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
              >
                {avatarUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{profile?.display_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.level ?? "Iniciante"}</p>
              <p className="text-xs text-primary mt-0.5 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
                Trocar foto
              </p>
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome de exibição</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={60}
                placeholder="Seu nome no app"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio <span className="text-muted-foreground/50">({bio.length}/300)</span></label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Fale um pouco sobre você, sua jornada mental..."
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <Button onClick={saveProfileInfo} disabled={savingProfile || !displayName.trim()} className="w-full gap-2">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar Perfil
            </Button>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Segurança</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-foreground">Autenticação 2FA</p>
              <p className="text-xs text-muted-foreground">Proteja sua conta com verificação dupla</p>
            </div>
            <Toggle on={twoFactor} onToggle={(v) => { setTwoFactor(v); updateProfile("two_factor_enabled", v); }} />
          </div>
        </motion.div>

        {/* Recovery Email */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recuperação de Senha</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Vincule um email para recuperação de senha.</p>
          <div className="flex gap-2">
            <input type="email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} placeholder="seu@email.com"
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
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
              <div><p className="text-sm text-foreground">Lembretes diários</p><p className="text-xs text-muted-foreground">Receba lembretes de missões</p></div>
              <Toggle on={notifPush} onToggle={(v) => { setNotifPush(v); updateProfile("notification_push", v); }} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm text-foreground">WhatsApp</p><p className="text-xs text-muted-foreground">Notificações via WhatsApp</p></div>
              <Toggle on={notifWhatsapp} onToggle={handleWhatsappToggle} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm text-foreground">Email</p><p className="text-xs text-muted-foreground">Resumo semanal por email</p></div>
              <Toggle on={notifEmail} onToggle={(v) => { setNotifEmail(v); updateProfile("notification_email", v); }} />
            </div>
          </div>
        </motion.div>

        {/* Color Picker */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Acento de Cor</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Escolha qualquer cor para personalizar a interface.</p>
          
          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {presetColors.map(hex => (
              <button
                key={hex}
                onClick={() => handleColorPick(hex)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  accentHex === hex ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>

          {/* Custom hex input */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accentHex}
              onChange={e => handleColorPick(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
            />
            <input
              value={customHex}
              onChange={e => setCustomHex(e.target.value)}
              onBlur={handleCustomHexSubmit}
              onKeyDown={e => e.key === "Enter" && handleCustomHexSubmit()}
              placeholder="#2563EB"
              maxLength={7}
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: accentHex }} />
          </div>
        </motion.div>

        {/* App Lock */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Bloqueio do App</h2>
          </div>
          <div className="flex items-center justify-between py-2 mb-3">
            <div>
              <p className="text-sm text-foreground">Bloquear com PIN</p>
              <p className="text-xs text-muted-foreground">Exige PIN de 4 dígitos ao abrir o app</p>
            </div>
            <Toggle on={lockEnabled} onToggle={(v) => {
              if (v) {
                setPinStep("enter");
                setPinInput("");
                setPinConfirm("");
              } else {
                setLockEnabled(false);
                setPinStep("idle");
                updateProfile("app_lock_pin", null);
                toast({ title: "Bloqueio desativado" });
              }
            }} />
          </div>
          {pinStep === "enter" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Digite um PIN de 4 dígitos:</p>
              <input type="password" inputMode="numeric" maxLength={4} value={pinInput}
                onChange={e => { const v = e.target.value.replace(/\D/g, ""); setPinInput(v); }}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground text-center text-2xl tracking-[1em] font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
              <Button size="sm" disabled={pinInput.length !== 4} onClick={() => { setPinStep("confirm"); setPinConfirm(""); }}>
                Continuar
              </Button>
            </div>
          )}
          {pinStep === "confirm" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Confirme o PIN:</p>
              <input type="password" inputMode="numeric" maxLength={4} value={pinConfirm}
                onChange={e => { const v = e.target.value.replace(/\D/g, ""); setPinConfirm(v); }}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground text-center text-2xl tracking-[1em] font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
              <Button size="sm" disabled={pinConfirm.length !== 4 || savingPin} onClick={async () => {
                if (pinConfirm !== pinInput) {
                  toast({ title: "PINs não coincidem", variant: "destructive" });
                  setPinConfirm("");
                  return;
                }
                setSavingPin(true);
                const hashedPin = await hashPin(pinInput);
                await updateProfile("app_lock_pin", hashedPin);
                setLockEnabled(true);
                setPinStep("idle");
                setSavingPin(false);
                toast({ title: "🔒 PIN ativado!", description: "O app será bloqueado ao abrir." });
              }}>
                {savingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar Bloqueio"}
              </Button>
            </div>
          )}
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

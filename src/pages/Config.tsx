import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FinancialPanel from "@/components/settings/FinancialPanel";
import { Bell, Palette, Lock, Loader2, User, Camera, Check, ImagePlus, MessageSquare, Mail, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import WhatsAppModal from "@/components/WhatsAppModal";

const presetColors = [
  "#2563EB", "#1D4ED8", "#1E3A5F", "#0EA5E9", "#4F46E5",
  "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#16A34A",
  "#0D9488", "#CA8A04",
];

const Config = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { accentHex, setAccentColor } = useTheme();
  const navigate = useNavigate();

  const [displayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState((profile as any)?.bio ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [bannerUrl, setBannerUrl] = useState((profile as any)?.banner_url ?? null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [notifPush, setNotifPush] = useState(profile?.notification_push ?? true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(profile?.notification_whatsapp ?? false);
  const [notifEmail, setNotifEmail] = useState(profile?.notification_email ?? true);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [allowMessagesFrom, setAllowMessagesFrom] = useState((profile as any)?.allow_messages_from ?? "everyone");
  const [customHex, setCustomHex] = useState(accentHex);

  const [whatsappOptIn, setWhatsappOptIn] = useState((profile as any)?.whatsapp_opt_in ?? false);
  const [savingOptIn, setSavingOptIn] = useState(false);

  const updateProfile = async (field: string, value: any) => {
    if (!user) return;
    await supabase.from("profiles").update({ [field]: value }).eq("user_id", user.id);
  };

  const saveProfileInfo = async () => {
    if (!user) return;
    if (bio.length > 300) { toast({ title: "Bio muito longa", description: "Máximo 300 caracteres.", variant: "destructive" }); return; }
    setSavingProfile(true);
    await supabase.from("profiles").update({ bio: bio.trim() }).eq("user_id", user.id);
    toast({ title: "✅ Perfil atualizado!" });
    setSavingProfile(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" }); return; }
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithCacheBust);
      await supabase.from("profiles").update({ avatar_url: urlWithCacheBust }).eq("user_id", user.id);
      await refreshProfile();
      toast({ title: "📸 Foto atualizada!" });
    }
    setAvatarUploading(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: "Máximo 5MB.", variant: "destructive" }); return; }
    setBannerUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/banner.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
      setBannerUrl(publicUrl);
      await supabase.from("profiles").update({ banner_url: publicUrl }).eq("user_id", user.id);
      toast({ title: "🖼️ Banner atualizado!" });
    } else {
      toast({ title: "Erro ao enviar banner", variant: "destructive" });
    }
    setBannerUploading(false);
  };

  const handleWhatsappToggle = (val: boolean) => {
    if (val) setWhatsappModalOpen(true);
    setNotifWhatsapp(val);
    updateProfile("notification_whatsapp", val);
  };

  const handleColorPick = (hex: string) => { setCustomHex(hex); setAccentColor(hex); };

  const handleCustomHexSubmit = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) setAccentColor(customHex);
    else setCustomHex(accentHex);
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
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Meu Perfil Público</h2>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> :
                  (displayName || profile?.display_name || "AM").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
                {avatarUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{profile?.display_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.level ?? "Iniciante"}</p>
              <p className="text-xs text-primary mt-0.5 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>Trocar foto</p>
            </div>
          </div>
          <div className="mb-5">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Banner do perfil</label>
            <div onClick={() => bannerInputRef.current?.click()} className="relative h-24 rounded-xl overflow-hidden cursor-pointer group border border-border">
              {bannerUrl ? <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" /> :
                <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent" />}
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {bannerUploading ? <Loader2 className="w-5 h-5 animate-spin text-foreground" /> :
                  <><ImagePlus className="w-5 h-5 text-foreground" /><span className="text-sm font-medium text-foreground">Trocar banner</span></>}
              </div>
            </div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome de exibição</label>
              <input value={displayName} disabled maxLength={60} placeholder="Seu nome no app"
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/60 cursor-not-allowed" />
              <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Para alterar seu nome, entre em contato com o administrador.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio <span className="text-muted-foreground/50">({bio.length}/300)</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={3}
                placeholder="Fale um pouco sobre você, sua jornada mental..."
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <Button onClick={saveProfileInfo} disabled={savingProfile} className="w-full gap-2">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar Perfil
            </Button>
          </div>
        </motion.div>

        {/* Security Center Card */}
        <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/seguranca")}
          className="w-full glass rounded-2xl p-5 text-left hover:bg-accent/5 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-foreground">Central de Segurança</h2>
              <p className="text-xs text-muted-foreground">Senha, 2FA, PIN, histórico de login e mais</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </motion.button>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
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
          <div className="mt-4 border border-primary/20 rounded-xl p-4 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">Notificações via WhatsApp</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent">🚧 Em breve</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Receba missões diárias e lembretes diretamente no WhatsApp.</p>
                <Button size="sm" variant={whatsappOptIn ? "outline" : "default"} className="gap-1.5" disabled={savingOptIn}
                  onClick={async () => {
                    if (!user) return;
                    setSavingOptIn(true);
                    const newVal = !whatsappOptIn;
                    await supabase.from("profiles").update({ whatsapp_opt_in: newVal } as any).eq("user_id", user.id);
                    setWhatsappOptIn(newVal); setSavingOptIn(false);
                    toast({ title: newVal ? "🔔 Inscrito!" : "Inscrição removida" });
                  }}>
                  {savingOptIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                  {whatsappOptIn ? "✅ Inscrito para lançamento" : "Receber notificações quando lançar"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Message Privacy */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Privacidade de Mensagens</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Escolha quem pode iniciar conversas com você.</p>
          <div className="space-y-2">
            {[
              { value: "everyone", label: "Todos", desc: "Qualquer pessoa pode me enviar mensagens" },
              { value: "friends_only", label: "Apenas amigos", desc: "Só pessoas na minha lista de amigos" },
            ].map(opt => (
              <button key={opt.value}
                onClick={() => { setAllowMessagesFrom(opt.value); updateProfile("allow_messages_from", opt.value); }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${allowMessagesFrom === opt.value ? "border-primary bg-primary/10" : "border-border bg-muted hover:border-primary/50"}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${allowMessagesFrom === opt.value ? "border-primary" : "border-muted-foreground"}`}>
                  {allowMessagesFrom === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Color Picker */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Acento de Cor</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Escolha qualquer cor para personalizar a interface.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {presetColors.map(hex => (
              <button key={hex} onClick={() => handleColorPick(hex)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${accentHex === hex ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: hex }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={accentHex} onChange={e => handleColorPick(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
            <input value={customHex} onChange={e => setCustomHex(e.target.value)}
              onBlur={handleCustomHexSubmit} onKeyDown={e => e.key === "Enter" && handleCustomHexSubmit()}
              placeholder="#2563EB" maxLength={7}
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: accentHex }} />
          </div>
        </motion.div>

        {/* Financial */}
        <FinancialPanel />

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
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

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  KeyRound, Lock, Smartphone, Mail, Phone,
  History, AlertTriangle, Eye, EyeOff, Loader2,
  ChevronRight, CheckCircle2, XCircle, Clock,
  Bell, Globe, Fingerprint, LogOut, Info,
  ArrowLeft, MonitorSmartphone, Activity
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { hashPin } from "@/lib/crypto";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Types ──
interface LoginEntry {
  id: string;
  ip_address: string | null;
  device: string | null;
  browser: string | null;
  location: string | null;
  status: string;
  created_at: string;
}

interface RecoveryEntry {
  id: string;
  ip_address: string | null;
  status: string;
  created_at: string;
}

interface SecuritySettings {
  auto_logout_minutes: number;
  rate_limit_level: string;
  notify_new_login: boolean;
  notify_failed_login: boolean;
  notify_password_change: boolean;
  notify_recovery: boolean;
  notify_breach: boolean;
  notify_via_email: boolean;
  notify_via_platform: boolean;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  auto_logout_minutes: 0,
  rate_limit_level: "medium",
  notify_new_login: true,
  notify_failed_login: true,
  notify_password_change: true,
  notify_recovery: true,
  notify_breach: true,
  notify_via_email: true,
  notify_via_platform: true,
};

// ── Password Strength ──
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score += 20;
  if (pw.length >= 12) score += 10;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 20;
  if (/\d/.test(pw)) score += 20;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 20;
  if (pw.length >= 16) score += 10;
  score = Math.min(score, 100);
  if (score < 30) return { score, label: "Fraca", color: "bg-destructive" };
  if (score < 60) return { score, label: "Razoável", color: "bg-yellow-500" };
  if (score < 80) return { score, label: "Boa", color: "bg-blue-500" };
  return { score, label: "Forte", color: "bg-green-500" };
}

// ── HIBP Check (k-anonymity) ──
async function checkHIBP(password: string): Promise<number> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1 = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return 0;
    const text = await res.text();
    const match = text.split("\n").find(line => line.startsWith(suffix));
    if (match) return parseInt(match.split(":")[1].trim(), 10);
    return 0;
  } catch {
    return 0;
  }
}

// ── Toggle ──
const Toggle = ({ on, onToggle, disabled }: { on: boolean; onToggle: (val: boolean) => void; disabled?: boolean }) => (
  <button onClick={() => !disabled && onToggle(!on)} disabled={disabled}
    className={`w-11 h-6 rounded-full transition-all ${on ? "bg-primary" : "bg-border"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
    <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

// ── Section wrapper ──
const Section = ({ icon: Icon, title, children, className = "" }: { icon: any; title: string; children: React.ReactNode; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`glass rounded-2xl p-5 ${className}`}>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </motion.div>
);

// ── Main Component ──
const SecurityCenter = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  // Navigation
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [hibpCount, setHibpCount] = useState<number | null>(null);
  const [checkingHibp, setCheckingHibp] = useState(false);

  // PIN
  const [lockEnabled, setLockEnabled] = useState(!!profile?.app_lock_pin);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStep, setPinStep] = useState<"idle" | "enter" | "confirm">("idle");
  const [savingPin, setSavingPin] = useState(false);

  // 2FA
  const [twoFactor, setTwoFactor] = useState(profile?.two_factor_enabled ?? false);

  // Recovery
  const [recoveryEmail, setRecoveryEmail] = useState(profile?.recovery_email ?? "");
  const [recoveryPhone, setRecoveryPhone] = useState(profile?.whatsapp_number ?? "");
  const [savingRecovery, setSavingRecovery] = useState(false);

  // History
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Settings
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  // Password strength
  const pwStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  // Check HIBP when password changes
  useEffect(() => {
    if (newPassword.length >= 6) {
      const timer = setTimeout(async () => {
        setCheckingHibp(true);
        const count = await checkHIBP(newPassword);
        setHibpCount(count);
        setCheckingHibp(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setHibpCount(null);
    }
  }, [newPassword]);

  // Load data when panel opens
  useEffect(() => {
    if (!user) return;
    if (activePanel === "history") loadHistory();
    if (activePanel === "notifications" || activePanel === "rate-limit" || activePanel === "auto-logout") loadSettings();
  }, [activePanel, user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const [loginRes, recoveryRes] = await Promise.all([
      supabase.from("login_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("password_recovery_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);
    if (loginRes.data) setLoginHistory(loginRes.data as LoginEntry[]);
    if (recoveryRes.data) setRecoveryHistory(recoveryRes.data as RecoveryEntry[]);
    setLoadingHistory(false);
  };

  const loadSettings = async () => {
    if (!user) return;
    const { data } = await supabase.from("security_settings").select("*").eq("user_id", user.id).maybeSingle();
    if (data) {
      setSettings({
        auto_logout_minutes: data.auto_logout_minutes,
        rate_limit_level: data.rate_limit_level,
        notify_new_login: data.notify_new_login,
        notify_failed_login: data.notify_failed_login,
        notify_password_change: data.notify_password_change,
        notify_recovery: data.notify_recovery,
        notify_breach: data.notify_breach,
        notify_via_email: data.notify_via_email,
        notify_via_platform: data.notify_via_platform,
      });
    }
  };

  const saveSettings = async (partial: Partial<SecuritySettings>) => {
    if (!user) return;
    const updated = { ...settings, ...partial };
    setSettings(updated);
    setSavingSettings(true);
    const { error } = await supabase.from("security_settings").upsert({
      user_id: user.id,
      ...updated,
    }, { onConflict: "user_id" });
    setSavingSettings(false);
    if (!error) toast({ title: "✅ Configuração salva" });
  };

  const updateProfile = async (field: string, value: any) => {
    if (!user) return;
    await supabase.from("profiles").update({ [field]: value }).eq("user_id", user.id);
  };

  // ── Security Score ──
  const securityScore = useMemo(() => {
    let score = 0;
    if (twoFactor) score += 20;
    if (profile?.app_lock_pin) score += 10;
    if (user?.email_confirmed_at) score += 10;
    if (recoveryEmail) score += 10;
    if (recoveryPhone) score += 5;
    // Assume strong password if they have 2FA
    score += 15;
    // Clean history bonus
    score += 10;
    // No breach bonus
    score += 15;
    // Device trust placeholder
    score += 5;
    return Math.min(score, 100);
  }, [twoFactor, profile, user, recoveryEmail, recoveryPhone]);

  const scoreColor = securityScore >= 80 ? "text-green-500" : securityScore >= 50 ? "text-yellow-500" : "text-destructive";
  const scoreLabel = securityScore >= 80 ? "Conta Segura" : securityScore >= 50 ? "Segurança Média" : "Conta Vulnerável";
  const ScoreIcon = securityScore >= 80 ? ShieldCheck : securityScore >= 50 ? Shield : ShieldAlert;

  // ── Recommendations ──
  const recommendations = useMemo(() => {
    const r: { text: string; action?: string }[] = [];
    if (!twoFactor) r.push({ text: "Ative a autenticação 2FA para proteção extra", action: "2fa" });
    if (!profile?.app_lock_pin) r.push({ text: "Configure um PIN de bloqueio do app", action: "pin" });
    if (!recoveryEmail) r.push({ text: "Adicione um email de recuperação", action: "recovery" });
    if (!recoveryPhone) r.push({ text: "Adicione um telefone de recuperação", action: "recovery" });
    return r;
  }, [twoFactor, profile, recoveryEmail, recoveryPhone]);

  const maskedEmail = user?.email
    ? user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "****@****.***";

  // ── Menu items ──
  const menuItems = [
    { id: "password", icon: KeyRound, label: "Alterar Senha", desc: "Atualize sua senha e verifique vazamentos" },
    { id: "2fa", icon: Fingerprint, label: "Autenticação 2FA", desc: twoFactor ? "Ativa" : "Desativada" },
    { id: "pin", icon: Lock, label: "Bloqueio com PIN", desc: lockEnabled ? "PIN ativo" : "Desativado" },
    { id: "recovery", icon: Mail, label: "Recuperação de Conta", desc: "Email e telefone de recuperação" },
    { id: "history", icon: History, label: "Histórico de Segurança", desc: "Logins e recuperações recentes" },
    { id: "auto-logout", icon: LogOut, label: "Logout Automático", desc: "Tempo de inatividade" },
    { id: "rate-limit", icon: Activity, label: "Proteção contra Ataques", desc: "Nível de rate limiting" },
    { id: "notifications", icon: Bell, label: "Alertas de Segurança", desc: "Notificações de eventos" },
    { id: "2fa-apps", icon: Smartphone, label: "Apps 2FA Recomendados", desc: "Google, Microsoft, Authy" },
  ];

  // ── Render panel content ──
  const renderPanel = () => {
    switch (activePanel) {
      case "password":
        return (
          <Section icon={KeyRound} title="Alterar Senha">
            <div className="space-y-3">
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Senha atual"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
              <div className="relative">
                <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mín. 8 caracteres)"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary pr-10" />
                <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Bar */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Força da senha</span>
                    <span className={`text-xs font-semibold ${pwStrength.score >= 80 ? "text-green-500" : pwStrength.score >= 60 ? "text-blue-500" : pwStrength.score >= 30 ? "text-yellow-500" : "text-destructive"}`}>
                      {pwStrength.label}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pwStrength.score}%` }}
                      className={`h-full rounded-full transition-all ${pwStrength.color}`} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {[
                      { check: newPassword.length >= 8, text: "8+ caracteres" },
                      { check: /[A-Z]/.test(newPassword), text: "Maiúscula" },
                      { check: /[0-9]/.test(newPassword), text: "Número" },
                      { check: /[^a-zA-Z0-9]/.test(newPassword), text: "Especial" },
                    ].map(({ check, text }) => (
                      <span key={text} className={`text-[10px] px-2 py-0.5 rounded-full ${check ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}>
                        {check ? "✓" : "○"} {text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* HIBP Alert */}
              {checkingHibp && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Verificando vazamentos...
                </div>
              )}
              {hibpCount !== null && hibpCount > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">⚠️ Senha comprometida!</p>
                    <p className="text-[11px] text-destructive/80">
                      Esta senha apareceu em {hibpCount.toLocaleString()} vazamentos de dados. Escolha outra.
                    </p>
                  </div>
                </motion.div>
              )}
              {hibpCount === 0 && newPassword.length >= 6 && !checkingHibp && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-green-500">Senha não encontrada em vazamentos conhecidos</p>
                </div>
              )}

              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />

              <Button className="w-full gap-2"
                disabled={changingPassword || newPassword.length < 8 || newPassword !== confirmPassword || !currentPassword || (hibpCount !== null && hibpCount > 0)}
                onClick={async () => {
                  if (newPassword !== confirmPassword) {
                    toast({ title: "Senhas não conferem", variant: "destructive" });
                    return;
                  }
                  setChangingPassword(true);
                  const email = user?.email;
                  if (!email) { setChangingPassword(false); return; }
                  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
                  if (signInError) {
                    toast({ title: "Senha atual incorreta", variant: "destructive" });
                    setChangingPassword(false);
                    return;
                  }
                  const { error } = await supabase.auth.updateUser({ password: newPassword });
                  setChangingPassword(false);
                  if (error) {
                    toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: "🔑 Senha alterada com sucesso!" });
                    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                  }
                }}>
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Alterar Senha
              </Button>
            </div>
          </Section>
        );

      case "2fa":
        return (
          <Section icon={Fingerprint} title="Autenticação de Dois Fatores (2FA)">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-foreground font-medium">2FA por Aplicativo</p>
                  <p className="text-xs text-muted-foreground">Use um app autenticador para proteger sua conta</p>
                </div>
                <Toggle on={twoFactor} onToggle={(v) => {
                  setTwoFactor(v);
                  updateProfile("two_factor_enabled", v);
                  toast({ title: v ? "🔐 2FA ativado!" : "2FA desativado" });
                }} />
              </div>

              {twoFactor && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <p className="text-sm font-medium text-foreground">2FA está ativo</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sua conta está protegida com verificação em duas etapas. Ao fazer login em um novo dispositivo,
                    um código será enviado para o seu email: <span className="font-mono text-foreground">{maskedEmail}</span>
                  </p>
                </motion.div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    A verificação 2FA do Cerebralta envia um código de verificação para seu email quando
                    detectamos um login de um dispositivo ou localização nova.
                  </p>
                </div>
              </div>
            </div>
          </Section>
        );

      case "pin":
        return (
          <Section icon={Lock} title="Bloqueio com PIN">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-foreground font-medium">Bloquear com PIN</p>
                  <p className="text-xs text-muted-foreground">Exige PIN de 4 dígitos ao abrir o app</p>
                </div>
                <Toggle on={lockEnabled} onToggle={(v) => {
                  if (v) { setPinStep("enter"); setPinInput(""); setPinConfirm(""); }
                  else {
                    setLockEnabled(false); setPinStep("idle");
                    updateProfile("app_lock_pin", null);
                    toast({ title: "Bloqueio desativado" });
                  }
                }} />
              </div>

              {pinStep === "enter" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-xs text-muted-foreground">Digite um PIN de 4 dígitos:</p>
                  <input type="password" inputMode="numeric" maxLength={4} value={pinInput}
                    onChange={e => setPinInput(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground text-center text-2xl tracking-[1em] font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  <Button size="sm" disabled={pinInput.length !== 4} onClick={() => { setPinStep("confirm"); setPinConfirm(""); }}>
                    Continuar
                  </Button>
                </motion.div>
              )}
              {pinStep === "confirm" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-xs text-muted-foreground">Confirme o PIN:</p>
                  <input type="password" inputMode="numeric" maxLength={4} value={pinConfirm}
                    onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground text-center text-2xl tracking-[1em] font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  <Button size="sm" disabled={pinConfirm.length !== 4 || savingPin} onClick={async () => {
                    if (pinConfirm !== pinInput) {
                      toast({ title: "PINs não coincidem", variant: "destructive" });
                      setPinConfirm(""); return;
                    }
                    setSavingPin(true);
                    const hashedPin = await hashPin(pinInput);
                    await updateProfile("app_lock_pin", hashedPin);
                    setLockEnabled(true); setPinStep("idle"); setSavingPin(false);
                    toast({ title: "🔒 PIN ativado!" });
                  }}>
                    {savingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar Bloqueio"}
                  </Button>
                </motion.div>
              )}
            </div>
          </Section>
        );

      case "recovery":
        return (
          <Section icon={Mail} title="Recuperação de Conta">
            <div className="space-y-5">
              {/* Email principal */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Email principal (login)</span>
                </div>
                <p className="text-sm font-mono text-foreground">{maskedEmail}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Este é o email usado para login e recuperação principal.</p>
              </div>

              {/* Email secundário */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email de recuperação secundário</label>
                <div className="flex gap-2">
                  <input type="email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
                    placeholder="backup@email.com"
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone de recuperação
                  </div>
                </label>
                <input type="tel" value={recoveryPhone} onChange={e => setRecoveryPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                <p className="text-[11px] text-muted-foreground mt-1">Será usado para recuperação futura da conta.</p>
              </div>

              <Button className="w-full gap-2" disabled={savingRecovery} onClick={async () => {
                setSavingRecovery(true);
                await supabase.from("profiles").update({
                  recovery_email: recoveryEmail.trim() || null,
                  whatsapp_number: recoveryPhone.trim() || null,
                }).eq("user_id", user!.id);
                setSavingRecovery(false);
                toast({ title: "✅ Dados de recuperação salvos" });
              }}>
                {savingRecovery ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salvar Recuperação
              </Button>
            </div>
          </Section>
        );

      case "history":
        return (
          <Section icon={History} title="Histórico de Segurança">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-5">
                {/* Login History */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Histórico de Login</h4>
                  {loginHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Nenhum registro de login encontrado</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {loginHistory.map(entry => (
                        <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.status === "success" ? "bg-green-500/10" : "bg-destructive/10"}`}>
                            {entry.status === "success"
                              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                              : <XCircle className="w-4 h-4 text-destructive" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {entry.device || "Dispositivo desconhecido"} • {entry.browser || "—"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              IP: {entry.ip_address || "—"} {entry.location ? `• ${entry.location}` : ""}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[11px] text-muted-foreground">
                              {format(new Date(entry.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                            </p>
                            <span className={`text-[10px] font-medium ${entry.status === "success" ? "text-green-500" : "text-destructive"}`}>
                              {entry.status === "success" ? "Sucesso" : "Falhou"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recovery History */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recuperações de Senha</h4>
                  {recoveryHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma recuperação registrada</p>
                  ) : (
                    <div className="space-y-2">
                      {recoveryHistory.map(entry => (
                        <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <KeyRound className="w-4 h-4 text-yellow-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Recuperação solicitada</p>
                            <p className="text-[11px] text-muted-foreground">IP: {entry.ip_address || "—"}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(entry.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Section>
        );

      case "auto-logout":
        return (
          <Section icon={LogOut} title="Logout Automático">
            <p className="text-xs text-muted-foreground mb-4">
              Defina o tempo de inatividade para logout automático. Protege sua conta se esquecer o app aberto.
            </p>
            <div className="space-y-2">
              {[
                { value: 5, label: "5 minutos", desc: "Máxima segurança" },
                { value: 15, label: "15 minutos", desc: "Recomendado" },
                { value: 60, label: "1 hora", desc: "Uso casual" },
                { value: 0, label: "Nunca", desc: "Menos seguro" },
              ].map(opt => (
                <button key={opt.value}
                  onClick={() => saveSettings({ auto_logout_minutes: opt.value })}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${settings.auto_logout_minutes === opt.value ? "border-primary bg-primary/10" : "border-border bg-muted hover:border-primary/50"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.auto_logout_minutes === opt.value ? "border-primary" : "border-muted-foreground"}`}>
                    {settings.auto_logout_minutes === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        );

      case "rate-limit":
        return (
          <Section icon={Activity} title="Proteção contra Ataques">
            <p className="text-xs text-muted-foreground mb-4">
              Controle o nível de proteção contra tentativas excessivas de login e ações suspeitas.
            </p>
            <div className="space-y-2">
              {[
                { value: "low", label: "Baixo", desc: "Menos bloqueios, mais flexível", icon: "🟢" },
                { value: "medium", label: "Médio", desc: "Equilíbrio entre segurança e usabilidade", icon: "🟡" },
                { value: "high", label: "Alto", desc: "Máxima proteção, pode bloquear ações legítimas", icon: "🔴" },
              ].map(opt => (
                <button key={opt.value}
                  onClick={() => saveSettings({ rate_limit_level: opt.value })}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${settings.rate_limit_level === opt.value ? "border-primary bg-primary/10" : "border-border bg-muted hover:border-primary/50"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.rate_limit_level === opt.value ? "border-primary" : "border-muted-foreground"}`}>
                    {settings.rate_limit_level === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{opt.icon} {opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        );

      case "notifications":
        return (
          <Section icon={Bell} title="Alertas de Segurança">
            <p className="text-xs text-muted-foreground mb-4">Escolha quais eventos geram alertas e por onde recebê-los.</p>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eventos</h4>
              {[
                { key: "notify_new_login" as const, label: "Novo login", desc: "Login de novo dispositivo" },
                { key: "notify_failed_login" as const, label: "Tentativa de login", desc: "Tentativas falhas de acesso" },
                { key: "notify_password_change" as const, label: "Troca de senha", desc: "Quando sua senha for alterada" },
                { key: "notify_recovery" as const, label: "Recuperação", desc: "Solicitação de recuperação" },
                { key: "notify_breach" as const, label: "Vazamento detectado", desc: "Se seus dados forem expostos" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Toggle on={settings[key]} onToggle={(v) => saveSettings({ [key]: v })} />
                </div>
              ))}

              <div className="border-t border-border pt-3 mt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Destino</h4>
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm text-foreground">Dentro da plataforma</p>
                    <p className="text-xs text-muted-foreground">Notificações no Cerebralta</p>
                  </div>
                  <Toggle on={settings.notify_via_platform} onToggle={(v) => saveSettings({ notify_via_platform: v })} />
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground">Receba alertas por email</p>
                  </div>
                  <Toggle on={settings.notify_via_email} onToggle={(v) => saveSettings({ notify_via_email: v })} />
                </div>
              </div>
            </div>
          </Section>
        );

      case "2fa-apps":
        return (
          <Section icon={Smartphone} title="Apps 2FA Recomendados">
            <p className="text-xs text-muted-foreground mb-4">
              Recomendamos estes aplicativos para autenticação de dois fatores:
            </p>
            <div className="space-y-3">
              {[
                { name: "Google Authenticator", desc: "Simples e confiável. Disponível para Android e iOS.", color: "bg-blue-500/10 text-blue-500", icon: "🔵" },
                { name: "Microsoft Authenticator", desc: "Integrado com Microsoft 365. Suporta backup na nuvem.", color: "bg-cyan-500/10 text-cyan-500", icon: "🟦" },
                { name: "Authy", desc: "Backup criptografado na nuvem. Suporta múltiplos dispositivos.", color: "bg-red-500/10 text-red-500", icon: "🔴" },
              ].map(app => (
                <div key={app.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center text-lg`}>
                    {app.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  O Cerebralta utiliza verificação via email para 2FA. No futuro, suportaremos TOTP para uso com esses aplicativos.
                </p>
              </div>
            </div>
          </Section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {activePanel ? (
          <motion.div key="panel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button onClick={() => setActivePanel(null)}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar à Central de Segurança
            </button>
            {renderPanel()}
          </motion.div>
        ) : (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
            {/* Security Score */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ScoreIcon className={`w-6 h-6 ${scoreColor}`} />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Score de Segurança</h3>
                    <p className={`text-xs font-medium ${scoreColor}`}>{scoreLabel}</p>
                  </div>
                </div>
                <div className={`text-3xl font-bold font-mono ${scoreColor}`}>
                  {securityScore}
                  <span className="text-sm text-muted-foreground font-normal">/100</span>
                </div>
              </div>

              <div className="h-3 rounded-full bg-muted overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${securityScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${securityScore >= 80 ? "bg-green-500" : securityScore >= 50 ? "bg-yellow-500" : "bg-destructive"}`}
                />
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recomendações</p>
                  {recommendations.map((rec, i) => (
                    <button key={i} onClick={() => rec.action && setActivePanel(rec.action)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10 transition-colors text-left">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <p className="text-xs text-foreground flex-1">{rec.text}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {recommendations.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <p className="text-xs text-green-500 font-medium">Todas as recomendações de segurança foram atendidas!</p>
                </div>
              )}
            </motion.div>

            {/* Menu Items */}
            <div className="space-y-2">
              {menuItems.map((item, i) => (
                <motion.button key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setActivePanel(item.id)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl glass hover:bg-accent/5 transition-all text-left group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </motion.button>
              ))}
            </div>

            {/* New Device Info */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-5 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <MonitorSmartphone className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Verificação de Novo Dispositivo</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Quando você fizer login em um novo dispositivo, o Cerebralta irá:
              </p>
              <div className="space-y-2">
                {[
                  { step: "1", text: "Verificar suas credenciais (email + senha)" },
                  { step: "2", text: `Enviar código de verificação para ${maskedEmail}` },
                  { step: "3", text: "Solicitar confirmação 2FA (se ativado)" },
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                      {s.step}
                    </div>
                    <p className="text-xs text-foreground">{s.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecurityCenter;

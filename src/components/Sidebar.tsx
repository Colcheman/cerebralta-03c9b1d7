import { NavLink, useNavigate } from "react-router-dom";
import { Brain, Flame, BookOpen, Trophy, UserPlus, Users, Settings, LogOut, Info, Shield, MessageCircle, BookMarked, Target, TrendingDown, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUnreadCount } from "@/lib/notifications";

const socialItems = [
  { to: "/feed", icon: Flame, label: "Feed" },
  { to: "/notificacoes", icon: Bell, label: "Notificações" },
  { to: "/mensagens", icon: MessageCircle, label: "Mensagens" },
  { to: "/amigos", icon: UserPlus, label: "Amigos" },
  { to: "/grupos", icon: Users, label: "Grupos" },
];

const devItems = [
  { to: "/aprender", icon: BookOpen, label: "Missões" },
  { to: "/metas", icon: Target, label: "Minhas Metas" },
  { to: "/conquistas", icon: Trophy, label: "Conquistas" },
  { to: "/aprendizado", icon: BookOpen, label: "Aprendizado" },
];

const otherItems = [
  { to: "/config", icon: Settings, label: "Configurações" },
  { to: "/manual", icon: BookMarked, label: "Manual" },
  { to: "/sobre", icon: Info, label: "Sobre" },
];

const Sidebar = () => {
  const { logout, profile, user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const displayName = profile?.display_name ?? "Arquiteto Mental";
  const level = profile?.level ?? "Iniciante";
  const points = profile?.points ?? 0;
  const streak = profile?.streak ?? 0;
  const levelThresholds = [0, 100, 500, 1500, 3000, 5000, 10000];
  const currentThresholdIdx = levelThresholds.filter(t => points >= t).length - 1;
  const nextLevel = levelThresholds[Math.min(currentThresholdIdx + 1, levelThresholds.length - 1)];
  const prevLevel = levelThresholds[currentThresholdIdx] ?? 0;
  const progressPercent = nextLevel === prevLevel ? 100 : Math.min(((points - prevLevel) / (nextLevel - prevLevel)) * 100, 100);
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const adminItem = isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : [];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-card border-r border-border fixed left-0 top-0 z-30">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display text-xl font-bold text-foreground">Cerebralta</span>
      </div>

      <div className="px-4 py-5">
        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-accent font-medium">{level}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{points} pts</span>
              <span className="text-muted-foreground">{nextLevel} pts</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-gold rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <Flame className="w-4 h-4 text-streak" />
            <span className="text-xs font-semibold text-streak">{streak} dias seguidos</span>
          </div>

          {/* Discount info */}
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Seu desconto</span>
            </div>
            {(() => {
              const discount = streak >= 30 ? 75 : streak >= 20 ? 45 : streak >= 10 ? 25 : 0;
              const price = +(52.90 * (1 - discount / 100)).toFixed(2);
              const nextTier = streak < 10 ? { days: 10, disc: 25 } : streak < 20 ? { days: 20, disc: 45 } : streak < 30 ? { days: 30, disc: 75 } : null;
              return (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-black text-primary">{discount}%</span>
                    <span className="text-xs text-muted-foreground">
                      R$ {price.toFixed(2).replace(".", ",")}/mês
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        discount >= 75 ? "bg-gradient-to-r from-primary to-accent" : discount >= 45 ? "bg-primary" : discount >= 25 ? "bg-primary/70" : "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>10d=25%</span>
                    <span>20d=45%</span>
                    <span>30d=75%</span>
                  </div>
                  {nextTier && (
                    <p className="text-[10px] text-muted-foreground">
                      Faltam <span className="font-bold text-foreground">{nextTier.days - streak}d</span> para {nextTier.disc}%
                    </p>
                  )}
                  {discount >= 75 && (
                    <p className="text-[10px] text-accent font-medium">🎉 Desconto máximo!</p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        <div>
          <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Rede Social</p>
          <div className="space-y-1">
            {socialItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon className="w-5 h-5" />{label}
              </NavLink>
            ))}
          </div>
        </div>
        <div>
          <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Desenvolvimento Pessoal</p>
          <div className="space-y-1">
            {devItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon className="w-5 h-5" />{label}
              </NavLink>
            ))}
          </div>
        </div>
        <div>
          <div className="space-y-1">
            {[...otherItems, ...adminItem].map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon className="w-5 h-5" />{label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

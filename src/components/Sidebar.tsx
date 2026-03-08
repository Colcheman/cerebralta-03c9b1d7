import { NavLink, useNavigate } from "react-router-dom";
import { Brain, Flame, BookOpen, Trophy, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/feed", icon: Flame, label: "Feed" },
  { to: "/aprender", icon: BookOpen, label: "Aprender" },
  { to: "/conquistas", icon: Trophy, label: "Conquistas" },
  { to: "/grupos", icon: Users, label: "Grupos" },
  { to: "/config", icon: Settings, label: "Configurações" },
];

const Sidebar = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const displayName = profile?.display_name ?? "Arquitéto Mental";
  const level = profile?.level ?? "Iniciante";
  const points = profile?.points ?? 0;
  const streak = profile?.streak ?? 0;
  const nextLevel = 1500; // TODO: calculate from LEVELS
  const progressPercent = Math.min((points / nextLevel) * 100, 100);
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-card border-r border-border fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display text-xl font-bold text-foreground">Cerebralta</span>
      </div>

      {/* User card */}
      <div className="px-4 py-5">
        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              {initials}
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
              <div
                className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <Flame className="w-4 h-4 text-streak" />
            <span className="text-xs font-semibold text-streak">{streak} dias de streak</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
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

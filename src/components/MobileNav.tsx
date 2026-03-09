import { NavLink } from "react-router-dom";
import { Flame, BookOpen, Trophy, Users, MessageCircle, UserPlus } from "lucide-react";

const items = [
  { to: "/feed", icon: Flame, label: "Feed" },
  { to: "/mensagens", icon: MessageCircle, label: "Chat" },
  { to: "/aprendizado", icon: BookOpen, label: "Aprender" },
  { to: "/conquistas", icon: Trophy, label: "Conquistas" },
  { to: "/grupos", icon: Users, label: "Grupos" },
];

const MobileNav = () => (
  <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-30 px-2 pb-safe">
    <div className="flex items-center justify-around py-2">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default MobileNav;

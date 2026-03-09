import { NavLink } from "react-router-dom";
import { Flame, BookOpen, Trophy, MessageCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Settings, Info, Target, BookMarked } from "lucide-react";

const mainItems = [
  { to: "/feed", icon: Flame, label: "Feed" },
  { to: "/mensagens", icon: MessageCircle, label: "Chat" },
  { to: "/aprender", icon: Target, label: "Missões" },
  { to: "/aprendizado", icon: BookOpen, label: "Estudar" },
  { to: "/conquistas", icon: Trophy, label: "Troféus" },
];

const moreItems = [
  { to: "/amigos", icon: UserPlus, label: "Amigos" },
  { to: "/grupos", icon: Users, label: "Grupos" },
  { to: "/manual", icon: BookMarked, label: "Manual" },
  { to: "/config", icon: Settings, label: "Config" },
  { to: "/sobre", icon: Info, label: "Sobre" },
];

const MobileNav = () => {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setShowMore(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-20 left-4 right-4 bg-card border border-border rounded-2xl p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-4 gap-3">
                {moreItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all ${
                        isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-30 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {mainItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] transition-all ${
              showMore ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;

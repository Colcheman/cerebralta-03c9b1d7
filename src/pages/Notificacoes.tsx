import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, CheckCheck, Clock, User, Shield, Info, Filter, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { markAsRead, markAllAsRead, type AppNotification, type NotificationType } from "@/lib/notifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReportModal from "@/components/ReportModal";

const typeConfig: Record<NotificationType, { icon: typeof Shield; label: string; color: string; bg: string }> = {
  system: { icon: Shield, label: "Sistema", color: "text-primary", bg: "bg-primary/10" },
  user: { icon: User, label: "Usuário", color: "text-accent", bg: "bg-accent/10" },
  informational: { icon: Info, label: "Informacional", color: "text-green-400", bg: "bg-green-400/10" },
};

const Notificacoes = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const [reportNotification, setReportNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      setNotifications((data as unknown as AppNotification[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Mark unread as read on mount (after 1s)
  useEffect(() => {
    if (!user || loading) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const timer = setTimeout(async () => {
      await markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, loading, notifications]);

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatFullDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return format(d, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Notificações</h1>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={async () => {
              if (!user) return;
              await markAllAsRead(user.id);
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }}
          >
            <CheckCheck className="w-3.5 h-3.5" /> Marcar tudo como lido
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "system", "user", "informational"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "Todas" : typeConfig[f].label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <BellOff className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((n, i) => {
              const cfg = typeConfig[n.type] || typeConfig.system;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`p-4 rounded-xl border transition-colors ${
                    n.read
                      ? "bg-card border-border/50"
                      : "bg-card border-primary/30 shadow-sm shadow-primary/5"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${n.read ? "text-foreground/80" : "text-foreground"}`}>
                          {n.title}
                        </h3>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatFullDate(n.created_at)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          por {n.sender_label}
                        </span>
                        <button
                          onClick={() => setReportNotification(n)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5 ml-auto"
                          title="Denunciar notificação"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notificacoes;

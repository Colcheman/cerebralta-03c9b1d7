import { useState, useEffect } from "react";
import { Flag, Loader2, CheckCircle2, Clock, XCircle, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ReportItemType } from "@/components/ReportModal";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  reported_item_id: string | null;
  reported_item_type: ReportItemType;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  reviewed: "bg-primary/20 text-primary",
  dismissed: "bg-muted text-muted-foreground",
  resolved: "bg-green-500/20 text-green-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  reviewed: "Em análise",
  dismissed: "Dispensada",
  resolved: "Resolvida",
};

const typeLabels: Record<string, string> = {
  user: "👤 Usuário",
  post: "📝 Publicação",
  course: "📚 Curso",
  group: "👥 Grupo",
  mission: "🎯 Missão",
  notification: "🔔 Notificação",
  chat_message: "💬 Mensagem",
};

const typeFilters = ["all", "user", "post", "course", "group", "mission", "notification", "chat_message"] as const;

const AdminReportsPanel = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!data) { setLoading(false); return; }

    const userIds = [...new Set([
      ...data.map((r: any) => r.reporter_id),
      ...data.filter((r: any) => r.reported_user_id).map((r: any) => r.reported_user_id),
    ])];
    const { data: profiles } = await supabase.from("safe_profiles").select("user_id, display_name").in("user_id", userIds);
    const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) ?? []);

    setReports(data.map((r: any) => ({
      ...r,
      reporter_name: nameMap.get(r.reporter_id) ?? "Desconhecido",
      reported_name: r.reported_user_id ? (nameMap.get(r.reported_user_id) ?? "Desconhecido") : null,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = async (reportId: string, newStatus: string) => {
    await (supabase as any).from("reports").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    toast({ title: `Status atualizado: ${statusLabels[newStatus]}` });
  };

  const getTimeSince = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days < 1) return "Hoje";
    if (days === 1) return "1 dia";
    return `${days} dias`;
  };

  const filtered = filter === "all" ? reports : reports.filter(r => r.reported_item_type === filter);

  const counts = reports.reduce((acc, r) => {
    acc[r.reported_item_type] = (acc[r.reported_item_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Flag className="w-5 h-5 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">Denúncias ({reports.length})</h3>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {typeFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `Todas (${reports.length})` : `${typeLabels[f] || f} (${counts[f] || 0})`}
          </button>
        ))}
      </div>

      {/* Pending count */}
      {reports.filter(r => r.status === "pending").length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-medium text-yellow-400">
            {reports.filter(r => r.status === "pending").length} denúncia(s) pendente(s)
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma denúncia {filter !== "all" ? "nesta categoria" : "registrada"}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {typeLabels[r.reported_item_type] || r.reported_item_type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {r.reported_name ? (
                      <><span className="text-destructive">{r.reported_name}</span> denunciado por </>
                    ) : (
                      <>Denunciado por </>
                    )}
                    <span className="text-muted-foreground">{r.reporter_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{getTimeSince(r.created_at)}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[r.status] ?? statusColors.pending}`}>
                  {statusLabels[r.status] ?? r.status}
                </span>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-medium text-foreground mb-1">Motivo: {r.reason}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                {r.reported_item_id && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">ID: {r.reported_item_id}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => updateStatus(r.id, "reviewed")}>
                  <Clock className="w-3 h-3" /> Em análise
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => updateStatus(r.id, "resolved")}>
                  <CheckCircle2 className="w-3 h-3" /> Resolvida
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => updateStatus(r.id, "dismissed")}>
                  <XCircle className="w-3 h-3" /> Dispensar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReportsPanel;

import { useState, useEffect } from "react";
import { Flag, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_post_id: string | null;
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

const AdminReportsPanel = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) { setLoading(false); return; }

    // Get profile names
    const userIds = [...new Set([...data.map((r: any) => r.reporter_id), ...data.map((r: any) => r.reported_user_id)])];
    const { data: profiles } = await supabase.from("safe_profiles").select("user_id, display_name").in("user_id", userIds);
    const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) ?? []);

    setReports(data.map((r: any) => ({
      ...r,
      reporter_name: nameMap.get(r.reporter_id) ?? "Desconhecido",
      reported_name: nameMap.get(r.reported_user_id) ?? "Desconhecido",
    })));
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = async (reportId: string, newStatus: string) => {
    await supabase.from("reports").update({ status: newStatus, updated_at: new Date().toISOString() } as any).eq("id", reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    toast({ title: `Status atualizado: ${statusLabels[newStatus]}` });
  };

  const getTimeSince = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days < 1) return "Hoje";
    if (days === 1) return "1 dia";
    return `${days} dias`;
  };

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Flag className="w-5 h-5 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">Denúncias ({reports.length})</h3>
      </div>

      {reports.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma denúncia registrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    <span className="text-destructive">{r.reported_name}</span> denunciado por <span className="text-muted-foreground">{r.reporter_name}</span>
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

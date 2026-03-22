import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Receipt, Calendar, TrendingDown, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BillingRecord {
  id: string;
  month: number;
  year: number;
  active_days: number;
  discount_percent: number;
  base_amount: number;
  final_amount: number;
  status: string;
  created_at: string;
}

const MONTH_NAMES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  paid: { icon: CheckCircle, label: "Pago", color: "text-green-500" },
  pending: { icon: Clock, label: "Pendente", color: "text-yellow-500" },
  overdue: { icon: AlertCircle, label: "Atrasado", color: "text-destructive" },
  cancelled: { icon: AlertCircle, label: "Cancelado", color: "text-muted-foreground" },
};

const BillingHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("billing_history")
        .select("*")
        .eq("user_id", user.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(12);
      setRecords((data as BillingRecord[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Histórico de Cobranças</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8">
          <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada ainda.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Suas faturas aparecerão aqui quando geradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const cfg = statusConfig[record.status] ?? statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {MONTH_NAMES[record.month]} {record.year}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {record.active_days} dias ativos
                      </span>
                      {record.discount_percent > 0 && (
                        <span className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          {record.discount_percent}% desc.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    R$ {Number(record.final_amount).toFixed(2).replace(".", ",")}
                  </p>
                  {record.discount_percent > 0 && (
                    <p className="text-[10px] text-muted-foreground line-through">
                      R$ {Number(record.base_amount).toFixed(2).replace(".", ",")}
                    </p>
                  )}
                  <div className={`flex items-center gap-1 justify-end mt-0.5 ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{cfg.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current month info */}
      <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground">
          💡 Sua fatura é gerada automaticamente no início de cada mês com base nos seus dias ativos do mês anterior.
          Quanto mais ativo, maior o desconto.
        </p>
      </div>
    </motion.div>
  );
};

export default BillingHistory;

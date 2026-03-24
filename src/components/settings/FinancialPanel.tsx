import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Calendar, AlertTriangle, Clock, Bell, BellOff,
  Crown, XCircle, Loader2, Receipt, TrendingDown, CheckCircle,
  AlertCircle, FileText, ShieldAlert
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BillingRecord {
  id: string;
  month: number;
  year: number;
  active_days: number;
  discount_percent: number;
  base_amount: number;
  final_amount: number;
  fine_amount: number;
  status: string;
  subscription_start: string | null;
  subscription_end: string | null;
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
  fined: { icon: AlertTriangle, label: "Multa aplicada", color: "text-orange-500" },
  cancelled: { icon: XCircle, label: "Cancelado", color: "text-muted-foreground" },
};

const FinancialPanel = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"subscription" | "payments">("subscription");
  const [notifyDays, setNotifyDays] = useState((profile as any)?.billing_notify_days_before ?? 5);
  const [notifyEnabled, setNotifyEnabled] = useState((profile as any)?.billing_notifications_enabled ?? true);
  const [savingNotify, setSavingNotify] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Billing data form (sent only to Asaas, not stored)
  const [billingPhone, setBillingPhone] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingDoc, setBillingDoc] = useState("");
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cpf");
  const [savingBilling, setSavingBilling] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchBilling = async () => {
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
    fetchBilling();
  }, [user]);

  const isPremium = profile?.subscription_tier === "premium";
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();

  // Payment window: day 20 of previous month to day 10 of current month
  const paymentWindowOpen = currentDay >= 20 || currentDay <= 10;

  // Next invoice info
  const nextInvoiceMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextInvoiceYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const dueDate = new Date(currentYear, currentMonth - 1, 10);
  const paymentStartDate = new Date(
    currentMonth === 1 ? currentYear - 1 : currentYear,
    currentMonth === 1 ? 11 : currentMonth - 2,
    20
  );

  const currentBill = records.find(r => r.month === currentMonth && r.year === currentYear);
  const hasFine = currentBill && Number(currentBill.fine_amount) > 0;

  const updateNotifyPrefs = async (days: number, enabled: boolean) => {
    if (!user) return;
    setSavingNotify(true);
    await supabase.from("profiles").update({
      billing_notify_days_before: days,
      billing_notifications_enabled: enabled,
    } as any).eq("user_id", user.id);
    setSavingNotify(false);
    toast({ title: "✅ Preferências salvas" });
  };

  const handleSaveBillingData = async () => {
    if (!billingEmail.trim() && !billingPhone.trim() && !billingDoc.trim()) {
      toast({ title: "Preencha ao menos um campo", variant: "destructive" });
      return;
    }
    setSavingBilling(true);
    try {
      const { error } = await supabase.functions.invoke("update-asaas-customer", {
        body: {
          phone: billingPhone.trim() || undefined,
          email: billingEmail.trim() || undefined,
          cpfCnpj: billingDoc.trim() || undefined,
        },
      });
      if (error) throw error;
      toast({ title: "✅ Dados de cobrança atualizados no Asaas" });
    } catch {
      toast({ title: "Erro ao atualizar dados", description: "Tente novamente mais tarde.", variant: "destructive" });
    }
    setSavingBilling(false);
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    setCancelling(true);
    await supabase.from("profiles").update({ subscription_tier: "free" } as any).eq("user_id", user.id);
    await refreshProfile();
    setCancelling(false);
    setCancelConfirm(false);
    toast({ title: "Assinatura cancelada", description: "Você ainda pode usar o plano gratuito." });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Financeiro</h2>
          {isPremium && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border -mx-5 px-5">
          {(["subscription", "payments"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium relative transition-colors ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "subscription" ? "Assinatura" : "Pagamentos"}
              {tab === t && (
                <motion.div layoutId="financialtab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {tab === "subscription" ? (
          <div className="space-y-4">
            {/* Subscription Status */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className={`text-xs font-bold ${isPremium ? "text-accent" : "text-muted-foreground"}`}>
                  {isPremium ? "✨ Ativo" : "Gratuito"}
                </span>
              </div>
              {isPremium && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Expira em</span>
                    <span className="text-xs font-medium text-foreground">
                      Dia 20/{currentMonth < 10 ? `0${currentMonth}` : currentMonth}/{currentYear}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Próxima fatura</span>
                    <span className="text-xs font-medium text-foreground">
                      {MONTH_NAMES[nextInvoiceMonth]} {nextInvoiceYear}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Next Invoice Card */}
            {isPremium && currentBill && (
              <div className={`p-4 rounded-xl border ${hasFine ? "border-orange-500/30 bg-orange-500/5" : "border-primary/20 bg-primary/5"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className={`w-4 h-4 ${hasFine ? "text-orange-500" : "text-primary"}`} />
                  <span className="text-xs font-semibold text-foreground">Fatura Atual</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      R$ {(Number(currentBill.final_amount) + Number(currentBill.fine_amount)).toFixed(2).replace(".", ",")}
                    </p>
                    {hasFine && (
                      <p className="text-[10px] text-orange-500 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        Inclui multa de R$ {Number(currentBill.fine_amount).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                    {currentBill.discount_percent > 0 && (
                      <p className="text-[10px] text-primary flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> {currentBill.discount_percent}% de desconto
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Vencimento</p>
                    <p className="text-xs font-medium text-foreground">10/{currentMonth < 10 ? `0${currentMonth}` : currentMonth}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground">
                    {paymentWindowOpen
                      ? "✅ Janela de pagamento aberta (dia 20 ao dia 10)"
                      : `⏳ Pagamento disponível a partir do dia 20/${(currentMonth === 1 ? 12 : currentMonth - 1).toString().padStart(2, "0")}`}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Window Info */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                📅 <strong>Janela de pagamento:</strong> Dia 20 ao dia 10 do mês seguinte.
                <br />⚠️ <strong>Multa:</strong> Após o dia 15, é aplicada multa proporcional ao desconto por recorrência.
                <br />🚫 <strong>Suspensão:</strong> Após o dia 20 sem pagamento, o plano Premium é suspenso automaticamente.
              </p>
            </div>

            {/* Notification Preferences */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Notificações de Fatura</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Notificar antes do vencimento</p>
                  <p className="text-xs text-muted-foreground">Receba lembrete de fatura</p>
                </div>
                <button
                  onClick={() => {
                    const v = !notifyEnabled;
                    setNotifyEnabled(v);
                    updateNotifyPrefs(notifyDays, v);
                  }}
                  className={`w-11 h-6 rounded-full transition-all ${notifyEnabled ? "bg-primary" : "bg-border"}`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${notifyEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {notifyEnabled && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Notificar quantos dias antes?</p>
                  <div className="flex gap-2">
                    {[3, 5, 7, 10].map(d => (
                      <button
                        key={d}
                        onClick={() => { setNotifyDays(d); updateNotifyPrefs(d, notifyEnabled); }}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${notifyDays === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                      >
                        {d} dias
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Billing Data for Asaas */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Dados de Cobrança</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong className="text-amber-600">Aviso de privacidade:</strong> Estes dados são enviados <strong>exclusivamente para o Asaas</strong> (processador de pagamentos) e <strong>NÃO são coletados, armazenados ou acessados pela Alluzion Corporate</strong>. A Alluzion não tem acesso a nenhuma dessas informações.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Email para cobrança</label>
                  <input
                    value={billingEmail}
                    onChange={e => setBillingEmail(e.target.value)}
                    placeholder="seu@email.com"
                    type="email"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Telefone</label>
                  <input
                    value={billingPhone}
                    onChange={e => setBillingPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <div className="flex gap-2 mb-1">
                    {(["cpf", "cnpj"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setDocType(t)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${docType === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <input
                    value={billingDoc}
                    onChange={e => setBillingDoc(e.target.value)}
                    placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0001-00"}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <Button onClick={handleSaveBillingData} disabled={savingBilling} size="sm" className="w-full gap-1.5">
                {savingBilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Salvar dados no Asaas
              </Button>
            </div>

            {/* Cancel Subscription */}
            {isPremium && (
              <div className="pt-2">
                {!cancelConfirm ? (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="w-full text-center text-xs text-destructive hover:underline py-2"
                  >
                    Cancelar assinatura
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <p className="text-sm font-semibold text-foreground">Cancelar assinatura?</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Você perderá acesso a todos os recursos Premium imediatamente. Suas faturas pendentes ainda precisarão ser pagas.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setCancelConfirm(false)}>
                        Manter
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1 gap-1" onClick={handleCancelSubscription} disabled={cancelling}>
                        {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Payments Tab */
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Suas faturas aparecerão aqui quando geradas.</p>
              </div>
            ) : (
              records.map(record => {
                const cfg = statusConfig[record.status] ?? statusConfig.pending;
                const StatusIcon = cfg.icon;
                const totalAmount = Number(record.final_amount) + Number(record.fine_amount);
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{MONTH_NAMES[record.month]} {record.year}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{record.active_days} dias ativos</span>
                          {record.discount_percent > 0 && (
                            <span className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                              <TrendingDown className="w-3 h-3" /> {record.discount_percent}%
                            </span>
                          )}
                          {Number(record.fine_amount) > 0 && (
                            <span className="text-[10px] font-medium text-orange-500 flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Multa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">R$ {totalAmount.toFixed(2).replace(".", ",")}</p>
                      {record.discount_percent > 0 && (
                        <p className="text-[10px] text-muted-foreground line-through">R$ {Number(record.base_amount).toFixed(2).replace(".", ",")}</p>
                      )}
                      <div className={`flex items-center gap-1 justify-end mt-0.5 ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                💡 Sua fatura é gerada automaticamente no início de cada mês com base nos seus dias ativos do mês anterior.
                Quanto mais ativo, maior o desconto.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FinancialPanel;

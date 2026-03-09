import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingDown, Calendar, Target, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DiscountPanelProps {
  userId: string;
}

const TIERS = [
  { days: 30, discount: 75, price: 13.23, label: "Máximo" },
  { days: 20, discount: 45, price: 29.10, label: "Intermediário" },
  { days: 10, discount: 25, price: 39.68, label: "Básico" },
];

const BASE_PRICE = 52.90;

const DiscountPanel = ({ userId }: DiscountPanelProps) => {
  const [activeDays, setActiveDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveDays = async () => {
      const now = new Date();
      const { data } = await supabase.rpc("get_monthly_active_days", {
        _user_id: userId,
        _year: now.getFullYear(),
        _month: now.getMonth() + 1,
      });
      setActiveDays(data ?? 0);
      setLoading(false);
    };
    fetchActiveDays();
  }, [userId]);

  const currentDiscount = activeDays >= 30 ? 75 : activeDays >= 20 ? 45 : activeDays >= 10 ? 25 : 0;
  const currentPrice = +(BASE_PRICE * (1 - currentDiscount / 100)).toFixed(2);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const progress = Math.min((activeDays / daysInMonth) * 100, 100);

  // Next tier
  const nextTier = TIERS.find((t) => activeDays < t.days);
  const daysToNext = nextTier ? nextTier.days - activeDays : 0;

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Seu Desconto Este Mês</h3>
      </div>

      {/* Current status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-primary">
              {currentDiscount}%
            </span>
            <span className="text-xs text-muted-foreground">de desconto</span>
          </div>
          <p className="text-lg font-bold text-foreground mt-0.5">
            R$ {currentPrice.toFixed(2).replace(".", ",")}
            <span className="text-xs text-muted-foreground font-normal ml-1">
              /mês
            </span>
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <Flame className="w-4 h-4 text-streak" />
            <span className="text-2xl font-black text-foreground">{activeDays}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            dias ativos de {daysInMonth}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
          {/* Tier markers */}
          {TIERS.map((tier) => (
            <div
              key={tier.days}
              className="absolute top-0 bottom-0 w-px bg-border"
              style={{ left: `${(tier.days / daysInMonth) * 100}%` }}
            />
          ))}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              currentDiscount >= 75
                ? "bg-gradient-to-r from-primary to-accent"
                : currentDiscount >= 45
                ? "bg-primary"
                : currentDiscount >= 25
                ? "bg-primary/70"
                : "bg-muted-foreground/40"
            }`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0</span>
          <span>10d (25%)</span>
          <span>20d (45%)</span>
          <span>30d (75%)</span>
        </div>
      </div>

      {/* Next goal */}
      {nextTier && (
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
          <Target className="w-4 h-4 text-accent shrink-0" />
          <p className="text-xs text-muted-foreground">
            Faltam <span className="font-bold text-foreground">{daysToNext} dias</span> para
            atingir <span className="font-bold text-primary">{nextTier.discount}% de desconto</span>{" "}
            (R$ {nextTier.price.toFixed(2).replace(".", ",")}/mês)
          </p>
        </div>
      )}

      {currentDiscount >= 75 && (
        <div className="flex items-center gap-2 rounded-xl bg-accent/10 p-3">
          <Calendar className="w-4 h-4 text-accent shrink-0" />
          <p className="text-xs text-accent font-medium">
            🎉 Parabéns! Você atingiu o desconto máximo este mês!
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default DiscountPanel;

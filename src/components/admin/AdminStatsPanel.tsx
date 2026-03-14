import { useState, useEffect } from "react";
import { Users, FileText, Target, TrendingUp, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminStatsPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisWeek: 0,
    totalPosts: 0,
    totalGoals: 0,
    avgStreak: 0,
    premiumUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [profilesRes, newUsersRes, postsRes, goalsRes] = await Promise.all([
        supabase.from("profiles").select("streak, subscription_tier"),
        supabase.from("profiles").select("id", { count: "exact" }).gte("created_at", oneWeekAgo),
        supabase.from("posts").select("id", { count: "exact" }),
        supabase.from("user_goals").select("id", { count: "exact" }),
      ]);

      const profiles = profilesRes.data ?? [];
      const avgStreak = profiles.length > 0
        ? Math.round(profiles.reduce((sum, p: any) => sum + (p.streak || 0), 0) / profiles.length)
        : 0;
      const premiumCount = profiles.filter((p: any) => p.subscription_tier === "premium").length;

      setStats({
        totalUsers: profiles.length,
        newUsersThisWeek: newUsersRes.count ?? 0,
        totalPosts: postsRes.count ?? 0,
        totalGoals: goalsRes.count ?? 0,
        avgStreak,
        premiumUsers: premiumCount,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { icon: <Users className="w-5 h-5 text-primary" />, label: "Total de Arquitétos", value: stats.totalUsers, color: "text-primary" },
    { icon: <TrendingUp className="w-5 h-5 text-accent" />, label: "Novos esta semana", value: stats.newUsersThisWeek, color: "text-accent" },
    { icon: <FileText className="w-5 h-5 text-foreground" />, label: "Total de posts", value: stats.totalPosts, color: "text-foreground" },
    { icon: <Target className="w-5 h-5 text-primary" />, label: "Metas criadas", value: stats.totalGoals, color: "text-primary" },
    { icon: <Flame className="w-5 h-5 text-orange-400" />, label: "Streak médio", value: `${stats.avgStreak} dias`, color: "text-orange-400" },
    { icon: <Users className="w-5 h-5 text-accent" />, label: "Usuários Premium", value: stats.premiumUsers, color: "text-accent" },
  ];

  if (loading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array(6).fill(0).map((_, i) => <div key={i} className="bg-muted animate-pulse rounded-xl h-24" />)}</div>;

  // Engagement rate: users with streak > 0 / total
  const engagementRate = stats.totalUsers > 0 
    ? Math.round((stats.totalPosts / Math.max(stats.totalUsers, 1)) * 10) / 10
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="glass rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">{c.icon}</div>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Taxa de engajamento</p>
            <p className="text-xs text-muted-foreground">Posts por usuário (média)</p>
          </div>
          <p className="text-2xl font-bold text-primary">{engagementRate}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsPanel;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Target, Trophy, MessageSquare, Heart, Calendar, Shield, Flame, Star, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  cpf: string;
  level: string;
  points: number;
  streak: number;
  subscription_tier: string;
  created_at: string;
  avatar_url?: string | null;
  bio?: string | null;
  real_name?: string | null;
  name_verified?: boolean;
}

interface AdminUserDetailProps {
  profile: ProfileRow;
  onBack: () => void;
}

const maskCPF = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const AdminUserDetail = ({ profile, onBack }: AdminUserDetailProps) => {
  const [missions, setMissions] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [goals, setGoals] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [achievements, setAchievements] = useState<number>(0);
  const [posts, setPosts] = useState<number>(0);
  const [comments, setComments] = useState<number>(0);
  const [likes, setLikes] = useState<number>(0);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [recentGoals, setRecentGoals] = useState<any[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const uid = profile.user_id;
      
      const [
        missionsRes,
        goalsRes,
        achievementsRes,
        postsRes,
        commentsRes,
        likesRes,
        recentPostsRes,
        recentGoalsRes,
        recentAchRes,
      ] = await Promise.all([
        supabase.from("user_missions").select("completed", { count: "exact" }).eq("user_id", uid),
        supabase.from("user_goals").select("status", { count: "exact" }).eq("user_id", uid),
        supabase.from("user_achievements").select("id", { count: "exact" }).eq("user_id", uid),
        supabase.from("posts").select("id", { count: "exact" }).eq("user_id", uid),
        supabase.from("comments").select("id", { count: "exact" }).eq("user_id", uid),
        supabase.from("post_likes").select("id", { count: "exact" }).eq("user_id", uid),
        supabase.from("posts").select("id, content, category, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
        supabase.from("user_goals").select("id, title, status, target_date, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
        supabase.from("user_achievements").select("id, unlocked_at, achievement_id, achievements(title, icon)").eq("user_id", uid).order("unlocked_at", { ascending: false }).limit(10),
      ]);

      const missionData = missionsRes.data ?? [];
      setMissions({ total: missionData.length, completed: missionData.filter((m: any) => m.completed).length });
      
      const goalData = goalsRes.data ?? [];
      setGoals({ total: goalData.length, completed: goalData.filter((g: any) => g.status === "completed").length });
      
      setAchievements(achievementsRes.count ?? 0);
      setPosts(postsRes.count ?? 0);
      setComments(commentsRes.count ?? 0);
      setLikes(likesRes.count ?? 0);
      setRecentPosts(recentPostsRes.data ?? []);
      setRecentGoals(recentGoalsRes.data ?? []);
      setRecentAchievements(recentAchRes.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, [profile.user_id]);

  const statCard = (icon: React.ReactNode, label: string, value: string | number, color?: string) => (
    <div className="bg-muted rounded-xl p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className={`text-xl font-bold ${color ?? "text-foreground"}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 mb-2">
        <ArrowLeft className="w-4 h-4" /> Voltar para lista
      </Button>

      {/* Profile Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-primary-foreground overflow-hidden flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{profile.display_name}</h2>
              {profile.name_verified && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">✅ Verificado</span>}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                profile.subscription_tier === "premium" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
              }`}>
                {profile.subscription_tier === "premium" ? "⭐ Premium" : "Free"}
              </span>
            </div>
            {profile.real_name && <p className="text-sm text-muted-foreground">Nome real: {profile.real_name}</p>}
            <p className="text-xs text-muted-foreground font-mono mt-1">CPF: {maskCPF(profile.cpf)}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {profile.level}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(profile.created_at).toLocaleDateString("pt-BR")}</span>
              <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {profile.streak} dias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCard(<Star className="w-5 h-5 text-accent" />, "Pontos", profile.points, "text-accent")}
        {statCard(<Flame className="w-5 h-5 text-orange-400" />, "Streak", `${profile.streak} dias`, "text-orange-400")}
        {statCard(<Trophy className="w-5 h-5 text-primary" />, "Conquistas", achievements, "text-primary")}
        {statCard(<FileText className="w-5 h-5 text-muted-foreground" />, "Posts", posts)}
      </div>

      {/* Detailed tabs */}
      <Tabs defaultValue="progress" className="space-y-3">
        <TabsList className="bg-muted">
          <TabsTrigger value="progress" className="gap-1"><Target className="w-3.5 h-3.5" /> Progresso</TabsTrigger>
          <TabsTrigger value="goals" className="gap-1"><Target className="w-3.5 h-3.5" /> Metas</TabsTrigger>
          <TabsTrigger value="social" className="gap-1"><MessageSquare className="w-3.5 h-3.5" /> Rede Social</TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1"><Trophy className="w-3.5 h-3.5" /> Conquistas</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-3">
          <div className="glass rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Missões</h3>
            <div className="flex items-center gap-3">
              <Progress value={missions.total > 0 ? (missions.completed / missions.total) * 100 : 0} className="flex-1 h-3" />
              <span className="text-sm font-medium text-foreground">{missions.completed}/{missions.total}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary">{missions.completed}</p>
                <p className="text-[11px] text-muted-foreground">Completadas</p>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-muted-foreground">{missions.total - missions.completed}</p>
                <p className="text-[11px] text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-3">
          <div className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Metas ({goals.total})</h3>
              <span className="text-xs text-primary">{goals.completed} concluídas</span>
            </div>
            {recentGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma meta criada.</p>
            ) : (
              <div className="space-y-2">
                {recentGoals.map((g: any) => (
                  <div key={g.id} className="bg-muted rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{g.title}</p>
                      <p className="text-[11px] text-muted-foreground">Prazo: {g.target_date}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      g.status === "completed" ? "bg-primary/20 text-primary" :
                      g.status === "active" ? "bg-accent/20 text-accent" : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                      {g.status === "completed" ? "✅ Concluída" : g.status === "active" ? "🎯 Ativa" : g.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {statCard(<FileText className="w-4 h-4 text-primary" />, "Posts", posts, "text-primary")}
            {statCard(<MessageSquare className="w-4 h-4 text-accent" />, "Comentários", comments, "text-accent")}
            {statCard(<Heart className="w-4 h-4 text-destructive" />, "Curtidas", likes, "text-destructive")}
          </div>
          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Posts recentes</h3>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum post.</p>
            ) : (
              <div className="space-y-2">
                {recentPosts.map((p: any) => (
                  <div key={p.id} className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-foreground line-clamp-2">{p.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-primary">{p.category}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-3">
          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Conquistas ({achievements})</h3>
            {recentAchievements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conquista desbloqueada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentAchievements.map((a: any) => (
                  <div key={a.id} className="bg-muted rounded-lg p-3 flex items-center gap-3">
                    <span className="text-2xl">{(a as any).achievements?.icon ?? "🏆"}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{(a as any).achievements?.title ?? "Conquista"}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(a.unlocked_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AdminUserDetail;

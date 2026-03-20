import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Star, Zap, Award, MessageCircle, Ban, Flag, DollarSign, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import FriendControls from "@/components/profile/FriendControls";
import DiscountPanel from "@/components/profile/DiscountPanel";
import BlockUserButton from "@/components/BlockUserButton";
import ReportModal from "@/components/ReportModal";

interface PublicProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  level: string | null;
  points: number | null;
  streak: number | null;
  subscription_tier: string | null;
  bio?: string | null;
  public_id?: string | null;
  accumulated_earnings?: number | null;
}

interface PostWithProfile {
  id: string;
  user_id: string;
  content: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_premium: boolean;
  quoted_post_id: string | null;
  quoted_content?: string | null;
  quoted_author?: string | null;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const Perfil = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts">("posts");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      // Fetch public profile from safe_profiles view + bio from profiles (if own profile)
      const { data: sp } = await supabase
        .from("safe_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Try to get bio - available if admin or own profile
      let bio: string | null = null;
      if (user?.id === userId) {
        const { data: fullProfile } = await supabase
          .from("profiles")
          .select("bio")
          .eq("user_id", userId)
          .maybeSingle();
        bio = fullProfile?.bio ?? null;
      }

      if (sp) {
        setProfile({ ...sp, bio });
      }

      // Fetch user posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (postsData) {
        // Fetch quoted posts
        const quotedIds = postsData.filter(p => p.quoted_post_id).map(p => p.quoted_post_id!);
        let quotedMap = new Map<string, { content: string; user_id: string }>();
        if (quotedIds.length > 0) {
          const { data: quoted } = await supabase.from("posts").select("id, content, user_id").in("id", quotedIds);
          quotedMap = new Map(quoted?.map(q => [q.id, q]) ?? []);
        }

        const quotedUserIds = [...new Set([...Array.from(quotedMap.values()).map(q => q.user_id)])];
        let quotedProfileMap = new Map<string, { display_name: string }>();
        if (quotedUserIds.length > 0) {
          const { data: qp } = await supabase.from("safe_profiles").select("user_id, display_name").in("user_id", quotedUserIds);
          quotedProfileMap = new Map(qp?.map(p => [p.user_id!, p]) ?? []);
        }

        setPosts(postsData.map(p => {
          const quoted = p.quoted_post_id ? quotedMap.get(p.quoted_post_id) : null;
          const quotedProfile = quoted ? quotedProfileMap.get(quoted.user_id) : null;
          return {
            ...p,
            quoted_content: quoted?.content ?? null,
            quoted_author: quotedProfile?.display_name ?? null,
          };
        }));
      }

      setLoading(false);
    };
    load();
  }, [userId, user]);

  const handleStartConversation = async () => {
    if (!user || !userId) return;
    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${userId}),and(participant_1.eq.${userId},participant_2.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      navigate(`/mensagens?conv=${existing.id}`);
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ participant_1: user.id, participant_2: userId })
        .select("id")
        .single();
      if (newConv) navigate(`/mensagens?conv=${newConv.id}`);
    }
  };

  const initials = (profile?.display_name ?? "AM").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isOwnProfile = user?.id === userId;

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted transition-colors text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-foreground leading-tight">{profile?.display_name ?? "Perfil"}</h1>
          <p className="text-xs text-muted-foreground">{posts.length} publicações</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Carregando...</div>
      ) : !profile ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Perfil não encontrado.</div>
      ) : (
        <>
          {/* Profile banner + avatar */}
          <div className="relative">
            {profile.banner_url ? (
              <img src={profile.banner_url} alt="banner" className="h-32 w-full object-cover" />
            ) : (
              <div className="h-24 bg-gradient-to-br from-primary/30 via-accent/20 to-transparent" />
            )}
            <div className="px-4 pb-3">
              <div className="flex items-end justify-between -mt-8 mb-3">
                <div className={`w-16 h-16 rounded-full border-4 border-background flex items-center justify-center text-lg font-bold overflow-hidden ${
                  ["Estrategista", "Mestre", "Visionário", "Arquiteto-Chefe"].includes(profile.level ?? "")
                    ? "bg-gradient-gold text-accent-foreground"
                    : "bg-gradient-primary text-primary-foreground"
                }`}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name ?? "avatar"} className="w-full h-full object-cover" />
                  ) : initials}
                </div>
                {!isOwnProfile && user && (
                  <div className="flex items-center gap-2">
                    {userId && <FriendControls targetUserId={userId} />}
                    <button
                      onClick={handleStartConversation}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Mensagem
                    </button>
                    <BlockUserButton targetUserId={userId!} targetName={profile?.display_name ?? undefined} onBlocked={() => navigate("/feed")} />
                    <button
                      onClick={() => setShowReport(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => navigate("/config")}
                    className="px-4 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Editar perfil
                  </button>
                )}
              </div>

              {/* Name + level */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">{profile.display_name}</h2>
                {["Estrategista", "Mestre", "Visionário", "Arquiteto-Chefe"].includes(profile.level ?? "") && (
                  <Award className="w-4 h-4 text-accent" />
                )}
                {profile.subscription_tier === "premium" && (
                  <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full">PREMIUM</span>
                )}
              </div>
              {/* Public ID */}
              {profile.public_id && (
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                  <Hash className="w-3 h-3" /> {profile.public_id}
                </p>
              )}
              <p className="text-sm text-muted-foreground mb-2">{profile.level ?? "Iniciante"}</p>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-foreground leading-relaxed mb-3">{profile.bio}</p>
              )}
              {!profile.bio && isOwnProfile && (
                <p className="text-sm text-muted-foreground/60 italic mb-3">Nenhuma bio ainda. Edite seu perfil para adicionar.</p>
              )}

              {/* Stats */}
              <div className="flex gap-5 mt-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{profile.points ?? 0}</span>
                  <span className="text-xs text-muted-foreground">pontos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-streak" />
                  <span className="text-sm font-bold text-foreground">{profile.streak ?? 0}</span>
                  <span className="text-xs text-muted-foreground">seguidos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-sm font-bold text-foreground">{posts.length}</span>
                  <span className="text-xs text-muted-foreground">posts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Accumulated Earnings - only for own profile */}
          {isOwnProfile && profile.accumulated_earnings != null && profile.accumulated_earnings > 0 && (
            <div className="mx-4 mt-3 bg-muted rounded-xl p-4 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Valor acumulado</p>
                <p className="text-lg font-bold text-accent">R$ {Number(profile.accumulated_earnings).toFixed(2).replace(".", ",")}</p>
              </div>
            </div>
          )}

          {/* Discount Panel - only for own profile */}
          {isOwnProfile && userId && <DiscountPanel userId={userId} />}

          {/* Tabs */}
          <div className="border-b border-border mt-4">
            <button
              className="px-6 py-3 text-sm font-medium text-foreground border-b-2 border-primary transition-colors"
            >
              Publicações
            </button>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma publicação ainda.</div>
          ) : (
            posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  user_id: post.user_id,
                  content: post.content,
                  category: post.category,
                  author: profile.display_name ?? "Arquiteto Mental",
                  level: profile.level ?? "Iniciante",
                  avatar: initials,
                  likes: post.likes_count,
                  comments: post.comments_count,
                  timestamp: getRelativeTime(post.created_at),
                  quoted_post_id: post.quoted_post_id,
                  quoted_content: post.quoted_content,
                  quoted_author: post.quoted_author,
                }}
                index={i}
              />
            ))
          )}

          <div className="h-20" />
        </>
      )}
      {!isOwnProfile && userId && (
        <ReportModal
          open={showReport}
          onOpenChange={setShowReport}
          reportedUserId={userId}
          reportedName={profile?.display_name ?? undefined}
        />
      )}
    </div>
  );
};

export default Perfil;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Send } from "lucide-react";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PaywallModal from "@/components/PaywallModal";

const categories = ["Todos", "Reflexão", "Estratégia", "Estoicismo", "Prática"];

interface PostWithProfile {
  id: string;
  user_id: string;
  content: string;
  category: string;
  is_premium: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: { display_name: string; level: string; avatar_url: string | null } | null;
}

const Feed = () => {
  const [filter, setFilter] = useState("Todos");
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [newPost, setNewPost] = useState("");
  const [newCategory, setNewCategory] = useState<string>("reflexão");
  const [loading, setLoading] = useState(true);
  const { profile, user } = useAuth();

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!data) { setLoading(false); return; }
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, level, avatar_url")
      .in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
    const postsWithProfiles = data.map(p => ({
      ...p,
      profiles: profileMap.get(p.user_id) ?? null,
    }));
    setPosts(postsWithProfiles as PostWithProfile[]);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    await supabase.from("posts").insert({
      user_id: user.id,
      content: newPost.trim(),
      category: newCategory as any,
    });
    setNewPost("");
    fetchPosts();
  };

  const filtered = filter === "Todos"
    ? posts
    : posts.filter((p) => p.category.toLowerCase() === filter.toLowerCase());

  if (profile?.subscription_tier === "free") {
    return <PaywallModal />;
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header — X style */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-foreground">Feed</h1>
          <div className="flex items-center gap-1.5 text-streak">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-bold">{profile?.streak ?? 0}</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-border">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-1 py-3 text-sm font-medium relative transition-colors ${
                filter === cat ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {cat}
              {filter === cat && (
                <motion.div
                  layoutId="feedtab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {(profile?.display_name ?? "AM").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="O que está pensando, Arquiteto Mental?"
              className="w-full bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none min-h-[60px]"
              maxLength={2000}
            />
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-transparent text-xs text-primary font-medium border border-primary/30 rounded-full px-3 py-1 focus:outline-none"
              >
                <option value="reflexão">Reflexão</option>
                <option value="estratégia">Estratégia</option>
                <option value="estoicismo">Estoicismo</option>
                <option value="prática">Prática</option>
              </select>
              <button
                onClick={handlePost}
                disabled={!newPost.trim()}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhuma reflexão ainda. Seja o primeiro Arquiteto Mental a compartilhar! 🧠
        </div>
      ) : (
        filtered.map((post, i) => (
          <PostCard
            key={post.id}
            post={{
              id: post.id,
              user_id: post.user_id,
              content: post.content,
              category: post.category,
              author: post.profiles?.display_name ?? "Arquiteto Mental",
              level: post.profiles?.level ?? "Iniciante",
              avatar: (post.profiles?.display_name ?? "AM").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
              likes: post.likes_count,
              comments: post.comments_count,
              timestamp: getRelativeTime(post.created_at),
            }}
            index={i}
            onUpdate={fetchPosts}
          />
        ))
      )}

      {filtered.length > 0 && (
        <div className="text-center py-8 border-b border-border">
          <p className="text-sm text-muted-foreground">
            Você viu todas as reflexões de hoje. Volte amanhã. 🧠
          </p>
        </div>
      )}
    </div>
  );
};

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

export default Feed;

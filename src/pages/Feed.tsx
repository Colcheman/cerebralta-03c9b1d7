import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Filter, Send } from "lucide-react";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
      .select("*, profiles(display_name, level, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setPosts(data as PostWithProfile[]);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Feed</h1>
          <p className="text-sm text-muted-foreground">Reflexões e práticas da comunidade</p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <Flame className="w-4 h-4 text-streak" />
          <span className="text-sm font-semibold text-streak">{profile?.streak ?? 0}</span>
        </div>
      </motion.div>

      {/* New Post */}
      <div className="glass rounded-2xl p-4 mb-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Compartilhe uma reflexão, Arquitéto Mental..."
          className="w-full bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none min-h-[80px]"
          maxLength={2000}
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="bg-muted text-sm text-foreground rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="reflexão">Reflexão</option>
            <option value="estratégia">Estratégia</option>
            <option value="estoicismo">Estoicismo</option>
            <option value="prática">Prática</option>
          </select>
          <button
            onClick={handlePost}
            disabled={!newPost.trim()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Publicar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Anti-dopamine notice */}
      <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3">
        <Filter className="w-5 h-5 text-accent shrink-0" />
        <p className="text-xs text-muted-foreground">
          Feed curado para seu desenvolvimento. Sem scroll infinito, sem distrações.
        </p>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma reflexão ainda. Seja o primeiro Arquitéto Mental a compartilhar! 🧠
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
                author: post.profiles?.display_name ?? "Arquitéto Mental",
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
      </div>

      {filtered.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Você viu todas as reflexões de hoje. Volte amanhã para mais. 🧠
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
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default Feed;

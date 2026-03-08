import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Send, X } from "lucide-react";
import { sanitizeText } from "@/lib/sanitize";
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
  quoted_post_id: string | null;
  profiles: { display_name: string; level: string; avatar_url: string | null } | null;
  quoted_content?: string | null;
  quoted_author?: string | null;
}

interface QuoteTarget {
  id: string;
  content: string;
  author: string;
}

const Feed = () => {
  const [filter, setFilter] = useState("Todos");
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [newPost, setNewPost] = useState("");
  const [newCategory, setNewCategory] = useState<string>("reflexão");
  const [loading, setLoading] = useState(true);
  const [quoting, setQuoting] = useState<QuoteTarget | null>(null);
  const { profile, user } = useAuth();

  const fetchPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20);
    if (!data) { setLoading(false); return; }
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, level, avatar_url").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    const quotedIds = data.filter(p => p.quoted_post_id).map(p => p.quoted_post_id!);
    let quotedMap = new Map<string, { content: string; user_id: string }>();
    if (quotedIds.length > 0) {
      const { data: quoted } = await supabase.from("posts").select("id, content, user_id").in("id", quotedIds);
      quotedMap = new Map(quoted?.map(q => [q.id, q]) ?? []);
    }

    const postsWithProfiles = data.map(p => {
      const quoted = p.quoted_post_id ? quotedMap.get(p.quoted_post_id) : null;
      const quotedProfile = quoted ? profileMap.get(quoted.user_id) : null;
      return {
        ...p,
        profiles: profileMap.get(p.user_id) ?? null,
        quoted_content: quoted?.content ?? null,
        quoted_author: quotedProfile?.display_name ?? null,
      };
    });
    setPosts(postsWithProfiles as PostWithProfile[]);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    const sanitized = sanitizeText(newPost, 2000);
    if (!sanitized) return;
    await supabase.from("posts").insert({
      user_id: user.id,
      content: sanitized,
      category: newCategory as any,
      ...(quoting ? { quoted_post_id: quoting.id } : {}),
    });
    setNewPost("");
    setQuoting(null);
    fetchPosts();
  };

  const handleQuote = (post: any) => {
    setQuoting({ id: post.id, content: post.content, author: post.author });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = filter === "Todos" ? posts : posts.filter(p => p.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-foreground">Feed</h1>
          <div className="flex items-center gap-1.5 text-streak">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-bold">{profile?.streak ?? 0}</span>
          </div>
        </div>
        <div className="flex border-b border-border">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`flex-1 py-3 text-sm font-medium relative transition-colors ${filter === cat ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}>
              {cat}
              {filter === cat && <motion.div layoutId="feedtab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-primary" />}
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
            {quoting && (
              <div className="flex items-center gap-2 mb-2 p-2 border border-border rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-primary">Citando {quoting.author}</p>
                  <p className="text-xs text-muted-foreground truncate">{quoting.content}</p>
                </div>
                <button onClick={() => setQuoting(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="O que está pensando, Arquiteto Mental?"
              className="w-full bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none min-h-[60px]" maxLength={2000} />
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                className="bg-transparent text-xs text-primary font-medium border border-primary/30 rounded-full px-3 py-1 focus:outline-none">
                <option value="reflexão">Reflexão</option>
                <option value="estratégia">Estratégia</option>
                <option value="estoicismo">Estoicismo</option>
                <option value="prática">Prática</option>
              </select>
              <button onClick={handlePost} disabled={!newPost.trim()}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
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
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma reflexão ainda. Seja o primeiro Arquiteto Mental a compartilhar! 🧠</div>
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
              quoted_post_id: post.quoted_post_id,
              quoted_content: post.quoted_content,
              quoted_author: post.quoted_author,
            }}
            index={i}
            onUpdate={fetchPosts}
            onQuote={handleQuote}
          />
        ))
      )}

      {filtered.length > 0 && (
        <div className="text-center py-8 border-b border-border">
          <p className="text-sm text-muted-foreground">Você viu todas as reflexões de hoje. Volte amanhã. 🧠</p>
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

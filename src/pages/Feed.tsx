import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, Search, User } from "lucide-react";
import { sanitizeText } from "@/lib/sanitize";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const categories = ["Todos", "Reflexão", "Estratégia", "Estoicismo", "Prática"];
type FeedMode = "para_voce" | "seguindo";

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

interface SearchResult {
  type: "user" | "post";
  id: string;
  title: string;
  subtitle?: string;
  userId?: string;
}

const Feed = () => {
  const [filter, setFilter] = useState("Todos");
  const [feedMode, setFeedMode] = useState<FeedMode>("para_voce");
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [newPost, setNewPost] = useState("");
  const [newCategory, setNewCategory] = useState<string>("reflexão");
  const [loading, setLoading] = useState(true);
  const [quoting, setQuoting] = useState<QuoteTarget | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  // Fetch following IDs once
  useEffect(() => {
    if (!user) return;
    supabase.from("follows").select("following_id").eq("follower_id", user.id).then(({ data }) => {
      setFollowingIds(data?.map(d => d.following_id) ?? []);
    });
  }, [user]);

  const fetchPosts = async () => {
    // Get blocked user IDs
    let blockedIds: string[] = [];
    if (user) {
      const { data: blocks } = await (supabase as any).from("user_blocks").select("blocked_id").eq("blocker_id", user.id);
      blockedIds = blocks?.map((b: any) => b.blocked_id) ?? [];
    }

    let query = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(40);

    // If "seguindo" mode, filter by followed users
    if (feedMode === "seguindo" && followingIds.length > 0) {
      query = query.in("user_id", followingIds);
    } else if (feedMode === "seguindo" && followingIds.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    // Filter out blocked users
    const filteredData = blockedIds.length > 0 ? data.filter(p => !blockedIds.includes(p.user_id)) : data;

    const userIds = [...new Set(filteredData.map(p => p.user_id))];
    const { data: profiles } = await supabase.from("safe_profiles").select("user_id, display_name, level, avatar_url").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id!, p]) ?? []);

    const quotedIds = filteredData.filter(p => p.quoted_post_id).map(p => p.quoted_post_id!);
    let quotedMap = new Map<string, { content: string; user_id: string }>();
    if (quotedIds.length > 0) {
      const { data: quoted } = await supabase.from("posts").select("id, content, user_id").in("id", quotedIds);
      quotedMap = new Map(quoted?.map(q => [q.id, q]) ?? []);
    }

    const postsWithProfiles = filteredData.map(p => {
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

  useEffect(() => { fetchPosts(); }, [feedMode, followingIds]);

  // Close search on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    const term = q.trim();

    const [{ data: users }, { data: foundPosts }] = await Promise.all([
      supabase.from("safe_profiles").select("user_id, display_name, level").ilike("display_name", `%${term}%`).limit(5),
      supabase.from("posts").select("id, content, user_id, category").ilike("content", `%${term}%`).limit(5),
    ]);

    const postUserIds = [...new Set(foundPosts?.map(p => p.user_id) ?? [])];
    let postProfileMap = new Map<string, string>();
    if (postUserIds.length > 0) {
      const { data: pp } = await supabase.from("safe_profiles").select("user_id, display_name").in("user_id", postUserIds);
      postProfileMap = new Map(pp?.map(p => [p.user_id!, p.display_name ?? "Arquiteto Mental"]) ?? []);
    }

    const results: SearchResult[] = [
      ...(users ?? []).map(u => ({
        type: "user" as const,
        id: u.user_id!,
        title: u.display_name ?? "Arquiteto Mental",
        subtitle: u.level ?? "Iniciante",
        userId: u.user_id!,
      })),
      ...(foundPosts ?? []).map(p => ({
        type: "post" as const,
        id: p.id,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? "…" : ""),
        subtitle: postProfileMap.get(p.user_id) ?? "Arquiteto Mental",
        userId: p.user_id,
      })),
    ];
    setSearchResults(results);
    setSearchLoading(false);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => runSearch(val), 400);
  };

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
          <div className="flex items-center gap-3">
            {/* Search toggle */}
            <button
              onClick={() => { setShowSearch(s => !s); setSearchQuery(""); setSearchResults([]); }}
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Search className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-streak" title="Dias seguidos">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{profile?.streak ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative px-4 pb-3"
            >
              <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 border border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Pesquisar usuários, ideias, postagens..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Results dropdown */}
              {(searchLoading || searchResults.length > 0 || (searchQuery && !searchLoading)) && (
                <div className="absolute left-4 right-4 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {searchLoading && (
                    <div className="px-4 py-3 text-xs text-muted-foreground">Pesquisando...</div>
                  )}
                  {!searchLoading && searchResults.length === 0 && searchQuery && (
                    <div className="px-4 py-3 text-xs text-muted-foreground">Nenhum resultado para "{searchQuery}"</div>
                  )}
                  {!searchLoading && searchResults.map((r, i) => (
                    <button
                      key={r.id + i}
                      onClick={() => {
                        if (r.type === "user") navigate(`/perfil/${r.userId}`);
                        else navigate(`/perfil/${r.userId}`);
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 text-left"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        r.type === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {r.type === "user" ? r.title.slice(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.type === "user" ? r.subtitle : `por ${r.subtitle}`}</p>}
                      </div>
                      {r.type === "user" && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">Perfil</span>
                      )}
                      {r.type === "post" && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">Post</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed mode tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setFeedMode("para_voce"); setLoading(true); }}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${feedMode === "para_voce" ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
          >
            Para Você
            {feedMode === "para_voce" && <motion.div layoutId="feedmode" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-primary" />}
          </button>
          <button
            onClick={() => { setFeedMode("seguindo"); setLoading(true); }}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${feedMode === "seguindo" ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
          >
            Seguindo
            {feedMode === "seguindo" && <motion.div layoutId="feedmode" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-primary" />}
          </button>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide border-b border-border">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`shrink-0 px-4 py-3 text-sm font-medium relative transition-colors ${filter === cat ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}>
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

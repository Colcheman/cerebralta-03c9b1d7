import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Repeat2, Share, Send, MoreHorizontal, Award, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import { sanitizeText } from "@/lib/sanitize";

const categoryColors: Record<string, string> = {
  reflexão: "text-primary",
  estratégia: "text-accent",
  estoicismo: "text-success",
  prática: "text-gold",
};

interface PostData {
  id: string;
  user_id: string;
  content: string;
  category: string;
  author: string;
  level: string;
  avatar: string;
  likes: number;
  comments: number;
  timestamp: string;
  quoted_post_id?: string | null;
  quoted_content?: string | null;
  quoted_author?: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string } | null;
}

const ELEVATED_LEVELS = ["Estrategista", "Mestre", "Visionário", "Arquiteto-Chefe"];

const PostCard = ({ post, index, onUpdate, onQuote }: { post: PostData; index: number; onUpdate?: () => void; onQuote?: (post: PostData) => void }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(post.comments);

  const isElevated = ELEVATED_LEVELS.includes(post.level);

  useEffect(() => {
    if (!user) return;
    supabase.from("post_likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle().then(({ data }) => setLiked(!!data));
  }, [post.id, user]);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
    await supabase.from("posts").update({ likes_count: liked ? likeCount - 1 : likeCount + 1 }).eq("id", post.id);
  };

  const fetchComments = async () => {
    const { data: commentsData } = await supabase.from("comments").select("*").eq("post_id", post.id).order("created_at", { ascending: true });
    if (!commentsData) return;
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profiles } = await supabase.from("safe_profiles" as any).select("user_id, display_name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
    setComments(commentsData.map(c => ({ ...c, profiles: profileMap.get(c.user_id) ?? null })) as Comment[]);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user) return;
    const sanitized = sanitizeText(newComment, 1000);
    if (!sanitized) return;
    await supabase.from("comments").insert({ post_id: post.id, user_id: user.id, content: sanitized });
    await supabase.from("posts").update({ comments_count: commentCount + 1 }).eq("id", post.id);
    setCommentCount(c => c + 1);
    setNewComment("");
    fetchComments();
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="border-b border-border px-4 py-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex gap-3">
        {/* Avatar with hover */}
        <ProfileHoverCard name={post.author} level={post.level} avatar={post.avatar}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer ${
            isElevated ? "bg-gradient-gold text-accent-foreground" : "bg-gradient-primary text-primary-foreground"
          }`}>
            {post.avatar}
          </div>
        </ProfileHoverCard>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <ProfileHoverCard name={post.author} level={post.level} avatar={post.avatar}>
              <span className="text-sm font-bold text-foreground truncate cursor-pointer hover:underline">{post.author}</span>
            </ProfileHoverCard>
            {isElevated && <Award className="w-3.5 h-3.5 text-accent shrink-0" />}
            <span className={`text-xs font-medium ${categoryColors[post.category] ?? "text-muted-foreground"}`}>· {post.category}</span>
            <span className="text-xs text-muted-foreground">· {post.timestamp}</span>
            <button className="ml-auto text-muted-foreground hover:text-foreground p-1 -m-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {isElevated && (
            <span className="inline-block text-[10px] font-semibold text-accent bg-accent/10 rounded px-1.5 py-0.5 mt-0.5">{post.level}</span>
          )}

          {/* Quoted post */}
          {post.quoted_content && (
            <div className="mt-2 border border-border rounded-xl p-3 bg-muted/30">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">{post.quoted_author ?? "Arquiteto Mental"}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{post.quoted_content}</p>
            </div>
          )}

          {/* Content */}
          <p className="text-sm text-foreground leading-relaxed mt-1.5 whitespace-pre-wrap">{post.content}</p>

          {/* Action bar */}
          <div className="flex items-center justify-between mt-3 max-w-[420px] -ml-2">
            <button onClick={toggleComments} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
              <MessageCircle className="w-4 h-4" /><span className="text-xs">{commentCount || ""}</span>
            </button>
            <button onClick={() => onQuote?.(post)} className="flex items-center gap-1.5 text-muted-foreground hover:text-success transition-colors p-2 rounded-full hover:bg-success/10">
              <Repeat2 className="w-4 h-4" />
            </button>
            <button onClick={toggleLike} className={`flex items-center gap-1.5 transition-colors p-2 rounded-full ${liked ? "text-destructive" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /><span className="text-xs">{likeCount || ""}</span>
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
              <Share className="w-4 h-4" />
            </button>
          </div>

          {/* Comments */}
          <AnimatePresence>
            {showComments && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 pt-3 border-t border-border">
                <div className="space-y-3 mb-3">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {(c.profiles?.display_name ?? "AM").charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">{c.profiles?.display_name ?? "Anônimo"}</span>
                        <p className="text-xs text-foreground/80">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && handleComment()} placeholder="Escreva um comentário..." maxLength={1000}
                    className="flex-1 bg-muted border border-border rounded-full px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={handleComment} disabled={!newComment.trim()} className="bg-primary text-primary-foreground p-2 rounded-full hover:opacity-90 disabled:opacity-50">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;

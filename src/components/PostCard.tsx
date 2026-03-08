import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const categoryColors: Record<string, string> = {
  reflexão: "bg-primary/15 text-primary",
  estratégia: "bg-accent/15 text-accent",
  estoicismo: "bg-success/20 text-success",
  prática: "bg-gold/15 text-gold",
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
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string } | null;
}

const PostCard = ({ post, index, onUpdate }: { post: PostData; index: number; onUpdate?: () => void }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(post.comments);

  // Check if user liked this post
  useEffect(() => {
    if (!user) return;
    supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
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
    // Update post likes_count
    await supabase.from("posts").update({ likes_count: liked ? likeCount - 1 : likeCount + 1 }).eq("id", post.id);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(display_name)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    if (data) setComments(data as Comment[]);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user) return;
    await supabase.from("comments").insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim(),
    });
    // Update comments count
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="glass rounded-2xl p-6 hover:border-primary/20 transition-all"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{post.author}</span>
            <span className="text-xs text-accent font-medium">{post.level}</span>
            <span className="text-xs text-muted-foreground">· {post.timestamp}</span>
          </div>
          <span className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${categoryColors[post.category] ?? ""}`}>
            {post.category}
          </span>
        </div>
      </div>

      <p className="text-foreground/90 text-sm leading-relaxed mb-5">{post.content}</p>

      <div className="flex items-center gap-6 text-muted-foreground">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-destructive" : "hover:text-foreground"}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          {likeCount}
        </button>
        <button onClick={toggleComments} className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          {commentCount}
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-border"
        >
          <div className="space-y-3 mb-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                  {(c.profiles?.display_name ?? "AM").charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground">{c.profiles?.display_name ?? "Anônimo"}</span>
                  <p className="text-xs text-foreground/80">{c.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              placeholder="Escreva um comentário..."
              maxLength={1000}
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
};

export default PostCard;

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { Post } from "@/lib/mock-data";

const categoryColors: Record<string, string> = {
  reflexão: "bg-primary/15 text-primary",
  estratégia: "bg-accent/15 text-accent",
  exercício: "bg-success/20 text-success",
  filosofia: "bg-gold/15 text-gold",
};

const PostCard = ({ post, index }: { post: Post; index: number }) => {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
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
        <button className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          {post.comments}
        </button>
        <button className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </motion.article>
  );
};

export default PostCard;

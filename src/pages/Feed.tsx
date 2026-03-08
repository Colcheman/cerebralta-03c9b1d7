import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Filter } from "lucide-react";
import PostCard from "@/components/PostCard";
import { mockPosts, mockUser } from "@/lib/mock-data";

const categories = ["Todos", "Reflexão", "Estratégia", "Exercício", "Filosofia"];

const Feed = () => {
  const [filter, setFilter] = useState("Todos");

  const filtered = filter === "Todos"
    ? mockPosts
    : mockPosts.filter((p) => p.category.toLowerCase() === filter.toLowerCase());

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
          <span className="text-sm font-semibold text-streak">{mockUser.streak}</span>
        </div>
      </motion.div>

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
        {filtered.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
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

export default Feed;

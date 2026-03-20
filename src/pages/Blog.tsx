import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  keywords: string[];
  created_at: string;
}

const Blog = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, keywords, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPost[];
    },
  });

  useEffect(() => {
    document.title = "Blog | Cerebralta - Desenvolvimento Pessoal e Mental";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Artigos sobre desenvolvimento pessoal, estoicismo, estratégia mental e crescimento. Leia nosso blog e evolua.");
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Artigos sobre desenvolvimento pessoal, estoicismo, estratégia mental e crescimento. Leia nosso blog e evolua.";
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-foreground">
            Cerebralta
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/blog" className="text-primary font-medium">Blog</Link>
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Blog</h1>
          <p className="text-muted-foreground mb-10">Artigos sobre desenvolvimento pessoal, estratégia mental e crescimento.</p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="block glass rounded-xl p-6 hover:border-primary/30 transition-colors group"
                >
                  <h2 className="font-display text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <time className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                    </time>
                    <span className="text-xs text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ler artigo <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  {post.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.keywords.slice(0, 5).map(k => (
                        <span key={k} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{k}</span>
                      ))}
                    </div>
                  )}
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Cerebralta. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Blog;

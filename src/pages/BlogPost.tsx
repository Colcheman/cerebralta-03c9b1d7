import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  keywords: string[];
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();
      if (error) throw error;
      return data as BlogPostData;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Cerebralta Blog`;
      const updateMeta = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
        if (meta) {
          meta.setAttribute("content", content);
        } else {
          const m = document.createElement("meta");
          if (name.startsWith("og:")) m.setAttribute("property", name);
          else m.setAttribute("name", name);
          m.content = content;
          document.head.appendChild(m);
        }
      };
      updateMeta("description", post.excerpt);
      updateMeta("keywords", post.keywords.join(", "));
      updateMeta("og:title", post.title);
      updateMeta("og:description", post.excerpt);
      updateMeta("og:type", "article");

      // JSON-LD
      let ld = document.getElementById("blog-jsonld") as HTMLScriptElement | null;
      if (!ld) {
        ld = document.createElement("script");
        ld.id = "blog-jsonld";
        ld.type = "application/ld+json";
        document.head.appendChild(ld);
      }
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.created_at,
        keywords: post.keywords.join(", "),
        publisher: { "@type": "Organization", name: "Cerebralta" },
      });

      return () => {
        const el = document.getElementById("blog-jsonld");
        el?.remove();
      };
    }
  }, [post]);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Artigo não encontrado.</p>
        <Link to="/blog" className="text-primary text-sm hover:underline">← Voltar ao blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-foreground">Cerebralta</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/blog" className="text-xs text-primary hover:underline flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> Voltar ao blog
        </Link>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            {post.title}
          </h1>

          <time className="text-xs text-muted-foreground flex items-center gap-1 mb-8">
            <Calendar className="w-3 h-3" />
            {format(new Date(post.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
          </time>

          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {post.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-10 pt-6 border-t border-border">
              {post.keywords.map(k => (
                <span key={k} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{k}</span>
              ))}
            </div>
          )}
        </motion.article>
      </main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Cerebralta. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;

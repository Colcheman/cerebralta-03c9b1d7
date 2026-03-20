import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeText } from "@/lib/sanitize";
import { Plus, Loader2, Sparkles, Eye, EyeOff, Trash2, Edit3, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  keywords: string[];
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

const AdminBlogPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [published, setPublished] = useState(false);

  // AI generation
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [generating, setGenerating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPost[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        title: sanitizeText(title, 200),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
        content: content.trim(),
        excerpt: sanitizeText(excerpt, 300),
        keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
        published,
        author_id: user.id,
      };

      if (editId) {
        const { error } = await supabase.from("blog_posts").update(payload as any).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: editId ? "✏️ Post atualizado!" : "📝 Post criado!" });
      resetForm();
    },
    onError: (e: any) => {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "🗑️ Post excluído" });
      setDeleteTarget(null);
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, pub }: { id: string; pub: boolean }) => {
      const { error } = await supabase.from("blog_posts").update({ published: pub } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blog-posts"] }),
  });

  const generateWithAI = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog", {
        body: { topic: aiTopic.trim(), keywords: aiKeywords.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTitle(data.title || "");
      setSlug(data.slug || "");
      setExcerpt(data.excerpt || "");
      setContent(data.content || "");
      setKeywords(aiKeywords);
      setMode("create");
      toast({ title: "✨ Conteúdo gerado!", description: "Revise e publique quando pronto." });
    } catch (e: any) {
      toast({ title: "Erro na geração", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setMode("list");
    setEditId(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setKeywords("");
    setPublished(false);
    setAiTopic("");
    setAiKeywords("");
  };

  const startEdit = (post: BlogPost) => {
    setEditId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setKeywords(post.keywords.join(", "));
    setPublished(post.published);
    setMode("edit");
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);
  };

  if (mode === "create" || mode === "edit") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {mode === "edit" ? "Editar Post" : "Novo Post"}
          </h3>
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <X className="w-4 h-4 mr-1" /> Voltar
          </Button>
        </div>

        <div className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Título</label>
            <Input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (!editId) setSlug(generateSlug(e.target.value));
              }}
              placeholder="Título do post (máx. 60 caracteres para SEO)"
              maxLength={200}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">{title.length}/60 caracteres recomendados</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Slug (URL)</label>
            <Input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="url-do-post"
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Resumo (Meta Description)</label>
            <Input
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Resumo para SEO (máx. 160 caracteres)"
              maxLength={300}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">{excerpt.length}/160 caracteres recomendados</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Palavras-chave</label>
            <Input
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="palavra1, palavra2, palavra3"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Conteúdo (Markdown)</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Conteúdo do post em Markdown..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={e => setPublished(e.target.checked)}
              className="accent-primary"
            />
            Publicar imediatamente
          </label>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!title.trim() || !slug.trim() || !content.trim() || saveMutation.isPending}
            className="w-full gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editId ? "Salvar Alterações" : "Criar Post"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Generator */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" /> Gerar Post com IA
        </h3>
        <Input
          value={aiTopic}
          onChange={e => setAiTopic(e.target.value)}
          placeholder="Tema do post (ex: Como desenvolver disciplina mental)"
        />
        <Input
          value={aiKeywords}
          onChange={e => setAiKeywords(e.target.value)}
          placeholder="Palavras-chave separadas por vírgula"
        />
        <Button onClick={generateWithAI} disabled={!aiTopic.trim() || generating} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Gerando..." : "Gerar com IA"}
        </Button>
      </div>

      {/* Manual create button */}
      <Button onClick={() => setMode("create")} variant="outline" className="w-full gap-2">
        <Plus className="w-4 h-4" /> Criar Post Manual
      </Button>

      {/* Posts list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Posts ({posts.length})</h3>
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum post ainda. Crie o primeiro!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="glass rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">{post.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">/blog/{post.slug}</p>
                  {post.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  post.published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                }`}>
                  {post.published ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  onClick={() => togglePublish.mutate({ id: post.id, pub: !post.published })}
                >
                  {post.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {post.published ? "Despublicar" : "Publicar"}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => startEdit(post)}>
                  <Edit3 className="w-3 h-3" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(post.id)}
                >
                  <Trash2 className="w-3 h-3" /> Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlogPanel;

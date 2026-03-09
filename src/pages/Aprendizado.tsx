import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, FileText, Lock, Loader2, Sparkles, Lightbulb, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string | null;
  pdf_url: string | null;
  is_premium: boolean;
  created_at: string;
}

const Aprendizado = () => {
  const { profile, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingCourse, setGeneratingCourse] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);

  const categories = ["Todos", "geral", "estratégia", "estoicismo", "psicologia", "liderança"];

  const fetchCourses = () => {
    supabase.from("courses").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setCourses((data ?? []) as Course[]);
      setLoading(false);
    });
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleGenerateCourse = async () => {
    if (generatingCourse) return;
    setGeneratingCourse(true);
    toast.info("🧠 Gerando artigo com IA...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { mode: "generate_course", context: `Gere um artigo educativo sobre um tema relevante para o nível ${profile?.level}` },
      });
      if (error) throw error;
      toast.success("✅ Novo artigo gerado!");
      fetchCourses();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar artigo");
    } finally {
      setGeneratingCourse(false);
    }
  };

  const handleGetTip = async () => {
    if (loadingTip) return;
    setShowTip(true);
    setLoadingTip(true);
    setTip("");

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ mode: "generate_tip" }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Erro");
      }

      if (!resp.body) throw new Error("No stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setTip(fullText);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar dica");
      setShowTip(false);
    } finally {
      setLoadingTip(false);
    }
  };

  const filtered = filter === "Todos" ? courses : courses.filter(c => c.category === filter);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Aprendizado</h1>
        <p className="text-sm text-muted-foreground mb-6">Conteúdos para evoluir sua mente</p>
      </motion.div>

      {/* AI Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={handleGetTip}
          disabled={loadingTip}
          className="glass rounded-xl p-4 hover:border-primary/30 transition-all group text-left"
        >
          <Lightbulb className="w-5 h-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-semibold text-foreground">Dica personalizada</p>
          <p className="text-xs text-muted-foreground">IA analisa seu nível e sugere</p>
        </button>
        <button
          onClick={handleGenerateCourse}
          disabled={generatingCourse}
          className="glass rounded-xl p-4 hover:border-primary/30 transition-all group text-left"
        >
          {generatingCourse ? (
            <Loader2 className="w-5 h-5 text-primary mb-2 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
          )}
          <p className="text-sm font-semibold text-foreground">Gerar artigo</p>
          <p className="text-xs text-muted-foreground">Cria um artigo educativo com IA</p>
        </button>
      </div>

      {/* Personalized Tip Modal */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass rounded-2xl p-5 mb-6 border-accent/20 relative"
          >
            <button onClick={() => setShowTip(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-accent">Dica personalizada para você</span>
            </div>
            {loadingTip && !tip ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90">
                <ReactMarkdown>{tip}</ReactMarkdown>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat === "Todos" ? cat : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum conteúdo disponível nesta categoria.</p>
          <p className="text-xs text-muted-foreground mt-1">Use o botão "Gerar artigo" acima para criar conteúdo com IA!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === course.id ? null : course.id)}
                  className="w-full text-left p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">{course.title}</h3>
                        {course.is_premium && <Lock className="w-3.5 h-3.5 text-accent shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.description.slice(0, 100)}{course.description.length > 100 ? "..." : ""}</p>
                      <span className="inline-block mt-2 text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                        {course.category}
                      </span>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === course.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border"
                    >
                      <div className="p-5 space-y-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                        <div className="flex gap-3">
                          {course.video_url && (
                            <a href={course.video_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                              <Play className="w-3.5 h-3.5" /> Assistir Vídeo
                            </a>
                          )}
                          {course.pdf_url && (
                            <a href={course.pdf_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                              <FileText className="w-3.5 h-3.5" /> Baixar PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Aprendizado;

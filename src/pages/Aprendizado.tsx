import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, FileText, Lock, Loader2, Sparkles, Lightbulb, X, Clock, ChevronRight, Star, GraduationCap, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

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

const categoryColors: Record<string, string> = {
  geral: "bg-blue-500/15 text-blue-400",
  estratégia: "bg-amber-500/15 text-amber-400",
  estoicismo: "bg-emerald-500/15 text-emerald-400",
  psicologia: "bg-purple-500/15 text-purple-400",
  liderança: "bg-rose-500/15 text-rose-400",
};

const categoryIcons: Record<string, string> = {
  geral: "📚",
  estratégia: "♟️",
  estoicismo: "🏛️",
  psicologia: "🧠",
  liderança: "👑",
};

const Aprendizado = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [generatingCourse, setGeneratingCourse] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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

  const featuredCourse = courses[0];

  // Course detail view
  if (selectedCourse) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 pb-32">
        <button
          onClick={() => setSelectedCourse(null)}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
        >
          ← Voltar para cursos
        </button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero */}
          <div className="glass rounded-2xl overflow-hidden mb-6">
            {selectedCourse.video_url ? (
              <div className="aspect-video bg-black/90 flex items-center justify-center">
                <iframe
                  src={selectedCourse.video_url.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/20 via-background to-accent/10 flex items-center justify-center">
                <div className="text-center">
                  <GraduationCap className="w-16 h-16 text-primary/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Conteúdo em texto</p>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[selectedCourse.category] || "bg-muted text-muted-foreground"}`}>
                  {categoryIcons[selectedCourse.category] || "📚"} {selectedCourse.category}
                </span>
                {selectedCourse.is_premium && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/15 text-accent flex items-center gap-1">
                    <Star className="w-3 h-3" /> Premium
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-foreground mb-3">{selectedCourse.title}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{selectedCourse.description}</p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(selectedCourse.created_at).toLocaleDateString("pt-BR")}
                </span>
                {selectedCourse.pdf_url && (
                  <a href={selectedCourse.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-medium">
                    <FileText className="w-3.5 h-3.5" /> Baixar PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-32">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Aprendizado</h1>
        <p className="text-sm text-muted-foreground mb-6">Sua biblioteca de conhecimento para evoluir</p>
      </motion.div>

      {/* AI Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleGetTip}
          disabled={loadingTip}
          className="relative glass rounded-2xl p-5 hover:border-accent/40 transition-all group text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-full -mr-6 -mt-6" />
          <Lightbulb className="w-6 h-6 text-accent mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-bold text-foreground">Dica do dia</p>
          <p className="text-xs text-muted-foreground mt-1">IA analisa seu perfil</p>
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={handleGenerateCourse}
          disabled={generatingCourse}
          className="relative glass rounded-2xl p-5 hover:border-primary/40 transition-all group text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-6 -mt-6" />
          {generatingCourse ? (
            <Loader2 className="w-6 h-6 text-primary mb-3 animate-spin" />
          ) : (
            <Sparkles className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
          )}
          <p className="text-sm font-bold text-foreground">Gerar artigo</p>
          <p className="text-xs text-muted-foreground mt-1">Conteúdo com IA</p>
        </motion.button>
      </div>

      {/* Personalized Tip Modal */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass rounded-2xl p-5 mb-8 border-accent/20 relative"
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
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90">
                <ReactMarkdown>{tip}</ReactMarkdown>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Course */}
      {featuredCourse && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Destaque
          </h2>
          <button
            onClick={() => setSelectedCourse(featuredCourse)}
            className="w-full glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all group text-left"
          >
            <div className="h-40 bg-gradient-to-br from-primary/20 via-background to-accent/10 flex items-center justify-center relative">
              {featuredCourse.video_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                  </div>
                </div>
              )}
              {!featuredCourse.video_url && (
                <GraduationCap className="w-12 h-12 text-primary/30" />
              )}
              <div className="absolute top-3 left-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[featuredCourse.category] || "bg-muted text-muted-foreground"}`}>
                  {categoryIcons[featuredCourse.category] || "📚"} {featuredCourse.category}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {featuredCourse.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{featuredCourse.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(featuredCourse.created_at).toLocaleDateString("pt-BR")}
                </span>
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  Acessar <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </button>
        </motion.div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === cat
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {cat === "Todos" ? "📖 Todos" : `${categoryIcons[cat] || ""} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum conteúdo nesta categoria</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Use "Gerar artigo" para criar conteúdo com IA!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((course, i) => (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedCourse(course)}
              className="glass rounded-xl overflow-hidden hover:border-primary/20 transition-all group text-left"
            >
              <div className="h-28 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative">
                {course.video_url ? (
                  <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                  </div>
                ) : (
                  <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                )}
                {course.is_premium && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3.5 h-3.5 text-accent" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[course.category] || "bg-muted text-muted-foreground"}`}>
                  {course.category}
                </span>
                <h3 className="text-sm font-bold text-foreground mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(course.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                    {course.video_url ? (
                      <><Video className="w-3 h-3" /> Vídeo</>
                    ) : (
                      <><FileText className="w-3 h-3" /> Artigo</>
                    )}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Aprendizado;

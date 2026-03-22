import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, FileText, Loader2, Lightbulb, X, Clock, ChevronRight, GraduationCap, Video, Search } from "lucide-react";
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

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match?.[1] ?? null;
};

const getYouTubeThumbnail = (url: string): string | null => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
};

const Aprendizado = () => {
  const { profile, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filtered = courses.filter(c => {
    const matchCategory = filter === "Todos" || c.category === filter;
    const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const videoCourses = filtered.filter(c => c.video_url);
  const articleCourses = filtered.filter(c => !c.video_url);

  const timeSince = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days < 1) return "Hoje";
    if (days === 1) return "1 dia atrás";
    if (days < 30) return `${days} dias atrás`;
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "mês" : "meses"} atrás`;
  };

  if (selectedCourse) {
    const relatedCourses = courses.filter(c => c.id !== selectedCourse.id && c.category === selectedCourse.category).slice(0, 4);

    return (
      <div className="max-w-5xl mx-auto px-4 py-6 pb-32">
        <button onClick={() => setSelectedCourse(null)} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          ← Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {selectedCourse.video_url ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-lg">
                  <iframe
                    src={selectedCourse.video_url.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-background to-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <div className="text-center">
                    <GraduationCap className="w-16 h-16 text-primary/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Conteúdo em texto</p>
                  </div>
                </div>
              )}

              <h1 className="text-xl font-bold text-foreground mb-2">{selectedCourse.title}</h1>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[selectedCourse.category] || "bg-muted text-muted-foreground"}`}>
                  {categoryIcons[selectedCourse.category] || "📚"} {selectedCourse.category}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {timeSince(selectedCourse.created_at)}
                </span>
              </div>

              <div className="glass rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Sobre este conteúdo</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedCourse.description}</p>
                {selectedCourse.pdf_url && (
                  <a href={selectedCourse.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:underline font-medium">
                    <FileText className="w-4 h-4" /> Baixar material em PDF
                  </a>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Relacionados</h3>
            {relatedCourses.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum conteúdo relacionado.</p>
            ) : (
              relatedCourses.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCourse(c); window.scrollTo(0, 0); }}
                  className="w-full flex gap-3 text-left hover:bg-muted/50 rounded-lg p-2 transition-colors group"
                >
                  <div className="w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted relative">
                    {c.video_url ? (
                      <>
                        <img src={getYouTubeThumbnail(c.video_url) || ""} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 text-foreground ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{c.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeSince(c.created_at)}</p>
                    <span className="text-[10px] text-muted-foreground">{c.category}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-32">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Aprendizado</h1>
        <p className="text-sm text-muted-foreground">Sua plataforma de conhecimento</p>
      </motion.div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar cursos, vídeos, artigos..."
          className="w-full bg-muted border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleGetTip}
        disabled={loadingTip}
        className="w-full glass rounded-xl p-4 hover:border-accent/40 transition-all group text-left mb-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Dica personalizada com IA</p>
          <p className="text-xs text-muted-foreground">Receba uma dica baseada no seu nível e progresso</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.button>

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass rounded-xl p-5 mb-6 border-accent/20 relative"
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

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum conteúdo encontrado</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Tente buscar por outro termo ou categoria</p>
        </div>
      ) : (
        <div className="space-y-8">
          {videoCourses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Vídeos</h2>
                <span className="text-xs text-muted-foreground">({videoCourses.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoCourses.map((course, i) => {
                  const thumb = getYouTubeThumbnail(course.video_url!);
                  return (
                    <motion.button
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedCourse(course)}
                      className="text-left group"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-3">
                        {thumb ? (
                          <img src={thumb} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-muted">
                            <Play className="w-10 h-10 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">{categoryIcons[course.category]} {course.category}</span>
                        <span className="text-[11px] text-muted-foreground">• {timeSince(course.created_at)}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}

          {articleCourses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-foreground">Artigos e Cursos</h2>
                <span className="text-xs text-muted-foreground">({articleCourses.length})</span>
              </div>
              <div className="space-y-3">
                {articleCourses.map((course, i) => (
                  <motion.button
                    key={course.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedCourse(course)}
                    className="w-full flex gap-4 glass rounded-xl p-4 hover:border-primary/20 transition-all group text-left"
                  >
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-primary/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[course.category] || "bg-muted text-muted-foreground"}`}>
                          {course.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{course.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeSince(course.created_at)}
                        </span>
                        {course.pdf_url && (
                          <span className="text-[10px] text-primary flex items-center gap-1">
                            <FileText className="w-3 h-3" /> PDF
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground self-center flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Aprendizado;

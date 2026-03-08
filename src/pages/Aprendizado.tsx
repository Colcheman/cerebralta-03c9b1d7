import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, FileText, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = ["Todos", "geral", "estratégia", "estoicismo", "psicologia", "liderança"];

  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCourses((data ?? []) as Course[]);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "Todos" ? courses : courses.filter(c => c.category === filter);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Aprendizado</h1>
        <p className="text-sm text-muted-foreground mb-6">Conteúdos publicados pelo Administrador</p>
      </motion.div>

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
                            <a
                              href={course.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                              <Play className="w-3.5 h-3.5" /> Assistir Vídeo
                            </a>
                          )}
                          {course.pdf_url && (
                            <a
                              href={course.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
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

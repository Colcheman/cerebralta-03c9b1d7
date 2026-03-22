import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import { Plus, Loader2, Trash2, Pencil, Video, FileText, X, Check } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string | null;
  pdf_url: string | null;
  created_at: string;
}

const AdminCoursesPanel = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseCat, setCourseCat] = useState("geral");
  const [courseVideo, setCourseVideo] = useState("");
  const [coursePdf, setCoursePdf] = useState("");
  const [publishing, setPublishing] = useState(false);

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses((data ?? []) as Course[]);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const resetForm = () => {
    setCourseTitle("");
    setCourseDesc("");
    setCourseCat("geral");
    setCourseVideo("");
    setCoursePdf("");
    setEditingCourse(null);
    setShowForm(false);
  };

  const openEdit = (c: Course) => {
    setEditingCourse(c);
    setCourseTitle(c.title);
    setCourseDesc(c.description);
    setCourseCat(c.category);
    setCourseVideo(c.video_url ?? "");
    setCoursePdf(c.pdf_url ?? "");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!courseTitle.trim() || !courseDesc.trim()) return;
    setPublishing(true);

    const payload = {
      title: sanitizeText(courseTitle, 200),
      description: sanitizeText(courseDesc, 5000),
      category: courseCat,
      video_url: sanitizeUrl(courseVideo) || null,
      pdf_url: sanitizeUrl(coursePdf) || null,
    };

    if (editingCourse) {
      await supabase.from("courses").update(payload).eq("id", editingCourse.id);
      toast({ title: "✅ Módulo atualizado!" });
    } else {
      await supabase.from("courses").insert({ ...payload, author_id: userId } as any);
      toast({ title: "✅ Módulo publicado!" });
    }

    setPublishing(false);
    resetForm();
    fetchCourses();
  };

  const deleteCourse = async (id: string) => {
    await supabase.from("courses").delete().eq("id", id);
    setCourses(prev => prev.filter(c => c.id !== id));
    toast({ title: "🗑️ Módulo excluído" });
  };

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              {editingCourse ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingCourse ? "Editar Módulo" : "Novo Módulo"}
            </h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="Título do módulo" maxLength={200}
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
          <textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} placeholder="Descrição do conteúdo..." maxLength={5000}
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[100px]" />
          <select value={courseCat} onChange={e => setCourseCat(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="geral">Geral</option>
            <option value="estratégia">Estratégia</option>
            <option value="estoicismo">Estoicismo</option>
            <option value="psicologia">Psicologia</option>
            <option value="liderança">Liderança</option>
          </select>
          <input value={courseVideo} onChange={e => setCourseVideo(e.target.value)} placeholder="URL do vídeo (YouTube/Vimeo)" maxLength={500}
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
          <input value={coursePdf} onChange={e => setCoursePdf(e.target.value)} placeholder="URL do PDF de apoio" maxLength={500}
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
          <Button onClick={handleSubmit} disabled={!courseTitle.trim() || !courseDesc.trim() || publishing} className="gap-2">
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {editingCourse ? "Salvar Alterações" : "Publicar Módulo"}
          </Button>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Módulo
        </Button>
      )}

      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum módulo publicado ainda.</div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-muted-foreground font-medium">Título</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Categoria</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Data</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground max-w-[250px] truncate">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
                  <td className="px-4 py-3">
                    {c.video_url ? (
                      <span className="flex items-center gap-1 text-xs text-primary"><Video className="w-3 h-3" /> Vídeo</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="w-3 h-3" /> Artigo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button onClick={() => deleteCourse(c.id)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCoursesPanel;

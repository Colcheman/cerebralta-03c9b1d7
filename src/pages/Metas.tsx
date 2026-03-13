import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, CheckCircle2, Pencil, Trash2, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Goal {
  id: string;
  title: string;
  description: string;
  start_date: string;
  target_date: string;
  status: string;
  created_at: string;
}

const parseTargetDate = (input: string): string => {
  const trimmed = input.trim();
  // Full date: DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  // Month/Year: MM/YYYY
  if (/^\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  // Year only: YYYY
  if (/^\d{4}$/.test(trimmed)) return trimmed;
  return trimmed;
};

const formatTargetDate = (raw: string): string => {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split("/");
    return `${d}/${m}/${y}`;
  }
  if (/^\d{2}\/\d{4}$/.test(raw)) {
    const [m, y] = raw.split("/");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(m) - 1] || m}/${y}`;
  }
  if (/^\d{4}$/.test(raw)) return raw;
  return raw;
};

const Metas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const fetchGoals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals((data as Goal[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setStartDate(new Date().toISOString().slice(0, 16));
    setTargetDate("");
    setDialogOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setTitle(g.title);
    setDescription(g.description);
    setStartDate(g.start_date.slice(0, 16));
    setTargetDate(g.target_date);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !targetDate.trim() || !user) return;
    setSaving(true);
    const parsed = parseTargetDate(targetDate);

    if (editing) {
      await supabase.from("user_goals").update({
        title: title.trim(),
        description: description.trim(),
        start_date: new Date(startDate).toISOString(),
        target_date: parsed,
      }).eq("id", editing.id);
      toast({ title: "Meta atualizada!" });
    } else {
      await supabase.from("user_goals").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        start_date: new Date(startDate).toISOString(),
        target_date: parsed,
      });
      toast({ title: "Meta criada!" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchGoals();
  };

  const handleComplete = async (id: string) => {
    await supabase.from("user_goals").update({ status: "completed" }).eq("id", id);
    toast({ title: "Meta concluída! 🎉" });
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_goals").delete().eq("id", id);
    toast({ title: "Meta removida." });
    fetchGoals();
  };

  const active = goals.filter(g => g.status === "active");
  const completed = goals.filter(g => g.status === "completed");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-accent" />
            Minhas Metas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Meta
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma meta ainda. Crie sua primeira meta!</p>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ativas ({active.length})</h2>
              <AnimatePresence>
                {active.map((g, i) => (
                  <GoalCard key={g.id} goal={g} index={i} onComplete={handleComplete} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Concluídas ({completed.length})</h2>
              {completed.map((g, i) => (
                <GoalCard key={g.id} goal={g} index={i} onComplete={handleComplete} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Título *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Aprender um novo idioma" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva sua meta..." className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Data de início</label>
                <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Data prevista *</label>
                <Input value={targetDate} onChange={e => setTargetDate(e.target.value)} placeholder="2030, 05/2030 ou 02/05/2035" className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-1">Ano, mês/ano ou dia/mês/ano</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={!title.trim() || !targetDate.trim() || saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? "Salvar Alterações" : "Criar Meta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const GoalCard = ({ goal, index, onComplete, onEdit, onDelete }: {
  goal: Goal; index: number;
  onComplete: (id: string) => void;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) => {
  const isCompleted = goal.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`p-4 ${isCompleted ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-foreground ${isCompleted ? "line-through" : ""}`}>{goal.title}</h3>
            {goal.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Início: {format(new Date(goal.start_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                🎯 Meta: {formatTargetDate(goal.target_date)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isCompleted && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => onComplete(goal.id)}>
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(goal)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(goal.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default Metas;

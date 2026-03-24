import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const REASONS = [
  "Conteúdo ofensivo",
  "Spam ou propaganda",
  "Assédio ou bullying",
  "Conteúdo falso ou enganoso",
  "Discurso de ódio",
  "Conteúdo inapropriado",
  "Violação de regras",
  "Outro",
];

export type ReportItemType = "user" | "post" | "course" | "group" | "mission" | "notification" | "chat_message";

const itemTypeLabels: Record<ReportItemType, string> = {
  user: "usuário",
  post: "publicação",
  course: "curso",
  group: "grupo",
  mission: "missão",
  notification: "notificação",
  chat_message: "mensagem",
};

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedPostId?: string | null;
  reportedItemId?: string | null;
  reportedItemType?: ReportItemType;
  reportedName?: string;
}

const ReportModal = ({ open, onOpenChange, reportedUserId, reportedPostId, reportedItemId, reportedItemType = "user", reportedName }: ReportModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !user) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId ?? null,
      reported_post_id: reportedPostId ?? null,
      reported_item_id: reportedItemId ?? null,
      reported_item_type: reportedItemType,
      reason,
      description: description.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao denunciar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🚩 Denúncia enviada", description: "Nossa equipe analisará o caso." });
      setReason("");
      setDescription("");
      onOpenChange(false);
    }
  };

  const label = itemTypeLabels[reportedItemType] || "conteúdo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" /> Denunciar {label}
          </DialogTitle>
          <DialogDescription>
            Denunciar {reportedName ?? `este ${label}`}. Sua identidade será mantida em sigilo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Motivo</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Selecione um motivo...</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Descreva o que aconteceu..."
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <Button onClick={handleSubmit} disabled={!reason || submitting} className="w-full gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            Enviar Denúncia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;

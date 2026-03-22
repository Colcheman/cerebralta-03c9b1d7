import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CheckCircle2, XCircle, Loader2, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

const AdminVerificationsPanel = () => {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests" as any)
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as VerificationRequest[];
    },
  });

  const { data: profilesMap = {} } = useQuery({
    queryKey: ["admin-verification-profiles", requests.map(r => r.user_id)],
    queryFn: async () => {
      if (requests.length === 0) return {};
      const userIds = requests.map(r => r.user_id);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, public_id")
        .in("user_id", userIds);
      const map: Record<string, { display_name: string; public_id: string }> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
    enabled: requests.length > 0,
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase
        .from("verification_requests" as any)
        .update({ status: "approved", reviewed_at: new Date().toISOString() } as any)
        .eq("user_id", userId);
      
      await supabase
        .from("profiles")
        .update({ verification_status: "approved" } as any)
        .eq("user_id", userId);

      const { data: files } = await supabase.storage
        .from("verification-docs")
        .list(userId);
      if (files && files.length > 0) {
        await supabase.storage
          .from("verification-docs")
          .remove(files.map(f => `${userId}/${f.name}`));
      }

      // Send approval email
      await supabase.functions.invoke("send-verification-email", {
        body: { userId, status: "approved" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast.success("Verificação aprovada! E-mail enviado ao usuário.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await supabase
        .from("verification_requests" as any)
        .update({ status: "rejected", reviewed_at: new Date().toISOString(), rejection_reason: reason } as any)
        .eq("user_id", userId);
      
      await supabase
        .from("profiles")
        .update({ verification_status: "rejected" } as any)
        .eq("user_id", userId);

      // Delete the uploaded document
      const { data: files } = await supabase.storage
        .from("verification-docs")
        .list(userId);
      if (files && files.length > 0) {
        await supabase.storage
          .from("verification-docs")
          .remove(files.map(f => `${userId}/${f.name}`));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setRejectTarget(null);
      setRejectReason("");
      toast.success("Verificação rejeitada. Documento apagado.");
    },
  });

  const viewDocument = async (userId: string) => {
    const { data: files } = await supabase.storage
      .from("verification-docs")
      .list(userId);

    if (!files || files.length === 0) {
      toast.error("Nenhum documento encontrado.");
      return;
    }

    const { data } = await supabase.storage
      .from("verification-docs")
      .createSignedUrl(`${userId}/${files[0].name}`, 300);

    if (data?.signedUrl) {
      setViewingDoc(data.signedUrl);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
      approved: "bg-green-500/10 text-green-600 border-green-500/30",
      rejected: "bg-destructive/10 text-destructive border-destructive/30",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" /> Verificações de Identidade
        </h3>

        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma solicitação de verificação.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const profile = profilesMap[req.user_id];
              return (
                <div key={req.id} className="bg-muted/50 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.display_name || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.public_id || req.user_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enviado: {new Date(req.submitted_at).toLocaleDateString("pt-BR")}
                    </p>
                    {req.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">Motivo: {req.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusBadge(req.status)}

                    {req.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewDocument(req.user_id)}
                          className="gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => approveMutation.mutate(req.user_id)}
                          disabled={approveMutation.isPending}
                          className="text-green-600 hover:text-green-700 gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRejectTarget(req.user_id)}
                          className="text-destructive hover:text-destructive gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document viewer modal */}
      <AlertDialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Documento de verificação</AlertDialogTitle>
          </AlertDialogHeader>
          {viewingDoc && (
            <img src={viewingDoc} alt="Documento" className="w-full max-h-[60vh] object-contain rounded-lg" />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject reason dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar verificação</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição. O usuário poderá enviar novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo da rejeição..."
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground text-sm min-h-[80px]"
            maxLength={500}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rejectTarget) {
                  rejectMutation.mutate({ userId: rejectTarget, reason: rejectReason });
                }
              }}
              disabled={!rejectReason.trim()}
            >
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVerificationsPanel;

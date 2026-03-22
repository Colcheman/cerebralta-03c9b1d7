import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CheckCircle2, XCircle, Loader2, Eye, User } from "lucide-react";
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

interface ProfileInfo {
  display_name: string;
  public_id: string;
  birth_date: string | null;
  cpf: string;
  country: string;
  created_at: string;
}

const AdminVerificationsPanel = () => {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests")
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
        .select("user_id, display_name, public_id, birth_date, cpf, country, created_at")
        .in("user_id", userIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
    enabled: requests.length > 0,
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase
        .from("verification_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString() } as any)
        .eq("user_id", userId);

      await supabase
        .from("profiles")
        .update({ verification_status: "approved" } as any)
        .eq("user_id", userId);

      // Delete docs after approval
      const { data: files } = await supabase.storage
        .from("verification-docs")
        .list(userId);
      if (files && files.length > 0) {
        await supabase.storage
          .from("verification-docs")
          .remove(files.map(f => `${userId}/${f.name}`));
      }

      await supabase.functions.invoke("send-verification-email", {
        body: { userId, status: "approved" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedUser(null);
      toast.success("Verificação aprovada! E-mail enviado ao usuário.");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao aprovar."),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await supabase
        .from("verification_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString(), rejection_reason: reason } as any)
        .eq("user_id", userId);

      await supabase
        .from("profiles")
        .update({ verification_status: "rejected" } as any)
        .eq("user_id", userId);

      const { data: files } = await supabase.storage
        .from("verification-docs")
        .list(userId);
      if (files && files.length > 0) {
        await supabase.storage
          .from("verification-docs")
          .remove(files.map(f => `${userId}/${f.name}`));
      }

      await supabase.functions.invoke("send-verification-email", {
        body: { userId, status: "rejected" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setRejectTarget(null);
      setRejectReason("");
      setSelectedUser(null);
      toast.success("Verificação rejeitada. E-mail enviado ao usuário.");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao rejeitar."),
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
      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");
  const selected = selectedUser ? requests.find(r => r.user_id === selectedUser) : null;
  const selectedProfile = selectedUser ? profilesMap[selectedUser] : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === "approved").length}</p>
          <p className="text-xs text-muted-foreground">Aprovados</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{requests.filter(r => r.status === "rejected").length}</p>
          <p className="text-xs text-muted-foreground">Rejeitados</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" /> Solicitações de Verificação
          </h3>

          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma solicitação de verificação.
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {pendingRequests.length > 0 && (
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Pendentes</p>
              )}
              {pendingRequests.map((req) => {
                const profile = profilesMap[req.user_id];
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedUser(req.user_id)}
                    className={`w-full text-left p-3 rounded-lg border transition hover:bg-muted/50 ${
                      selectedUser === req.user_id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.display_name || "Usuário"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.public_id} · {new Date(req.submitted_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {statusBadge(req.status)}
                    </div>
                  </button>
                );
              })}

              {processedRequests.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Processados</p>
              )}
              {processedRequests.map((req) => {
                const profile = profilesMap[req.user_id];
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedUser(req.user_id)}
                    className={`w-full text-left p-3 rounded-lg border transition hover:bg-muted/50 ${
                      selectedUser === req.user_id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.display_name || "Usuário"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.public_id} · {new Date(req.submitted_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {statusBadge(req.status)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="bg-card border border-border rounded-xl p-6">
          {selected && selectedProfile ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedProfile.display_name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedProfile.public_id}</p>
                </div>
                <div className="ml-auto">{statusBadge(selected.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedProfile.birth_date
                      ? new Date(selectedProfile.birth_date + "T00:00:00").toLocaleDateString("pt-BR")
                      : "Não informada"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">País</p>
                  <p className="text-sm font-medium text-foreground">{selectedProfile.country}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Cadastro</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selectedProfile.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Enviado em</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selected.submitted_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {selected.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Motivo da rejeição</p>
                  <p className="text-sm text-destructive">{selected.rejection_reason}</p>
                </div>
              )}

              {selected.status === "pending" && (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => viewDocument(selected.user_id)}
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar documento
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approveMutation.mutate(selected.user_id)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => setRejectTarget(selected.user_id)}
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Shield className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Selecione uma solicitação para ver detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Document viewer */}
      <AlertDialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Documento de verificação</AlertDialogTitle>
            <AlertDialogDescription>
              Este documento é exibido temporariamente e não é armazenado após a verificação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {viewingDoc && (
            <img src={viewingDoc} alt="Documento" className="w-full max-h-[60vh] object-contain rounded-lg" />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject reason */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar verificação</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição. O usuário será notificado por e-mail.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

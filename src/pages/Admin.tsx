import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Megaphone, Search, Loader2, Send, Shield, BookOpen, Plus, Clock, Globe, Settings, Bot, KeyRound, CheckCircle2, XCircle, Trash2, CreditCard, Target, BarChart3, Eye, Flag, FileText, Play, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AdminAIAssistant from "@/components/admin/AdminAIAssistant";
import AdminUserDetail from "@/components/admin/AdminUserDetail";
import AdminStatsPanel from "@/components/admin/AdminStatsPanel";
import AdminReportsPanel from "@/components/admin/AdminReportsPanel";
import AdminBlogPanel from "@/components/admin/AdminBlogPanel";
import AdminVerificationsPanel from "@/components/admin/AdminVerificationsPanel";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
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

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  level: string;
  points: number;
  streak: number;
  subscription_tier: string;
  created_at: string;
  whatsapp_number?: string | null;
  real_name?: string | null;
  name_verified?: boolean;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // News
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [publishingNews, setPublishingNews] = useState(false);

  // Course
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseCat, setCourseCat] = useState("geral");
  const [courseVideo, setCourseVideo] = useState("");
  const [coursePdf, setCoursePdf] = useState("");
  const [courseIsPremium, setCourseIsPremium] = useState(false);
  const [publishingCourse, setPublishingCourse] = useState(false);

  // Missions
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDesc, setMissionDesc] = useState("");
  const [missionCategory, setMissionCategory] = useState("disciplina");
  const [missionPoints, setMissionPoints] = useState("20");
  const [missionIcon, setMissionIcon] = useState("📝");
  const [missionVideo, setMissionVideo] = useState("");
  const [missionIsPremium, setMissionIsPremium] = useState(false);
  const [publishingMission, setPublishingMission] = useState(false);

  // Webhook URL
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  // ASAAS Config
  const [asaasEnv, setAsaasEnv] = useState("sandbox");
  const [asaasWebhook, setAsaasWebhook] = useState("");
  const [savingAsaas, setSavingAsaas] = useState(false);
  const [asaasKeyConfigured, setAsaasKeyConfigured] = useState(false);

  // Password reset
  const [resetTarget, setResetTarget] = useState<ProfileRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  // Delete user
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [premiumConfirm, setPremiumConfirm] = useState<{ userId: string; currentTier: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      supabase.from("profiles").select("*").order("points", { ascending: false }).then(({ data }) => {
        setProfiles((data ?? []) as ProfileRow[]);
        setLoadingProfiles(false);
      });
      // Load webhook URL
      supabase.from("admin_settings").select("*").then(({ data }) => {
        const settings = data ?? [];
        const wh = settings.find((s: any) => s.key === "whatsapp_webhook_url");
        if (wh) setWebhookUrl((wh as any).value);
        const env = settings.find((s: any) => s.key === "asaas_environment");
        if (env) setAsaasEnv((env as any).value);
        const awh = settings.find((s: any) => s.key === "asaas_webhook_url");
        if (awh) setAsaasWebhook((awh as any).value);
        const ak = settings.find((s: any) => s.key === "asaas_api_key_configured");
        setAsaasKeyConfigured(!!ak);
      });
    }
  }, [isAdmin]);

  if (isAdmin === null) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return <Navigate to="/feed" replace />;

  const filteredProfiles = profiles.filter(p =>
    p.display_name.toLowerCase().includes(search.toLowerCase())
  );


  const togglePremium = async (profileUserId: string, currentTier: string) => {
    const newTier = currentTier === "premium" ? "free" : "premium";
    const { data, error } = await supabase.rpc("admin_set_premium", {
      _target_user_id: profileUserId,
      _tier: newTier,
    } as any);
    if (error || !data) {
      toast({ title: "Erro ao atualizar", description: error?.message ?? "Sem permissão", variant: "destructive" });
      return;
    }
    setProfiles(prev => prev.map(p => p.user_id === profileUserId ? { ...p, subscription_tier: newTier } : p));
    toast({ title: newTier === "premium" ? "⭐ Premium ativado!" : "Plano revertido para Free" });
  };

  const getTimeSince = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days < 1) return "Hoje";
    if (days === 1) return "1 dia";
    if (days < 30) return `${days} dias`;
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  };

  const saveWebhookUrl = async () => {
    const safeUrl = sanitizeUrl(webhookUrl);
    if (!safeUrl) {
      toast({ title: "URL inválida", description: "Use uma URL https:// válida.", variant: "destructive" });
      return;
    }
    setSavingWebhook(true);
    const { data: existing } = await supabase.from("admin_settings").select("id").eq("key", "whatsapp_webhook_url").single();
    if (existing) {
      await supabase.from("admin_settings").update({ value: safeUrl }).eq("key", "whatsapp_webhook_url");
    } else {
      await supabase.from("admin_settings").insert({ key: "whatsapp_webhook_url", value: safeUrl } as any);
    }
    setSavingWebhook(false);
    toast({ title: "Webhook salvo", description: "URL do webhook de WhatsApp atualizada." });
  };

  const publishNews = async () => {
    if (!newsTitle.trim() || !newsContent.trim() || !user) return;
    setPublishingNews(true);
    const safeTitle = sanitizeText(newsTitle, 200);
    const safeContent = sanitizeText(newsContent, 5000);
    await supabase.from("news").insert({ title: safeTitle, content: safeContent, author_id: user.id });

    // Queue WhatsApp notifications for users with whatsapp_number
    const whatsappUsers = profiles.filter(p => p.whatsapp_number);
    if (whatsappUsers.length > 0) {
      const queueItems = whatsappUsers.map(p => ({
        recipient_user_id: p.user_id,
        recipient_whatsapp: p.whatsapp_number!,
        message_type: "news",
        payload: { title: newsTitle.trim(), content: newsContent.trim().slice(0, 500) },
        webhook_url: webhookUrl || null,
      }));
      await supabase.from("notification_queue").insert(queueItems as any);

      // If webhook URL is configured, try to dispatch
      if (webhookUrl) {
        try {
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "news_broadcast",
              title: newsTitle.trim(),
              content: newsContent.trim().slice(0, 500),
              recipients: whatsappUsers.map(p => ({ name: p.display_name, number: p.whatsapp_number })),
            }),
          });
          if (response.ok) {
            toast({ title: `📱 WhatsApp enviado`, description: `Webhook disparado para ${whatsappUsers.length} Arquitetos.` });
            // Mark as sent
            await supabase.from("notification_queue").update({ status: "sent", sent_at: new Date().toISOString() } as any)
              .eq("status", "pending").eq("message_type", "news");
          } else {
            toast({ title: "⚠️ Webhook falhou", description: `Status: ${response.status}. Notificações ficaram na fila.`, variant: "destructive" });
          }
        } catch {
          toast({ title: "⚠️ Webhook inacessível", description: "Notificações salvas na fila para reprocessamento.", variant: "destructive" });
        }
      } else {
        toast({ title: `📱 ${whatsappUsers.length} notificações na fila`, description: "Configure a URL do webhook para disparar automaticamente." });
      }
    }

    setNewsTitle("");
    setNewsContent("");
    setPublishingNews(false);
    toast({ title: "News publicada!", description: "Todos os Arquitetos Mentais podem ver a atualização." });
  };

  const publishCourse = async () => {
    if (!courseTitle.trim() || !courseDesc.trim() || !user) return;
    setPublishingCourse(true);
    await supabase.from("courses").insert({
      title: sanitizeText(courseTitle, 200),
      description: sanitizeText(courseDesc, 5000),
      category: courseCat,
      video_url: sanitizeUrl(courseVideo) || null,
      pdf_url: sanitizeUrl(coursePdf) || null,
      is_premium: courseIsPremium,
      author_id: user.id,
    } as any);
    setCourseTitle("");
    setCourseDesc("");
    setCourseVideo("");
    setCoursePdf("");
    setCourseIsPremium(false);
    setPublishingCourse(false);
    toast({ title: "Módulo publicado!", description: "O conteúdo está disponível na área de Aprendizado." });
  };

  const publishMission = async () => {
    if (!missionTitle.trim() || !missionDesc.trim() || !user) return;
    setPublishingMission(true);
    await supabase.from("missions").insert({
      title: sanitizeText(missionTitle, 200),
      description: sanitizeText(missionDesc, 2000),
      category: missionCategory,
      points: parseInt(missionPoints) || 20,
      icon: missionIcon || "📝",
      video_url: sanitizeUrl(missionVideo) || null,
      is_premium: missionIsPremium,
      is_active: true,
    } as any);
    setMissionTitle("");
    setMissionDesc("");
    setMissionVideo("");
    setMissionIsPremium(false);
    setMissionPoints("20");
    setMissionIcon("📝");
    setPublishingMission(false);
    toast({ title: "Missão criada!", description: "A missão está disponível para os usuários." });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gestão do ecossistema Cerebralta</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="users" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="bg-muted inline-flex w-auto min-w-max">
            <TabsTrigger value="stats" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Estatísticas</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Arquitetos</TabsTrigger>
            <TabsTrigger value="courses" className="gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5" /> Cursos</TabsTrigger>
            <TabsTrigger value="missions" className="gap-1.5 text-xs"><Target className="w-3.5 h-3.5" /> Missões</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs"><Bot className="w-3.5 h-3.5" /> IA</TabsTrigger>
            <TabsTrigger value="news" className="gap-1.5 text-xs"><Megaphone className="w-3.5 h-3.5" /> News</TabsTrigger>
            <TabsTrigger value="asaas" className="gap-1.5 text-xs"><CreditCard className="w-3.5 h-3.5" /> Pagamentos</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5 text-xs"><Flag className="w-3.5 h-3.5" /> Denúncias</TabsTrigger>
            <TabsTrigger value="blog" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Blog</TabsTrigger>
            <TabsTrigger value="verification" className="gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" /> Verificação</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs"><Settings className="w-3.5 h-3.5" /> Sistema</TabsTrigger>
          </TabsList>
        </div>

        {/* Stats Dashboard */}
        <TabsContent value="stats" className="space-y-4">
          <AdminStatsPanel />
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          {selectedUser ? (
            <AdminUserDetail profile={selectedUser} onBack={() => setSelectedUser(null)} />
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome..."
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              {loadingProfiles ? (
                <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
              ) : (
                <>
                  <div className="glass rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-4 py-3 text-muted-foreground font-medium">Nome</th>
                          <th className="px-4 py-3 text-muted-foreground font-medium">ID</th>
                          <th className="px-4 py-3 text-muted-foreground font-medium">Nível</th>
                          <th className="px-4 py-3 text-muted-foreground font-medium">Pontos</th>
                          <th className="px-4 py-3 text-muted-foreground font-medium">Sequência</th>
                          <th className="px-4 py-3 text-muted-foreground font-medium">Plano</th>
                          <th className="px-4 py-3 text-muted-foreground font-medium"><Clock className="w-3.5 h-3.5 inline" /> Cadastro</th>
                          <th className="px-4 py-3 text-muted-foreground font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProfiles.map(p => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedUser(p)}>
                            <td className="px-4 py-3 font-medium text-foreground">
                              <div className="flex items-center gap-1.5">
                                {p.display_name}
                                {p.name_verified ? (
                                  <span title="Nome verificado"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /></span>
                                ) : (
                                  <span title="Nome não verificado"><XCircle className="w-3.5 h-3.5 text-muted-foreground/40" /></span>
                                )}
                              </div>
                              {p.real_name && p.real_name !== p.display_name && (
                                <p className="text-xs text-muted-foreground">Real: {p.real_name}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{(p as any).public_id || p.user_id.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-accent">{p.level}</td>
                            <td className="px-4 py-3">{p.points}</td>
                            <td className="px-4 py-3 text-orange-400">{p.streak} dias🔥</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); setPremiumConfirm({ userId: p.user_id, currentTier: p.subscription_tier, name: p.display_name }); }}
                                className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                                  p.subscription_tier === "premium" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                                }`}
                                title={p.subscription_tier === "premium" ? "Clique para remover Premium" : "Clique para ativar Premium"}
                              >
                                {p.subscription_tier === "premium" ? "⭐ premium" : "free"}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{getTimeSince(p.created_at)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedUser(p)}
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                  title="Ver perfil completo"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Ver
                                </button>
                                <button
                                  onClick={() => { setResetTarget(p); setNewPassword(""); }}
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                  title="Redefinir senha"
                                >
                                  <KeyRound className="w-3.5 h-3.5" /> Senha
                                </button>
                                <button
                                  onClick={async () => {
                                    const newVal = !p.name_verified;
                                    await supabase.from("profiles").update({ name_verified: newVal } as any).eq("user_id", p.user_id);
                                    setProfiles(prev => prev.map(pr => pr.user_id === p.user_id ? { ...pr, name_verified: newVal } : pr));
                                    toast({ title: newVal ? "✅ Nome verificado" : "Nome desmarcado" });
                                  }}
                                  className={`text-xs hover:underline flex items-center gap-1 ${p.name_verified ? "text-primary" : "text-muted-foreground"}`}
                                  title={p.name_verified ? "Desmarcar verificação" : "Verificar nome"}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {p.name_verified ? "✓" : "Verificar"}
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(p)}
                                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                                  title="Excluir usuário"
                                  disabled={p.user_id === user?.id}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProfiles.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">Nenhum Arquiteto Mental encontrado.</p>}
                  </div>

                  {resetTarget && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setResetTarget(null)}>
                      <div className="glass rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-primary" /> Redefinir Senha
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Definir nova senha para <span className="font-medium text-foreground">{resetTarget.display_name}</span>
                        </p>
                        <input
                          type="text"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Nova senha (mín. 6 caracteres)"
                          className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setResetTarget(null)} className="flex-1">Cancelar</Button>
                          <Button
                            size="sm"
                            disabled={newPassword.length < 6 || resettingPassword}
                            className="flex-1 gap-1"
                            onClick={async () => {
                              setResettingPassword(true);
                              const { data, error } = await supabase.functions.invoke("admin-reset-password", {
                                body: { target_user_id: resetTarget.user_id, new_password: newPassword },
                              });
                              setResettingPassword(false);
                              if (error || data?.error) {
                                toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" });
                              } else {
                                toast({ title: "🔑 Senha redefinida!", description: `Senha de ${resetTarget.display_name} atualizada.` });
                                setResetTarget(null);
                              }
                            }}
                          >
                            {resettingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {deleteTarget && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                      <div className="glass rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Excluir Usuário
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Tem certeza que deseja excluir permanentemente o usuário <span className="font-medium text-foreground">{deleteTarget.display_name}</span>?
                        </p>
                        <p className="text-xs text-destructive/80">
                          Esta ação é irreversível. Todos os dados do usuário serão removidos.
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="flex-1">Cancelar</Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deletingUser}
                            className="flex-1 gap-1"
                            onClick={async () => {
                              setDeletingUser(true);
                              const { data, error } = await supabase.functions.invoke("admin-delete-user", {
                                body: { target_user_id: deleteTarget.user_id },
                              });
                              setDeletingUser(false);
                              if (error || data?.error) {
                                toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" });
                              } else {
                                setProfiles(prev => prev.filter(p => p.user_id !== deleteTarget.user_id));
                                toast({ title: "🗑️ Usuário excluído", description: `${deleteTarget.display_name} foi removido do sistema.` });
                                setDeleteTarget(null);
                              }
                            }}
                          >
                            {deletingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses" className="space-y-4">
          <AdminCoursesPanel userId={user?.id ?? ""} />
        </TabsContent>

        {/* Missions */}
        <TabsContent value="missions" className="space-y-4">
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> Criar Missão</h3>
            <input value={missionTitle} onChange={e => setMissionTitle(e.target.value)} placeholder="Título da missão" maxLength={200}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            <textarea value={missionDesc} onChange={e => setMissionDesc(e.target.value)} placeholder="Descrição da missão..." maxLength={2000}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[80px]" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={missionCategory} onChange={e => setMissionCategory(e.target.value)}
                className="bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="disciplina">Disciplina</option>
                <option value="mindset">Mindset</option>
                <option value="social">Social</option>
                <option value="saúde">Saúde</option>
                <option value="estratégia">Estratégia</option>
              </select>
              <input value={missionPoints} onChange={e => setMissionPoints(e.target.value)} placeholder="Pontos" type="number" min="1" max="100"
                className="bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={missionIcon} onChange={e => setMissionIcon(e.target.value)} placeholder="Emoji ícone" maxLength={4}
                className="bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={missionIsPremium} onChange={e => setMissionIsPremium(e.target.checked)} className="accent-primary" />
                Premium
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <input value={missionVideo} onChange={e => setMissionVideo(e.target.value)} placeholder="URL do vídeo (YouTube) - opcional" maxLength={500}
                className="flex-1 bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <Button onClick={publishMission} disabled={!missionTitle.trim() || !missionDesc.trim() || publishingMission} className="gap-2">
              {publishingMission ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              Criar Missão
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <AdminAIAssistant />
        </TabsContent>

        {/* News */}
        <TabsContent value="news" className="space-y-4">
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Publicar News / Atualização</h3>
            <input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="Título da notícia" maxLength={200}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            <textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} placeholder="Conteúdo da notícia..." maxLength={5000}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[120px]" />
            <Button onClick={publishNews} disabled={!newsTitle.trim() || !newsContent.trim() || publishingNews} className="gap-2">
              {publishingNews ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publicar para todos os Arquitetos Mentais
            </Button>
          </div>
        </TabsContent>

        {/* ASAAS Payments */}
        <TabsContent value="asaas" className="space-y-4">
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" /> Configurações de Pagamento (ASAAS)
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure a integração com o ASAAS para cobranças recorrentes e assinatura premium. 
              A API Key deve ser configurada como secret no backend para segurança.
            </p>

            {/* API Key status */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">API Key ASAAS</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${asaasKeyConfigured ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"}`}>
                  {asaasKeyConfigured ? "✅ Configurada" : "❌ Não configurada"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {asaasKeyConfigured 
                  ? "A chave está armazenada com segurança no backend. Para alterar, atualize o secret ASAAS_API_KEY nas configurações do projeto."
                  : "Acesse Configurações → Cloud → Secrets e adicione o secret ASAAS_API_KEY com sua chave da API ASAAS."}
              </p>
            </div>

            {/* Environment */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ambiente</label>
              <select
                value={asaasEnv}
                onChange={e => setAsaasEnv(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="sandbox">🧪 Sandbox (Testes)</option>
                <option value="production">🚀 Produção (Cobranças reais)</option>
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                {asaasEnv === "sandbox" 
                  ? "Ambiente de testes. Nenhuma cobrança real será feita." 
                  : "⚠️ Ambiente de produção. Cobranças reais serão geradas!"}
              </p>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL Webhook ASAAS</label>
              <input
                value={asaasWebhook}
                onChange={e => setAsaasWebhook(e.target.value)}
                placeholder="https://sua-api.com/webhook/asaas"
                maxLength={500}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Receba notificações de pagamento do ASAAS nesta URL.</p>
            </div>

            <Button
              onClick={async () => {
                setSavingAsaas(true);
                // Save environment
                const { data: envExists } = await supabase.from("admin_settings").select("id").eq("key", "asaas_environment").single();
                if (envExists) {
                  await supabase.from("admin_settings").update({ value: asaasEnv }).eq("key", "asaas_environment");
                } else {
                  await supabase.from("admin_settings").insert({ key: "asaas_environment", value: asaasEnv } as any);
                }
                // Save webhook
                if (asaasWebhook.trim()) {
                  const safeUrl = sanitizeUrl(asaasWebhook);
                  if (safeUrl) {
                    const { data: whExists } = await supabase.from("admin_settings").select("id").eq("key", "asaas_webhook_url").single();
                    if (whExists) {
                      await supabase.from("admin_settings").update({ value: safeUrl }).eq("key", "asaas_webhook_url");
                    } else {
                      await supabase.from("admin_settings").insert({ key: "asaas_webhook_url", value: safeUrl } as any);
                    }
                  }
                }
                setSavingAsaas(false);
                toast({ title: "💳 Configurações ASAAS salvas!", description: `Ambiente: ${asaasEnv === "sandbox" ? "Sandbox" : "Produção"}` });
              }}
              disabled={savingAsaas}
              className="w-full gap-2"
            >
              {savingAsaas ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Salvar Configurações de Pagamento
            </Button>
          </div>

          {/* Billing Info */}
          <div className="glass rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" /> Sistema de Desconto por Engajamento
            </h3>
            <p className="text-xs text-muted-foreground">
              O valor base da assinatura é <span className="font-semibold text-accent">R$ 52,90</span>. Descontos são aplicados automaticamente no 1º dia de cada mês baseado nos dias ativos do mês anterior.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-lg font-bold text-accent">75%</p>
                <p className="text-[10px] text-muted-foreground">30 dias ativos</p>
                <p className="text-xs font-medium text-foreground">R$ 13,23</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-lg font-bold text-primary">45%</p>
                <p className="text-[10px] text-muted-foreground">20 dias ativos</p>
                <p className="text-xs font-medium text-foreground">R$ 29,10</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-lg font-bold text-foreground">25%</p>
                <p className="text-[10px] text-muted-foreground">10 dias ativos</p>
                <p className="text-xs font-medium text-foreground">R$ 39,68</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-4">
          <AdminReportsPanel />
        </TabsContent>

        {/* Blog */}
        <TabsContent value="blog" className="space-y-4">
          <AdminBlogPanel />
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <AdminVerificationsPanel />
        </TabsContent>

        {/* Webhook / System Settings */}
        <TabsContent value="settings" className="space-y-4">
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Globe className="w-4 h-4" /> URL do Webhook de WhatsApp</h3>
            <p className="text-xs text-muted-foreground">
              Configure a URL da sua API externa de WhatsApp. Quando uma News for publicada, o sistema disparará um POST com os números dos Arquitetos.
            </p>
            <input
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://sua-api.com/webhook/whatsapp"
              maxLength={500}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
            />
            <Button onClick={saveWebhookUrl} disabled={!webhookUrl.trim() || savingWebhook} className="gap-2">
              {savingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              Salvar Webhook URL
            </Button>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Formato do Payload</h3>
            <pre className="bg-muted rounded-lg p-4 text-xs text-muted-foreground overflow-x-auto">
{`POST {webhook_url}
Content-Type: application/json

{
  "type": "news_broadcast",
  "title": "Título da News",
  "content": "Conteúdo resumido...",
  "recipients": [
    { "name": "João", "number": "+5511999999999" }
  ]
}`}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
      <AlertDialog open={!!premiumConfirm} onOpenChange={(open) => !open && setPremiumConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de plano</AlertDialogTitle>
            <AlertDialogDescription>
              {premiumConfirm?.currentTier === "premium"
                ? `Deseja remover o plano Premium de "${premiumConfirm?.name}"? O usuário perderá acesso aos recursos exclusivos.`
                : `Deseja ativar o plano Premium para "${premiumConfirm?.name}"? O usuário terá acesso a todos os recursos exclusivos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (premiumConfirm) {
                  togglePremium(premiumConfirm.userId, premiumConfirm.currentTier);
                }
                setPremiumConfirm(null);
              }}
            >
              {premiumConfirm?.currentTier === "premium" ? "Remover Premium" : "Ativar Premium"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;

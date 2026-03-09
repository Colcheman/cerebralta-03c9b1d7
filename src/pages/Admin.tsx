import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Megaphone, Search, Loader2, Send, Shield, BookOpen, Plus, Clock, Globe, Settings, Bot, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AdminAIAssistant from "@/components/admin/AdminAIAssistant";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  cpf: string;
  level: string;
  points: number;
  streak: number;
  subscription_tier: string;
  created_at: string;
  whatsapp_number?: string | null;
}

// Mask CPF: 123.456.789-00 → ***.456.***-**
const maskCPF = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.${digits.slice(3, 6)}.***-**`;
};

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

  // Webhook URL
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  // Password reset
  const [resetTarget, setResetTarget] = useState<ProfileRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

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
      supabase.from("admin_settings").select("value").eq("key", "whatsapp_webhook_url").single().then(({ data }) => {
        if (data) setWebhookUrl(data.value);
      });
    }
  }, [isAdmin]);

  if (isAdmin === null) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return <Navigate to="/feed" replace />;

  const filteredProfiles = profiles.filter(p =>
    p.display_name.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search.replace(/\D/g, ""))
  );

  const togglePremium = async (profileUserId: string, currentTier: string) => {
    const newTier = currentTier === "premium" ? "free" : "premium";
    const { error } = await supabase.from("profiles").update({ subscription_tier: newTier } as any).eq("user_id", profileUserId);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
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
        <TabsList className="bg-muted">
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" /> Arquitetos</TabsTrigger>
          <TabsTrigger value="courses" className="gap-1.5"><BookOpen className="w-4 h-4" /> Cursos</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5"><Bot className="w-4 h-4" /> IA</TabsTrigger>
          <TabsTrigger value="news" className="gap-1.5"><Megaphone className="w-4 h-4" /> News</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" /> Webhooks</TabsTrigger>
        </TabsList>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou CPF..."
              className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {loadingProfiles ? (
            <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
          ) : (
            <div className="glass rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-muted-foreground font-medium">Nome</th>
                    <th className="px-4 py-3 text-muted-foreground font-medium">Nível</th>
                    <th className="px-4 py-3 text-muted-foreground font-medium">Pontos</th>
                    <th className="px-4 py-3 text-muted-foreground font-medium">Streak</th>
                     <th className="px-4 py-3 text-muted-foreground font-medium">Plano</th>
                     <th className="px-4 py-3 text-muted-foreground font-medium"><Clock className="w-3.5 h-3.5 inline" /> Tempo</th>
                     <th className="px-4 py-3 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map(p => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{p.display_name}</td>
                      <td className="px-4 py-3 text-accent">{p.level}</td>
                      <td className="px-4 py-3">{p.points}</td>
                      <td className="px-4 py-3 text-streak">{p.streak}🔥</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePremium(p.user_id, p.subscription_tier)}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                            p.subscription_tier === "premium" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                          }`}
                          title={p.subscription_tier === "premium" ? "Clique para remover Premium" : "Clique para ativar Premium"}
                        >
                          {p.subscription_tier === "premium" ? "⭐ premium" : "free"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{getTimeSince(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProfiles.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">Nenhum Arquiteto Mental encontrado.</p>}
            </div>
          )}
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses" className="space-y-4">
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> Publicar Módulo de Curso</h3>
            <input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="Título do módulo" maxLength={200}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            <textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} placeholder="Descrição do conteúdo..." maxLength={5000}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[100px]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={courseCat} onChange={e => setCourseCat(e.target.value)}
                className="bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="geral">Geral</option>
                <option value="estratégia">Estratégia</option>
                <option value="estoicismo">Estoicismo</option>
                <option value="psicologia">Psicologia</option>
                <option value="liderança">Liderança</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={courseIsPremium} onChange={e => setCourseIsPremium(e.target.checked)} className="accent-primary" />
                Conteúdo Premium
              </label>
            </div>
            <input value={courseVideo} onChange={e => setCourseVideo(e.target.value)} placeholder="URL do vídeo (YouTube/Vimeo)" maxLength={500}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={coursePdf} onChange={e => setCoursePdf(e.target.value)} placeholder="URL do PDF de apoio" maxLength={500}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            <Button onClick={publishCourse} disabled={!courseTitle.trim() || !courseDesc.trim() || publishingCourse} className="gap-2">
              {publishingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Publicar Módulo
            </Button>
          </div>
        </TabsContent>

        {/* AI Assistant */}
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

        {/* Webhook Settings */}
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
    </div>
  );
};

export default Admin;

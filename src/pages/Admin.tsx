import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, Megaphone, Search, Loader2, Send, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

const Admin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // News state
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [publishingNews, setPublishingNews] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      supabase.from("profiles").select("*").order("points", { ascending: false }).then(({ data }) => {
        setProfiles((data ?? []) as ProfileRow[]);
        setLoadingProfiles(false);
      });
    }
  }, [isAdmin]);

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/feed" replace />;

  const filteredProfiles = profiles.filter(p =>
    p.display_name.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf.includes(search.replace(/\D/g, ""))
  );

  const publishNews = async () => {
    if (!newsTitle.trim() || !newsContent.trim() || !user) return;
    setPublishingNews(true);
    await supabase.from("news").insert({
      title: newsTitle.trim(),
      content: newsContent.trim(),
      author_id: user.id,
    });
    setNewsTitle("");
    setNewsContent("");
    setPublishingNews(false);
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
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" /> Arquitetos Mentais</TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5"><FileText className="w-4 h-4" /> Conteúdo</TabsTrigger>
          <TabsTrigger value="news" className="gap-1.5"><Megaphone className="w-4 h-4" /> News</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {loadingProfiles ? (
            <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-muted-foreground font-medium">Nome</th>
                    <th className="px-4 py-3 text-muted-foreground font-medium">Nível</th>
                    <th className="px-4 py-3 text-muted-foreground font-medium">Pontos</th>
                    <th className="px-4 py-3 text-muted-foreground font-medium">Streak</th>
                    <th className="px-4 py-3 text-muted-foreground font-medium">Plano</th>
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
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.subscription_tier === "premium" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                        }`}>
                          {p.subscription_tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProfiles.length === 0 && (
                <p className="text-center py-6 text-sm text-muted-foreground">Nenhum Arquiteto Mental encontrado.</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <div className="glass rounded-xl p-6 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Gestão de conteúdo educativo (vídeos, textos e lições) será disponibilizada em breve.
            </p>
          </div>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news" className="space-y-4">
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Publicar News / Atualização</h3>
            <input
              value={newsTitle}
              onChange={e => setNewsTitle(e.target.value)}
              placeholder="Título da notícia"
              maxLength={200}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <textarea
              value={newsContent}
              onChange={e => setNewsContent(e.target.value)}
              placeholder="Conteúdo da notícia..."
              maxLength={5000}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[120px]"
            />
            <Button onClick={publishNews} disabled={!newsTitle.trim() || !newsContent.trim() || publishingNews} className="gap-2">
              {publishingNews ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publicar para todos os Arquitetos Mentais
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;

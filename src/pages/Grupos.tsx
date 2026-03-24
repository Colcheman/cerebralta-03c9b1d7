import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, LogIn, LogOut, Loader2, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReportModal from "@/components/ReportModal";

interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  is_active: boolean;
  members_count: number;
  created_at: string;
}

const Grupos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportGroup, setReportGroup] = useState<Group | null>(null);
  const fetchGroups = async () => {
    const { data } = await supabase.from("groups").select("*").eq("is_active", true).order("members_count", { ascending: false });
    setGroups((data ?? []) as Group[]);
    if (user) {
      const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
      setMyGroupIds(new Set(memberships?.map(m => m.group_id) ?? []));
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [user]);

  const createGroup = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { data: group } = await supabase
      .from("groups")
      .insert({ name: newName.trim(), description: newDesc.trim(), creator_id: user.id })
      .select()
      .single();
    if (group) {
      await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id });
    }
    setNewName("");
    setNewDesc("");
    setDialogOpen(false);
    setCreating(false);
    fetchGroups();
  };

  const toggleMembership = async (e: React.MouseEvent, groupId: string, isMember: boolean) => {
    e.stopPropagation();
    if (!user) return;
    setJoining(groupId);
    if (isMember) {
      await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
      await supabase.from("groups").update({ members_count: Math.max((groups.find(g => g.id === groupId)?.members_count ?? 1) - 1, 0) }).eq("id", groupId);
    } else {
      await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
      await supabase.from("groups").update({ members_count: (groups.find(g => g.id === groupId)?.members_count ?? 0) + 1 }).eq("id", groupId);
    }
    setJoining(null);
    fetchGroups();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Grupos</h1>
            <p className="text-sm text-muted-foreground">Comunidades de Arquitetos Mentais</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-xl"><Plus className="w-5 h-5" /></Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader><DialogTitle>Criar Grupo</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do grupo" maxLength={60}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" maxLength={300}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[80px]" />
                <Button onClick={createGroup} disabled={!newName.trim() || creating} className="w-full">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Criar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Carregando grupos...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum grupo ainda. Crie o primeiro! 🧠</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, i) => {
            const isMember = myGroupIds.has(group.id);
            const isCreator = group.creator_id === user?.id;
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/grupos/${group.id}`)}
                className="glass rounded-xl p-5 hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
                      {group.description && <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">{group.members_count} membros</span>
                         {isCreator && <span className="text-xs text-accent font-medium">Criador</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); setReportGroup(group); }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                          title="Denunciar grupo"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    {isMember ? (
                      <Button size="sm" variant="outline" onClick={(e) => toggleMembership(e, group.id, true)} disabled={joining === group.id} className="text-xs gap-1">
                        {joining === group.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />} Sair
                      </Button>
                    ) : (
                      <Button size="sm" onClick={(e) => toggleMembership(e, group.id, false)} disabled={joining === group.id} className="text-xs gap-1">
                        {joining === group.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />} Entrar
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Grupos;

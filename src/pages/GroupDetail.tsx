import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Send, LogIn, LogOut, Loader2, Crown, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ReportModal from "@/components/ReportModal";

interface GroupData {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  members_count: number;
  created_at: string;
}

interface Member {
  user_id: string;
  display_name: string;
  level: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [tab, setTab] = useState<"chat" | "members">("chat");
  const [showReport, setShowReport] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchGroup = async () => {
    if (!id) return;
    const { data } = await supabase.from("groups").select("*").eq("id", id).single();
    if (data) setGroup(data as GroupData);
    else navigate("/grupos");
  };

  const fetchMembers = async () => {
    if (!id) return;
    const { data: gm } = await supabase.from("group_members").select("user_id").eq("group_id", id);
    if (!gm) return;
    const userIds = gm.map(m => m.user_id);
    if (user) setIsMember(userIds.includes(user.id));
    const { data: profiles } = await supabase
      .from("safe_profiles")
      .select("user_id, display_name, level, avatar_url")
      .in("user_id", userIds);
    setMembers((profiles ?? []) as Member[]);
  };

  const fetchMessages = async () => {
    if (!id) return;
    const { data: msgs } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: true })
      .limit(100);
    if (!msgs) return;
    const userIds = [...new Set(msgs.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from("safe_profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) ?? []);
    setMessages(msgs.map(m => ({ ...m, display_name: pMap.get(m.user_id) ?? "Anônimo" })));
  };

  useEffect(() => {
    Promise.all([fetchGroup(), fetchMembers(), fetchMessages()]).then(() => setLoading(false));
  }, [id]);

  // Realtime subscription
  useEffect(() => {
    if (!id || !isMember) return;
    const channel = supabase
      .channel(`group-${id}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${id}` }, (payload) => {
        const msg = payload.new as any;
        // Skip if we already have this message (optimistic add)
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id || (m.user_id === msg.user_id && m.content === msg.content && Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000))) {
            return prev;
          }
          // Fetch display_name
          supabase.from("profiles").select("display_name").eq("user_id", msg.user_id).single().then(({ data }) => {
            setMessages(p => p.map(m => m.id === msg.id ? { ...m, display_name: data?.display_name ?? "Anônimo" } : m));
          });
          return [...prev, { ...msg, display_name: "..." }];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, isMember]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinGroup = async () => {
    if (!user || !id) return;
    setJoining(true);
    await supabase.from("group_members").insert({ group_id: id, user_id: user.id });
    await supabase.from("groups").update({ members_count: (group?.members_count ?? 0) + 1 }).eq("id", id);
    setIsMember(true);
    setJoining(false);
    fetchMembers();
    fetchMessages();
    fetchGroup();
  };

  const leaveGroup = async () => {
    if (!user || !id) return;
    setJoining(true);
    await supabase.from("group_members").delete().eq("group_id", id).eq("user_id", user.id);
    await supabase.from("groups").update({ members_count: Math.max((group?.members_count ?? 1) - 1, 0) }).eq("id", id);
    setIsMember(false);
    setJoining(false);
    fetchMembers();
    fetchGroup();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || !id) return;
    const content = newMsg.trim();
    setNewMsg("");
    // Optimistic: add message immediately
    const optimistic: Message = {
      id: crypto.randomUUID(),
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      display_name: members.find(m => m.user_id === user.id)?.display_name ?? "Você",
    };
    setMessages(prev => [...prev, optimistic]);
    await supabase.from("group_messages").insert({ group_id: id, user_id: user.id, content });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!group) return null;

  const isCreator = group.creator_id === user?.id;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-5rem)] lg:h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/grupos")} className="text-muted-foreground hover:text-foreground p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">{group.name}</h1>
            <p className="text-xs text-muted-foreground">{group.members_count} membros</p>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
            title="Denunciar grupo"
          >
            <Flag className="w-4 h-4" />
          </button>
          {isMember ? (
            <Button size="sm" variant="outline" onClick={leaveGroup} disabled={joining} className="text-xs gap-1">
              {joining ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />} Sair
            </Button>
          ) : (
            <Button size="sm" onClick={joinGroup} disabled={joining} className="text-xs gap-1">
              {joining ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />} Entrar
            </Button>
          )}
        </div>
        {/* Tabs */}
        <div className="flex mt-3 border-b border-border -mx-4 px-4">
          {(["chat", "members"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium relative ${tab === t ? "text-foreground" : "text-muted-foreground"}`}
            >
              {t === "chat" ? "Chat" : `Membros (${members.length})`}
              {tab === t && (
                <motion.div layoutId="grouptab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "chat" ? (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!isMember ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Entre no grupo para participar do chat. 🔒
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhuma mensagem ainda. Inicie a conversa! 💬
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isOwn = msg.user_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        {!isOwn && <p className="text-[10px] font-semibold text-primary mb-0.5">{msg.display_name}</p>}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          {isMember && (
            <div className="border-t border-border px-4 py-3">
              <div className="flex gap-2">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Mensagem..."
                  maxLength={2000}
                  className="flex-1 bg-muted border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={sendMessage} disabled={!newMsg.trim()} className="bg-primary text-primary-foreground p-2.5 rounded-full hover:opacity-90 disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Members list */
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {members.map(m => {
            const initials = m.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const isGroupCreator = m.user_id === group.creator_id;
            return (
              <motion.div key={m.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-2.5 border-b border-border/50">
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{m.display_name}</span>
                    {isGroupCreator && <Crown className="w-3.5 h-3.5 text-accent" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{m.level}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupDetail;

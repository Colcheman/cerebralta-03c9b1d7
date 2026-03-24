import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Search, Loader2, ArrowLeft, MoreVertical, BellOff, Bell, Ban, Trash2, AlertTriangle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import ContactProfileSheet from "@/components/chat/ContactProfileSheet";
import ReportModal from "@/components/ReportModal";

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  other_user?: { display_name: string; avatar_url: string | null; level: string };
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  reply_to_id?: string | null;
  message_type?: string;
  media_url?: string | null;
}

interface ProfileBasic {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: string;
}

const Mensagens = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<ProfileBasic[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mutedConvos, setMutedConvos] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "block"; label: string } | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [reportModal, setReportModal] = useState<{ open: boolean; userId: string; postId?: string | null; name?: string }>({ open: false, userId: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getOtherId = (c: Conversation) => c.participant_1 === user?.id ? c.participant_2 : c.participant_1;

  // Load conversations
  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      if (!convos) { setLoading(false); return; }
      const otherIds = convos.map(c => c.participant_1 === user.id ? c.participant_2 : c.participant_1);
      const { data: profiles } = await supabase.from("safe_profiles").select("user_id, display_name, avatar_url, level").in("user_id", otherIds);
      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));
      setConversations(convos.map(c => ({ ...c, other_user: profileMap.get(c.participant_1 === user.id ? c.participant_2 : c.participant_1) })) as Conversation[]);
      setLoading(false);
    };
    loadConversations();
  }, [user]);

  // Load messages
  useEffect(() => {
    if (!selectedConvo) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", selectedConvo.id)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Message[]);
      if (user) {
        await supabase.from("direct_messages").update({ read: true }).eq("conversation_id", selectedConvo.id).neq("sender_id", user.id).eq("read", false);
      }
    };
    loadMessages();
  }, [selectedConvo, user]);

  // Realtime
  useEffect(() => {
    if (!selectedConvo) return;
    const channel = supabase
      .channel(`dm-${selectedConvo.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${selectedConvo.id}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id || (m.sender_id === newMsg.sender_id && m.content === newMsg.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000))) {
            return prev.map(m => (m.sender_id === newMsg.sender_id && m.content === newMsg.content && m.id !== newMsg.id && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000) ? newMsg : m);
          }
          return [...prev, newMsg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    if (showMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  useEffect(() => {
    const stored = localStorage.getItem("muted_convos");
    if (stored) setMutedConvos(new Set(JSON.parse(stored)));
  }, []);

  const toggleMute = () => {
    if (!selectedConvo) return;
    setMutedConvos(prev => {
      const next = new Set(prev);
      if (next.has(selectedConvo.id)) { next.delete(selectedConvo.id); toast({ title: "🔔 Notificações ativadas" }); }
      else { next.add(selectedConvo.id); toast({ title: "🔕 Conversa silenciada" }); }
      localStorage.setItem("muted_convos", JSON.stringify([...next]));
      return next;
    });
    setShowMenu(false);
  };

  const deleteChat = async () => {
    if (!selectedConvo || !user) return;
    await supabase.from("direct_messages").delete().eq("conversation_id", selectedConvo.id).eq("sender_id", user.id);
    setConversations(prev => prev.filter(c => c.id !== selectedConvo.id));
    setSelectedConvo(null); setMessages([]); setConfirmAction(null); setShowMenu(false);
    toast({ title: "🗑️ Chat excluído" });
  };

  const blockUser = async () => {
    if (!selectedConvo || !user) return;
    const otherId = getOtherId(selectedConvo);
    const { error } = await (supabase as any).from("user_blocks").insert({ blocker_id: user.id, blocked_id: otherId });
    if (error && error.code === "23505") toast({ title: "Usuário já bloqueado" });
    else if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "🚫 Usuário bloqueado" });
      setConversations(prev => prev.filter(c => c.id !== selectedConvo.id));
      setSelectedConvo(null); setMessages([]);
    }
    setConfirmAction(null); setShowMenu(false);
  };

  const handleSend = async (content: string, messageType: string, mediaUrl: string | null, replyToId: string | null) => {
    if (!selectedConvo || !user) return;
    setSending(true);
    const optimistic: Message = {
      id: crypto.randomUUID(), conversation_id: selectedConvo.id, sender_id: user.id,
      content, read: false, created_at: new Date().toISOString(),
      reply_to_id: replyToId, message_type: messageType, media_url: mediaUrl,
    };
    setMessages(prev => [...prev, optimistic]);
    await (supabase as any).from("direct_messages").insert({
      conversation_id: selectedConvo.id, sender_id: user.id, content,
      message_type: messageType, media_url: mediaUrl, reply_to_id: replyToId,
    });
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", selectedConvo.id);
    setSending(false);
  };

  const startNewChat = async (targetUserId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from("conversations").select("*").or(`and(participant_1.eq.${user.id},participant_2.eq.${targetUserId}),and(participant_1.eq.${targetUserId},participant_2.eq.${user.id})`);
    if (existing && existing.length > 0) {
      const otherProfile = allUsers.find(u => u.user_id === targetUserId);
      setSelectedConvo({ ...existing[0], other_user: otherProfile } as Conversation);
      setShowNewChat(false); return;
    }
    const { data: newConvo } = await supabase.from("conversations").insert({ participant_1: user.id, participant_2: targetUserId }).select().single();
    if (newConvo) {
      const otherProfile = allUsers.find(u => u.user_id === targetUserId);
      const enriched = { ...newConvo, other_user: otherProfile } as Conversation;
      setConversations(prev => [enriched, ...prev]);
      setSelectedConvo(enriched); setShowNewChat(false);
    }
  };

  useEffect(() => {
    if (!showNewChat || !user) return;
    supabase.from("safe_profiles").select("user_id, display_name, avatar_url, level").neq("user_id", user.id).then(({ data }) => setAllUsers((data ?? []) as ProfileBasic[]));
  }, [showNewChat, user]);

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const filteredUsers = allUsers.filter(u => u.display_name.toLowerCase().includes(search.toLowerCase()));

  const getReplyData = (msg: Message) => {
    if (!msg.reply_to_id) return null;
    const original = messages.find(m => m.id === msg.reply_to_id);
    if (!original) return null;
    const senderName = original.sender_id === user?.id ? "Você" : (selectedConvo?.other_user?.display_name ?? "Usuário");
    return { id: original.id, content: original.content, senderName };
  };

  const handleReportMessage = (msgId: string) => {
    if (!selectedConvo) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    setReportModal({ open: true, userId: msg.sender_id, postId: msgId, name: selectedConvo.other_user?.display_name });
  };

  const handleReportContact = () => {
    if (!selectedConvo) return;
    const otherId = getOtherId(selectedConvo);
    setReportModal({ open: true, userId: otherId, name: selectedConvo.other_user?.display_name });
    setShowMenu(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-4 py-4">
        {selectedConvo && (
          <button onClick={() => setSelectedConvo(null)} className="lg:hidden text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
        )}
        <MessageCircle className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">Mensagens</h1>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShowNewChat(!showNewChat)}>
          {showNewChat ? "Voltar" : "Nova conversa"}
        </Button>
      </motion.div>

      <div className="flex-1 flex overflow-hidden rounded-xl border border-border mx-4 mb-4">
        {/* Sidebar */}
        <div className={`w-full lg:w-80 border-r border-border flex flex-col bg-card ${selectedConvo ? "hidden lg:flex" : "flex"}`}>
          {showNewChat ? (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..."
                    className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredUsers.map(u => (
                  <button key={u.user_id} onClick={() => startNewChat(u.user_id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                      {getInitials(u.display_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.display_name}</p>
                      <p className="text-xs text-accent">{u.level}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map(c => (
                    <button key={c.id} onClick={() => { setSelectedConvo(c); setShowNewChat(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${selectedConvo?.id === c.id ? "bg-primary/5" : ""}`}>
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                        {getInitials(c.other_user?.display_name ?? "?")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.other_user?.display_name ?? "Usuário"}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(c.last_message_at)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col bg-background ${!selectedConvo ? "hidden lg:flex" : "flex"}`}>
          {selectedConvo ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                <button onClick={() => { setSelectedConvo(null); setShowMenu(false); setReplyTo(null); }} className="lg:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setShowContactProfile(true)} className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground hover:ring-2 hover:ring-primary/30 transition-all">
                  {getInitials(selectedConvo.other_user?.display_name ?? "?")}
                </button>
                <button onClick={() => setShowContactProfile(true)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedConvo.other_user?.display_name ?? "Usuário"}
                    {mutedConvos.has(selectedConvo.id) && <BellOff className="w-3 h-3 inline ml-1.5 text-muted-foreground" />}
                  </p>
                  <p className="text-xs text-accent">{selectedConvo.other_user?.level}</p>
                </button>

                <div className="relative" ref={menuRef}>
                  <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden">
                        <button onClick={() => { setShowContactProfile(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left">
                          <User className="w-4 h-4 text-primary" /> Ver perfil
                        </button>
                        <button onClick={toggleMute}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left">
                          {mutedConvos.has(selectedConvo.id) ? <><Bell className="w-4 h-4 text-primary" /> Ativar notificações</> : <><BellOff className="w-4 h-4 text-muted-foreground" /> Silenciar conversa</>}
                        </button>
                        <button onClick={handleReportContact}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors text-left">
                          <AlertTriangle className="w-4 h-4" /> Denunciar contato
                        </button>
                        <button onClick={() => { setConfirmAction({ type: "block", label: selectedConvo.other_user?.display_name ?? "Usuário" }); setShowMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors text-left">
                          <Ban className="w-4 h-4" /> Bloquear usuário
                        </button>
                        <div className="border-t border-border" />
                        <button onClick={() => { setConfirmAction({ type: "delete", label: "" }); setShowMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors text-left">
                          <Trash2 className="w-4 h-4" /> Excluir conversa
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <ChatMessage
                    key={m.id}
                    id={m.id}
                    content={m.content}
                    senderId={m.sender_id}
                    currentUserId={user?.id ?? ""}
                    createdAt={m.created_at}
                    messageType={m.message_type ?? "text"}
                    mediaUrl={m.media_url}
                    replyTo={getReplyData(m)}
                    senderName={m.sender_id === user?.id ? "Você" : (selectedConvo.other_user?.display_name ?? "Usuário")}
                    onReply={(id, content, senderName) => setReplyTo({ id, content, senderName })}
                    onReport={handleReportMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <ChatInput
                userId={user?.id ?? ""}
                conversationId={selectedConvo.id}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
                onSend={handleSend}
                sending={sending}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">Selecione uma conversa ou inicie uma nova</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Profile Sheet */}
      {selectedConvo && (
        <ContactProfileSheet
          open={showContactProfile}
          onClose={() => setShowContactProfile(false)}
          userId={getOtherId(selectedConvo)}
          onReport={() => { setShowContactProfile(false); handleReportContact(); }}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        open={reportModal.open}
        onOpenChange={(open) => setReportModal(prev => ({ ...prev, open }))}
        reportedUserId={reportModal.userId}
        reportedPostId={reportModal.postId}
        reportedName={reportModal.name}
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmAction(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {confirmAction.type === "delete" ? "Excluir conversa?" : `Bloquear ${confirmAction.label}?`}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {confirmAction.type === "delete" ? "Suas mensagens serão removidas. Esta ação não pode ser desfeita." : "Este usuário será bloqueado e a conversa será removida."}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmAction(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={confirmAction.type === "delete" ? deleteChat : blockUser} className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  {confirmAction.type === "delete" ? "Excluir" : "Bloquear"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mensagens;

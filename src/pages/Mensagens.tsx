import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Search, Send, Loader2, ArrowLeft, MoreVertical, BellOff, Bell, Ban, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<ProfileBasic[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mutedConvos, setMutedConvos] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "block"; label: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

      const enriched = convos.map(c => {
        const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        return { ...c, other_user: profileMap.get(otherId) };
      });

      setConversations(enriched as Conversation[]);
      setLoading(false);
    };
    loadConversations();
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvo) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", selectedConvo.id)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Message[]);

      // Mark unread as read
      if (user) {
        await supabase.from("direct_messages")
          .update({ read: true })
          .eq("conversation_id", selectedConvo.id)
          .neq("sender_id", user.id)
          .eq("read", false);
      }
    };
    loadMessages();
  }, [selectedConvo, user]);

  // Realtime messages
  useEffect(() => {
    if (!selectedConvo) return;
    const channel = supabase
      .channel(`dm-${selectedConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${selectedConvo.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          // Avoid duplicates: check by ID or by matching content+sender for optimistic msgs
          if (prev.some(m => m.id === newMsg.id || 
            (m.sender_id === newMsg.sender_id && m.content === newMsg.content && m.id !== newMsg.id && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000)
          )) {
            // Replace optimistic msg with real one
            return prev.map(m => 
              (m.sender_id === newMsg.sender_id && m.content === newMsg.content && m.id !== newMsg.id && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000)
                ? newMsg : m
            );
          }
          return [...prev, newMsg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvo || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: selectedConvo.id,
      sender_id: user.id,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    await supabase.from("direct_messages").insert({
      conversation_id: selectedConvo.id,
      sender_id: user.id,
      content,
    });
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", selectedConvo.id);
    setSending(false);
  };

  const startNewChat = async (targetUserId: string) => {
    if (!user) return;
    // Check existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${targetUserId}),and(participant_1.eq.${targetUserId},participant_2.eq.${user.id})`);

    if (existing && existing.length > 0) {
      const otherProfile = allUsers.find(u => u.user_id === targetUserId);
      setSelectedConvo({ ...existing[0], other_user: otherProfile } as Conversation);
      setShowNewChat(false);
      return;
    }

    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({ participant_1: user.id, participant_2: targetUserId })
      .select()
      .single();

    if (newConvo) {
      const otherProfile = allUsers.find(u => u.user_id === targetUserId);
      const enriched = { ...newConvo, other_user: otherProfile } as Conversation;
      setConversations(prev => [enriched, ...prev]);
      setSelectedConvo(enriched);
      setShowNewChat(false);
    }
  };

  // Load all users for new chat
  useEffect(() => {
    if (!showNewChat || !user) return;
    supabase.from("safe_profiles").select("user_id, display_name, avatar_url, level").neq("user_id", user.id).then(({ data }) => {
      setAllUsers((data ?? []) as ProfileBasic[]);
    });
  }, [showNewChat, user]);

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const filteredUsers = allUsers.filter(u => u.display_name.toLowerCase().includes(search.toLowerCase()));

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
        {/* Sidebar - conversations list */}
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
                  <p className="text-xs text-muted-foreground/60 mt-1">Inicie uma nova conversa!</p>
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
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {getInitials(selectedConvo.other_user?.display_name ?? "?")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedConvo.other_user?.display_name ?? "Usuário"}</p>
                  <p className="text-xs text-accent">{selectedConvo.other_user?.level}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                      m.sender_id === user?.id
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-border bg-card">
                <div className="flex gap-2">
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="icon" className="shrink-0 rounded-xl">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">Selecione uma conversa ou inicie uma nova</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mensagens;

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface OnboardingChatProps {
  onComplete: () => void;
}

const OnboardingChat = ({ onComplete }: OnboardingChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || sending) return;

    const userMsg: ChatMessage = { role: "user", content: userText.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          mode: "onboarding_chat",
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      const content = data?.content ?? "";

      // Check if AI returned ready JSON with missions
      const jsonMatch = content.match(/\{[\s\S]*"ready"\s*:\s*true[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // Show a final message without the JSON
          const cleanContent = content.replace(jsonMatch[0], "").trim();
          const finalMsg = cleanContent || `🎯 Perfeito! Criei ${parsed.missions?.length || 3} missões personalizadas para você com base no que conversamos. Bora começar!`;
          setMessages(prev => [...prev, { role: "assistant", content: finalMsg }]);

          // Wait a moment then transition
          setTimeout(() => {
            toast.success("🎯 Missões personalizadas criadas!");
            onComplete();
          }, 2500);
        } catch {
          setMessages(prev => [...prev, { role: "assistant", content }]);
        }
      } else {
        setMessages(prev => [...prev, { role: "assistant", content }]);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleStart = () => {
    setStarted(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center py-12"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6"
        >
          <Brain className="w-10 h-10 text-primary" />
        </motion.div>

        <h2 className="text-xl font-bold text-foreground mb-3">
          Vamos personalizar sua jornada
        </h2>
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed max-w-sm mx-auto">
          Me conta: o que você quer melhorar na sua vida? Vou criar missões diárias 
          <span className="font-semibold text-foreground"> sob medida </span> 
          para você evoluir de verdade.
        </p>
        <p className="text-xs text-muted-foreground/70 mb-8">
          Exemplos: "Quero parar de procrastinar", "Quero ter mais disciplina", "Quero acordar cedo"
        </p>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:opacity-90 transition-all"
        >
          <Sparkles className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Começar conversa
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg mx-auto flex flex-col h-[calc(100vh-220px)] min-h-[400px]"
    >
      {/* Chat header */}
      <div className="glass rounded-t-xl p-4 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Mentor Cerebralta</p>
          <p className="text-xs text-muted-foreground">Vamos entender seu momento</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto glass p-4 space-y-4">
        {/* Initial bot message */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-2"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
            <p className="text-sm text-foreground leading-relaxed">
              E aí! 👋 Me conta — <span className="font-semibold">o que você mais quer mudar ou melhorar na sua vida agora?</span> 
              {" "}Pode ser qualquer coisa: produtividade, saúde, mentalidade, relacionamentos...
            </p>
          </div>
        </motion.div>

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="glass rounded-b-xl p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva aqui..."
            disabled={sending}
            className="text-sm min-h-[44px] max-h-[100px] resize-none bg-muted/50 border-border"
            rows={1}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className={`px-3.5 rounded-xl transition-all shrink-0 ${
              input.trim() && !sending
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OnboardingChat;

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles, Copy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeneratedCourse {
  title: string;
  description: string;
  category: string;
  content: string;
}

interface AdminAIAssistantProps {
  onCourseGenerated?: (course: { title: string; description: string; category: string }) => void;
}

const AdminAIAssistant = ({ onCourseGenerated }: AdminAIAssistantProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"generate" | "assistant">("assistant");
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [publishing, setPublishing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = async (userMessages: ChatMessage[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ messages: userMessages, mode }),
    });

    if (!resp.ok || !resp.body) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `Erro: ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullContent } : m);
              }
              return [...prev, { role: "assistant", content: fullContent }];
            });
          }
        } catch { /* partial json */ }
      }
    }

    return fullContent;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setGeneratedCourse(null);

    try {
      const fullContent = await streamChat(updatedMessages);

      // Try to parse as generated course if in generate mode
      if (mode === "generate") {
        try {
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.title && parsed.description) {
              setGeneratedCourse(parsed);
            }
          }
        } catch { /* not valid JSON course */ }
      }
    } catch (e: any) {
      toast({ title: "Erro na IA", description: e.message, variant: "destructive" });
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${e.message}` }]);
    }
    setIsLoading(false);
  };

  const publishGeneratedCourse = async () => {
    if (!generatedCourse || !user) return;
    setPublishing(true);
    const { error } = await supabase.from("courses").insert({
      title: generatedCourse.title,
      description: generatedCourse.description,
      category: generatedCourse.category || "geral",
      author_id: user.id,
    } as any);

    if (error) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Módulo publicado!", description: `"${generatedCourse.title}" está disponível no Aprendizado.` });
      onCourseGenerated?.({ title: generatedCourse.title, description: generatedCourse.description, category: generatedCourse.category });
      setGeneratedCourse(null);
    }
    setPublishing(false);
  };

  return (
    <div className="glass rounded-xl flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Assistente IA</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMode("assistant")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${mode === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            💬 Chat
          </button>
          <button onClick={() => setMode("generate")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${mode === "generate" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            ✨ Gerar Curso
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-8 h-8 text-primary/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {mode === "generate"
                ? 'Descreva o tema do módulo. Ex: "Crie um módulo sobre técnicas de estoicismo aplicado ao dia a dia"'
                : "Pergunte qualquer coisa sobre criação de conteúdo educacional"}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Generated course action */}
      {generatedCourse && (
        <div className="mx-4 mb-2 p-3 bg-accent/10 border border-accent/20 rounded-xl">
          <p className="text-xs font-semibold text-accent mb-1">📚 Módulo gerado: {generatedCourse.title}</p>
          <p className="text-xs text-muted-foreground mb-2">{generatedCourse.description.slice(0, 100)}...</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={publishGeneratedCourse} disabled={publishing} className="gap-1.5 text-xs">
              {publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
              Publicar Módulo
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(generatedCourse, null, 2));
              toast({ title: "Copiado!" });
            }} className="gap-1.5 text-xs">
              <Copy className="w-3 h-3" /> Copiar JSON
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={mode === "generate" ? "Descreva o tema do módulo..." : "Pergunte à IA..."}
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAIAssistant;

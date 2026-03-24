import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Mic, X, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReplyContext {
  id: string;
  content: string;
  senderName: string;
}

interface ChatInputProps {
  userId: string;
  conversationId: string;
  replyTo: ReplyContext | null;
  onClearReply: () => void;
  onSend: (content: string, messageType: string, mediaUrl: string | null, replyToId: string | null) => void;
  sending: boolean;
}

const ChatInput = ({ userId, conversationId, replyTo, onClearReply, onSend, sending }: ChatInputProps) => {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendText = () => {
    if (!text.trim() || sending) return;
    onSend(text.trim(), "text", null, replyTo?.id ?? null);
    setText("");
    onClearReply();
  };

  const uploadFile = async (file: File, type: "image" | "audio"): Promise<string | null> => {
    const ext = file.name.split(".").pop() ?? (type === "audio" ? "webm" : "jpg");
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file);
    if (error) {
      toast({ title: "Erro ao enviar arquivo", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const url = await uploadFile(file, "image");
    if (url) {
      onSend(text.trim(), "image", url, replyTo?.id ?? null);
      setText("");
      onClearReply();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) { toast({ title: "Áudio muito curto" }); return; }
        setUploading(true);
        const file = new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
        const url = await uploadFile(file, "audio");
        if (url) {
          onSend("🎤 Áudio", "audio", url, replyTo?.id ?? null);
          onClearReply();
        }
        setUploading(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast({ title: "Acesso ao microfone negado", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="border-t border-border bg-card">
      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 pt-2 flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-lg px-3 py-1.5 border-l-2 border-primary">
            <p className="text-[10px] font-semibold text-primary">{replyTo.senderName}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          <button onClick={onClearReply} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        {/* Image upload */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || recording}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </button>

        {/* Audio */}
        {recording ? (
          <button onClick={stopRecording} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors animate-pulse">
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={startRecording} disabled={uploading} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            <Mic className="w-4 h-4" />
          </button>
        )}

        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendText()}
          placeholder={recording ? "Gravando áudio..." : "Digite sua mensagem..."}
          disabled={recording}
          className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />

        <Button onClick={handleSendText} disabled={!text.trim() || sending || recording} size="icon" className="shrink-0 rounded-xl">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;

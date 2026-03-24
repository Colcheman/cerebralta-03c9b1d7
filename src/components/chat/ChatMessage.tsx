import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Reply, Flag, Image as ImageIcon, Mic } from "lucide-react";

interface ChatMessageProps {
  id: string;
  content: string;
  senderId: string;
  currentUserId: string;
  createdAt: string;
  messageType: string;
  mediaUrl?: string | null;
  replyTo?: { id: string; content: string; senderName: string } | null;
  onReply: (msgId: string, content: string, senderName: string) => void;
  onReport: (msgId: string) => void;
  senderName?: string;
}

const ChatMessage = ({
  id, content, senderId, currentUserId, createdAt, messageType, mediaUrl,
  replyTo, onReply, onReport, senderName
}: ChatMessageProps) => {
  const isOwn = senderId === currentUserId;
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setShowActions(false);
    };
    if (showActions) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showActions]);

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const displayName = senderName ?? (isOwn ? "Você" : "Usuário");

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group relative`}
      onContextMenu={(e) => { e.preventDefault(); setShowActions(true); }}
    >
      {/* Hover actions */}
      <div className={`hidden group-hover:flex items-center gap-1 self-center ${isOwn ? "order-first mr-1" : "order-last ml-1"}`}>
        <button onClick={() => onReply(id, content, displayName)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Responder">
          <Reply className="w-3.5 h-3.5" />
        </button>
        {!isOwn && (
          <button onClick={() => onReport(id)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors" title="Denunciar">
            <Flag className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div
        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm relative ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        {/* Reply preview */}
        {replyTo && (
          <div className={`mb-1.5 px-2.5 py-1.5 rounded-lg border-l-2 text-[11px] ${
            isOwn ? "bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground/80" : "bg-background/60 border-primary/40 text-muted-foreground"
          }`}>
            <p className="font-semibold text-[10px]">{replyTo.senderName}</p>
            <p className="truncate">{replyTo.content}</p>
          </div>
        )}

        {/* Media content */}
        {messageType === "image" && mediaUrl && (
          <div className="mb-1.5">
            <img src={mediaUrl} alt="Imagem" className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer" onClick={() => window.open(mediaUrl, "_blank")} />
          </div>
        )}

        {messageType === "audio" && mediaUrl && (
          <div className="mb-1.5 flex items-center gap-2">
            <Mic className="w-4 h-4 shrink-0" />
            <audio controls src={mediaUrl} className="max-w-full h-8" style={{ minWidth: "180px" }} />
          </div>
        )}

        {/* Text content */}
        {content && <p className="whitespace-pre-wrap break-words">{content}</p>}

        <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {formatTime(createdAt)}
        </p>
      </div>

      {/* Context menu on right-click */}
      {showActions && (
        <div ref={actionsRef} className={`absolute z-30 ${isOwn ? "right-0" : "left-0"} top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[10rem]`}>
          <button onClick={() => { onReply(id, content, displayName); setShowActions(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left">
            <Reply className="w-3.5 h-3.5" /> Responder
          </button>
          {!isOwn && (
            <button onClick={() => { onReport(id); setShowActions(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-muted transition-colors text-left">
              <Flag className="w-3.5 h-3.5" /> Denunciar mensagem
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;

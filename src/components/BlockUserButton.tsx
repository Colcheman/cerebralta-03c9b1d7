import { useState } from "react";
import { Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BlockUserButtonProps {
  targetUserId: string;
  targetName?: string;
  variant?: "button" | "menu";
  onBlocked?: () => void;
}

const BlockUserButton = ({ targetUserId, targetName, variant = "button", onBlocked }: BlockUserButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blocking, setBlocking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user || user.id === targetUserId) return null;

  const handleBlock = async () => {
    setBlocking(true);
    const { error } = await supabase.from("user_blocks").insert({
      blocker_id: user.id,
      blocked_id: targetUserId,
    } as any);
    setBlocking(false);
    setShowConfirm(false);
    if (error?.code === "23505") {
      toast({ title: "Usuário já bloqueado" });
    } else if (error) {
      toast({ title: "Erro ao bloquear", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🚫 Usuário bloqueado", description: `${targetName ?? "Usuário"} não verá mais seu conteúdo.` });
      onBlocked?.();
    }
  };

  if (variant === "menu") {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors text-left"
        disabled={blocking}
      >
        <Ban className="w-4 h-4" /> Bloquear
        {showConfirm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <div className="glass rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-foreground">Bloquear {targetName ?? "usuário"}?</h3>
              <p className="text-xs text-muted-foreground">Posts e conteúdo deste usuário serão ocultados do seu feed.</p>
              <div className="flex gap-2">
                <button onClick={e => { e.stopPropagation(); setShowConfirm(false); }} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancelar</button>
                <button onClick={e => { e.stopPropagation(); handleBlock(); }} disabled={blocking} className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">Bloquear</button>
              </div>
            </div>
          </div>
        )}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        disabled={blocking}
      >
        <Ban className="w-4 h-4" /> Bloquear
      </button>
      {showConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground">Bloquear {targetName ?? "usuário"}?</h3>
            <p className="text-xs text-muted-foreground">Posts e conteúdo deste usuário serão ocultados do seu feed.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancelar</button>
              <button onClick={handleBlock} disabled={blocking} className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">Bloquear</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlockUserButton;

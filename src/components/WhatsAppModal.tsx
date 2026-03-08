import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WhatsAppModal = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ddi, setDdi] = useState("+55");
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!number.trim() || !user) return;
    setSaving(true);
    const full = `${ddi}${number.replace(/\D/g, "")}`;
    await supabase.from("profiles").update({ whatsapp_number: full }).eq("user_id", user.id);
    setSaving(false);
    setSaved(true);
    toast({ title: "WhatsApp vinculado!", description: `Número ${full} salvo com sucesso.` });
    setTimeout(() => { setSaved(false); onOpenChange(false); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-success" /> Vincular WhatsApp
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Insira seu número com DDI e DDD para receber notificações e news do Cerebralta via WhatsApp.
        </p>
        <div className="flex gap-2 mt-3">
          <input
            value={ddi}
            onChange={e => setDdi(e.target.value)}
            placeholder="+55"
            maxLength={4}
            className="w-16 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="11999999999"
            maxLength={15}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button onClick={save} disabled={!number.trim() || saving || saved} className="w-full mt-3 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          {saved ? "Salvo!" : "Vincular Número"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppModal;

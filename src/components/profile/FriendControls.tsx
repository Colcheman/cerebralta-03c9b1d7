import { useEffect, useMemo, useState } from "react";
import { UserCheck, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type FriendshipStatus = "pending" | "accepted" | "rejected";

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export default function FriendControls({ targetUserId }: { targetUserId: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState<FriendshipRow | null>(null);

  const isSelf = user?.id === targetUserId;

  const load = async () => {
    if (!user || !targetUserId || isSelf) return;
    setLoading(true);

    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`
      )
      .maybeSingle();

    setFriendship((data as FriendshipRow) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !targetUserId || isSelf) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, targetUserId]);

  const myRole = useMemo(() => {
    if (!user || !friendship) return null;
    if (friendship.requester_id === user.id) return "requester" as const;
    if (friendship.addressee_id === user.id) return "addressee" as const;
    return null;
  }, [user, friendship]);

  if (!user || isSelf) return null;

  const baseBtn =
    "flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60 disabled:hover:bg-transparent";

  const sendRequest = async () => {
    if (!user) return;
    await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: targetUserId, status: "pending" });
    await load();
  };

  const accept = async () => {
    if (!friendship) return;
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendship.id);
    await load();
  };

  const reject = async () => {
    if (!friendship) return;
    await supabase.from("friendships").update({ status: "rejected" }).eq("id", friendship.id);
    await load();
  };

  if (loading) {
    return (
      <button className={baseBtn} disabled>
        Carregando...
      </button>
    );
  }

  if (!friendship || friendship.status === "rejected") {
    return (
      <button className={baseBtn} onClick={sendRequest}>
        <UserPlus className="w-4 h-4" />
        Adicionar como amigo
      </button>
    );
  }

  if (friendship.status === "accepted") {
    return (
      <button className={baseBtn} disabled>
        <UserCheck className="w-4 h-4" />
        Amigos
      </button>
    );
  }

  // pending
  if (myRole === "requester") {
    return (
      <button className={baseBtn} disabled>
        <UserPlus className="w-4 h-4" />
        Pedido enviado
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button className={baseBtn} onClick={accept}>
        <UserCheck className="w-4 h-4" />
        Aceitar
      </button>
      <button className={baseBtn} onClick={reject}>
        <X className="w-4 h-4" />
        Recusar
      </button>
    </div>
  );
}

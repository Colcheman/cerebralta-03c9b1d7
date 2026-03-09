import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, UserPlus, X } from "lucide-react";

type FriendshipStatus = "pending" | "accepted" | "rejected";

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

interface SafeProfile {
  user_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: string | null;
}

function initialsFromName(name?: string | null) {
  const base = (name ?? "AM").trim();
  if (!base) return "AM";
  return base
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Amigos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FriendshipRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, SafeProfile>>(new Map());

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    const list = (friendships as FriendshipRow[] | null) ?? [];
    setRows(list);

    const otherIds = Array.from(
      new Set(
        list
          .map((r) => (r.requester_id === user.id ? r.addressee_id : r.requester_id))
          .filter(Boolean)
      )
    );

    if (otherIds.length > 0) {
      const { data: sp } = await supabase
        .from("safe_profiles")
        .select("user_id, display_name, avatar_url, level")
        .in("user_id", otherIds);

      const map = new Map<string, SafeProfile>();
      (sp as SafeProfile[] | null)?.forEach((p) => {
        if (p.user_id) map.set(p.user_id, p);
      });
      setProfiles(map);
    } else {
      setProfiles(new Map());
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const incoming = useMemo(
    () => rows.filter((r) => r.status === "pending" && r.addressee_id === user?.id),
    [rows, user?.id]
  );
  const outgoing = useMemo(
    () => rows.filter((r) => r.status === "pending" && r.requester_id === user?.id),
    [rows, user?.id]
  );
  const friends = useMemo(
    () => rows.filter((r) => r.status === "accepted"),
    [rows]
  );

  const accept = async (id: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    await load();
  };

  const reject = async (id: string) => {
    await supabase.from("friendships").update({ status: "rejected" }).eq("id", id);
    await load();
  };

  if (!user) {
    return <div className="max-w-xl mx-auto px-4 py-10 text-sm text-muted-foreground">Faça login para ver seus amigos.</div>;
  }

  const renderPerson = (otherUserId: string) => {
    const p = profiles.get(otherUserId);
    const name = p?.display_name ?? "Arquiteto Mental";
    const initials = initialsFromName(name);

    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-border bg-muted flex items-center justify-center text-sm font-bold text-foreground overflow-hidden">
          {p?.avatar_url ? (
            <img src={p.avatar_url} alt={name ?? "avatar"} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{p?.level ?? ""}</p>
        </div>
      </div>
    );
  };

  const card = "border border-border rounded-xl bg-card p-4";
  const sectionTitle = "text-xs font-semibold tracking-wide text-muted-foreground uppercase";
  const rowClass = "flex items-center justify-between gap-3";
  const btn = "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors";

  return (
    <div className="max-w-xl mx-auto">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-sm font-bold text-foreground">Amigos</h1>
        <p className="text-xs text-muted-foreground">Pedidos e sua lista de amizades</p>
      </div>

      {loading ? (
        <div className="px-4 py-10 text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="px-4 py-5 space-y-5">
          <section className="space-y-2">
            <h2 className={sectionTitle}>Pedidos recebidos</h2>
            <div className={card}>
              {incoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pedido por enquanto.</p>
              ) : (
                <div className="space-y-3">
                  {incoming.map((r) => {
                    const otherId = r.requester_id;
                    return (
                      <div key={r.id} className={rowClass}>
                        {renderPerson(otherId)}
                        <div className="flex items-center gap-2">
                          <button className={btn} onClick={() => accept(r.id)}>
                            <Check className="w-4 h-4" />
                            Aceitar
                          </button>
                          <button className={btn} onClick={() => reject(r.id)}>
                            <X className="w-4 h-4" />
                            Recusar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className={sectionTitle}>Pedidos enviados</h2>
            <div className={card}>
              {outgoing.length === 0 ? (
                <p className="text-sm text-muted-foreground">Você não enviou pedidos ainda.</p>
              ) : (
                <div className="space-y-3">
                  {outgoing.map((r) => {
                    const otherId = r.addressee_id;
                    return (
                      <div key={r.id} className={rowClass}>
                        {renderPerson(otherId)}
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <UserPlus className="w-4 h-4" />
                          Pendente
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className={sectionTitle}>Seus amigos</h2>
            <div className={card}>
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda sem amigos — visite um perfil e toque em “Adicionar como amigo”.</p>
              ) : (
                <div className="space-y-3">
                  {friends.map((r) => {
                    const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
                    return (
                      <div key={r.id} className={rowClass}>
                        {renderPerson(otherId)}
                        <span className="text-xs font-semibold text-foreground">Amigos</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}

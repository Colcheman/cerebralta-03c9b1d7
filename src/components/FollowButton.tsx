import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function FollowButton({
  targetUserId,
  onToggle,
}: {
  targetUserId: string;
  onToggle?: (following: boolean) => void;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.id === targetUserId) return;
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle()
      .then(({ data }) => {
        setFollowing(!!data);
        setLoading(false);
      });
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId) return null;

  const toggle = async () => {
    const next = !following;
    setFollowing(next);
    onToggle?.(next);

    if (next) {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
    } else {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
    }
  };

  const base =
    "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60";

  if (loading) {
    return <button className={`${base} border border-border text-foreground`} disabled>...</button>;
  }

  return following ? (
    <button onClick={toggle} className={`${base} bg-muted text-foreground border border-border hover:border-destructive/50 hover:text-destructive`}>
      <UserCheck className="w-4 h-4" />
      Seguindo
    </button>
  ) : (
    <button onClick={toggle} className={`${base} bg-primary text-primary-foreground hover:opacity-90`}>
      <UserPlus className="w-4 h-4" />
      Seguir
    </button>
  );
}

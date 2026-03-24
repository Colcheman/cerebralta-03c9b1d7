import { useState, useEffect } from "react";
import { X, Flag, User, Calendar, Star, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ContactProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  level: string;
  points: number;
  streak: number;
  created_at: string;
  subscription_tier: string;
}

interface ContactProfileSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onReport: () => void;
}

const ContactProfileSheet = ({ open, onClose, userId, onReport }: ContactProfileSheetProps) => {
  const [profile, setProfile] = useState<ContactProfile | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    supabase
      .from("safe_profiles")
      .select("user_id, display_name, avatar_url, bio, level, points, streak, created_at, subscription_tier")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => { if (data) setProfile(data as ContactProfile); });
  }, [open, userId]);

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Dados do contato</h3>
              <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>

            {profile ? (
              <div className="p-5 space-y-4">
                <div className="flex flex-col items-center gap-3">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {getInitials(profile.display_name)}
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-bold text-foreground">{profile.display_name}</p>
                    <p className="text-xs text-accent">{profile.level}</p>
                    {profile.subscription_tier === "premium" && (
                      <span className="inline-block mt-1 text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">⭐ Premium</span>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-xs text-muted-foreground text-center italic">"{profile.bio}"</p>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <Star className="w-4 h-4 mx-auto text-accent mb-1" />
                    <p className="text-sm font-bold text-foreground">{profile.points}</p>
                    <p className="text-[10px] text-muted-foreground">Pontos</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <Flame className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                    <p className="text-sm font-bold text-foreground">{profile.streak}</p>
                    <p className="text-[10px] text-muted-foreground">Streak</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <Calendar className="w-4 h-4 mx-auto text-primary mb-1" />
                    <p className="text-sm font-bold text-foreground">
                      {new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Membro</p>
                  </div>
                </div>

                <button
                  onClick={onReport}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/5 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Denunciar contato
                </button>
              </div>
            ) : (
              <div className="p-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactProfileSheet;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STREAK_MILESTONES = [7, 30, 100];

export function useStreakCheck(userId: string | undefined, currentStreak: number) {
  const [celebrateStreak, setCelebrateStreak] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    const updateStreak = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_active_date, streak")
        .eq("user_id", userId)
        .single();

      if (!profile) return;

      const today = new Date().toISOString().split("T")[0];
      const lastActive = profile.last_active_date;

      if (lastActive === today) return; // Already checked in today

      let newStreak = profile.streak;

      if (lastActive) {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1; // Reset streak
        }
      } else {
        newStreak = 1; // First login
      }

      await supabase
        .from("profiles")
        .update({ last_active_date: today, streak: newStreak, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      // Check for milestone celebration
      const shownKey = `streak_celebrated_${newStreak}`;
      if (STREAK_MILESTONES.includes(newStreak) && !sessionStorage.getItem(shownKey)) {
        sessionStorage.setItem(shownKey, "true");
        setCelebrateStreak(newStreak);
      }
    };

    updateStreak();
  }, [userId]);

  return { celebrateStreak, dismissCelebration: () => setCelebrateStreak(null) };
}

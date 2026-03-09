import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import StreakCelebration from "./StreakCelebration";
import RecoveryEmailPrompt from "./RecoveryEmailPrompt";
import { useStreakCheck } from "@/hooks/useStreakCheck";
import { Loader2 } from "lucide-react";

const AppLayout = () => {
  const { user, loading, profile } = useAuth();
  const { celebrateStreak, dismissCelebration } = useStreakCheck(user?.id, profile?.streak ?? 0);
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);

  const showRecoveryPrompt = profile && !profile.recovery_email && !recoveryDismissed;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (profile && profile.subscription_tier === "free") {
    return <Navigate to="/assinatura" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="lg:ml-64 pb-20 lg:pb-0">
        <Outlet />
      </main>
      {celebrateStreak && (
        <StreakCelebration streak={celebrateStreak} onDismiss={dismissCelebration} />
      )}
      {showRecoveryPrompt && (
        <RecoveryEmailPrompt userId={user.id} onDismiss={() => setRecoveryDismissed(true)} />
      )}
    </div>
  );
};

export default AppLayout;

import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { Loader2 } from "lucide-react";

const AppLayout = () => {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  // Full paywall: free users go to subscription page
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
    </div>
  );
};

export default AppLayout;

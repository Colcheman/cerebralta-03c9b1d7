import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppLockScreen from "@/components/AppLockScreen";
import Login from "./pages/Login";
import Assinatura from "./pages/Assinatura";
import AppLayout from "./components/AppLayout";
import Feed from "./pages/Feed";
import Aprender from "./pages/Aprender";
import Aprendizado from "./pages/Aprendizado";
import Conquistas from "./pages/Conquistas";
import Grupos from "./pages/Grupos";
import GroupDetail from "./pages/GroupDetail";
import Config from "./pages/Config";
import Sobre from "./pages/Sobre";
import Admin from "./pages/Admin";
import Mensagens from "./pages/Mensagens";
import Amigos from "./pages/Amigos";
import NotFound from "./pages/NotFound";
import Perfil from "./pages/Perfil";

const queryClient = new QueryClient();

const AppLockGuard = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useAuth();
  const [locked, setLocked] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      const hasPin = !!profile?.app_lock_pin;
      setLocked(hasPin);
      setChecked(true);
    }
  }, [loading, profile?.app_lock_pin]);

  const handleUnlock = useCallback(() => setLocked(false), []);

  if (!checked) return null;
  if (locked) return <AppLockScreen onUnlock={handleUnlock} />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <AppLockGuard>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/assinatura" element={<Assinatura />} />
                <Route element={<AppLayout />}>
                <Route path="/feed" element={<Feed />} />
                  <Route path="/perfil/:userId" element={<Perfil />} />
                  <Route path="/aprender" element={<Aprender />} />
                  <Route path="/aprendizado" element={<Aprendizado />} />
                  <Route path="/conquistas" element={<Conquistas />} />
                  <Route path="/grupos" element={<Grupos />} />
                  <Route path="/grupos/:id" element={<GroupDetail />} />
                  <Route path="/config" element={<Config />} />
                  <Route path="/sobre" element={<Sobre />} />
                  <Route path="/mensagens" element={<Mensagens />} />
                  <Route path="/admin" element={<Admin />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppLockGuard>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

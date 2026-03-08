import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/assinatura" element={<Assinatura />} />
              <Route element={<AppLayout />}>
                <Route path="/feed" element={<Feed />} />
                <Route path="/aprender" element={<Aprender />} />
                <Route path="/aprendizado" element={<Aprendizado />} />
                <Route path="/conquistas" element={<Conquistas />} />
                <Route path="/grupos" element={<Grupos />} />
                <Route path="/grupos/:id" element={<GroupDetail />} />
                <Route path="/config" element={<Config />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Feed from "./pages/Feed";
import Aprender from "./pages/Aprender";
import Conquistas from "./pages/Conquistas";
import Grupos from "./pages/Grupos";
import Config from "./pages/Config";
import Sobre from "./pages/Sobre";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/aprender" element={<Aprender />} />
              <Route path="/conquistas" element={<Conquistas />} />
              <Route path="/grupos" element={<Grupos />} />
              <Route path="/config" element={<Config />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

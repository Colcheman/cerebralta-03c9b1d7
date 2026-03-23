import SecurityCenter from "@/components/settings/SecurityCenter";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Seguranca = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button onClick={() => navigate("/config")}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar às Configurações
        </button>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Central de Segurança</h1>
        <p className="text-sm text-muted-foreground mb-6">Controle total da segurança da sua conta</p>
      </motion.div>
      <SecurityCenter />
    </div>
  );
};

export default Seguranca;

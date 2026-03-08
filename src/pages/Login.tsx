import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { formatCPF, validateCPF, validatePassword } from "@/lib/cpf";
import { Eye, EyeOff, Shield, Brain } from "lucide-react";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!validateCPF(cpf)) newErrors.push("CPF inválido");
    if (isRegister) {
      if (!name.trim()) newErrors.push("Nome é obrigatório");
      const pwResult = validatePassword(password);
      if (!pwResult.valid) newErrors.push(...pwResult.errors);
    }
    if (!isRegister && password.length < 1) newErrors.push("Senha é obrigatória");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    if (isRegister) {
      register(cpf, name, password);
    } else {
      login(cpf, password);
    }
    navigate("/feed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-primary mb-6"
          >
            <Brain className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
            Cerebralta
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Desperte. Domine. Evolua.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8">
          <div className="flex gap-2 mb-8">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrors([]); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isRegister
                  ? "bg-primary text-primary-foreground shadow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrors([]); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isRegister
                  ? "bg-primary text-primary-foreground shadow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {isRegister && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Seu nome"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                CPF
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Senha {isRegister && <span className="text-muted-foreground/50">(mín. 12 caracteres)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
              >
                {errors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive">{err}</p>
                ))}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground py-3.5 rounded-lg font-semibold shadow-primary hover:opacity-90 transition-all"
            >
              {isRegister ? "Criar Conta" : "Entrar"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            Seus dados são protegidos com criptografia de ponta a ponta
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

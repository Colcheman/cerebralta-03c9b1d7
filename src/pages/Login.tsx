import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { formatCPF, validateCPF, validatePassword } from "@/lib/cpf";
import { Eye, EyeOff, Shield, Brain, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // CPF lookup state
  const [lookupName, setLookupName] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Redirect if already logged in
  if (user) {
    navigate("/feed", { replace: true });
    return null;
  }

  const handleCpfChange = async (rawValue: string) => {
    const formatted = formatCPF(rawValue);
    setCpf(formatted);

    // Auto-lookup when CPF is complete and in register mode
    const digits = formatted.replace(/\D/g, "");
    if (isRegister && digits.length === 11 && validateCPF(formatted)) {
      setLookupLoading(true);
      setLookupError(null);
      setLookupName(null);
      try {
        const { data, error } = await supabase.functions.invoke("cpf-lookup", {
          body: { cpf: digits },
        });
        if (error) {
          setLookupError("Não foi possível consultar o CPF");
        } else if (data?.found && data?.name) {
          setLookupName(data.name);
          setName(data.name);
        } else {
          setLookupError(data?.error || "CPF não encontrado na base da Receita Federal");
        }
      } catch {
        setLookupError("Erro ao consultar CPF");
      }
      setLookupLoading(false);
    } else {
      setLookupName(null);
      setLookupError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    setIsLoading(true);

    try {
      if (isRegister) {
        const { error } = await register(cpf, name, password);
        if (error) {
          setErrors([error]);
          setIsLoading(false);
          return;
        }
        // Store real_name if found from API
        if (lookupName) {
          // Will be saved after profile is created by trigger
          setTimeout(async () => {
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (newUser) {
              await supabase.from("profiles").update({
                real_name: lookupName,
                name_verified: true,
              } as any).eq("user_id", newUser.id);
            }
          }, 1000);
        }
      } else {
        const { error } = await login(cpf, password);
        if (error) {
          setErrors(["CPF ou senha incorretos"]);
          setIsLoading(false);
          return;
        }
      }
      navigate("/feed"); // AppLayout will redirect to /locale-setup if needed
    } catch {
      setErrors(["Erro inesperado. Tente novamente."]);
    } finally {
      setIsLoading(false);
    }
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
                  onChange={(e) => handleCpfChange(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {lookupLoading ? (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                )}
              </div>
              {isRegister && lookupName && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-xs text-green-500 mt-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Nome encontrado: <span className="font-medium">{lookupName}</span>
                </motion.p>
              )}
              {isRegister && lookupError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {lookupError} — digite o nome manualmente
                </motion.p>
              )}
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
              disabled={isLoading}
              className="w-full bg-gradient-primary text-primary-foreground py-3.5 rounded-lg font-semibold shadow-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRegister ? "Criando conta..." : "Entrando..."}
                </>
              ) : (
                isRegister ? "Criar Conta" : "Entrar"
              )}
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

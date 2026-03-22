import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Upload, Camera, FileCheck, AlertTriangle, Loader2,
  ChevronDown, LogOut, Lock, Eye, EyeOff, CheckCircle2,
  Clock, FileText, UserCheck, ShieldCheck, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_TYPES: Record<string, { label: string; docs: string[] }> = {
  BR: { label: "Brasil", docs: ["RG (Registro Geral)", "CNH (Carteira Nacional de Habilitação)", "Passaporte"] },
  US: { label: "Estados Unidos", docs: ["Driver's License", "Passport", "State ID"] },
  PT: { label: "Portugal", docs: ["Cartão de Cidadão", "Passaporte"] },
  OTHER: { label: "Outro país", docs: ["National ID", "Passport", "Driver's License"] },
};

const steps = [
  { icon: FileText, label: "Enviar documento", desc: "Escolha e envie uma foto do seu documento de identidade." },
  { icon: Eye, label: "Análise pela equipe", desc: "Nossa equipe verifica sua identidade em até 24h úteis." },
  { icon: UserCheck, label: "Conta liberada", desc: "Após aprovação, acesse todos os recursos da plataforma." },
];

const VerificacaoIdentidade = () => {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCountry, setSelectedCountry] = useState(profile?.country || "BR");
  const [selectedDocType, setSelectedDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const countryKey = Object.keys(DOCUMENT_TYPES).includes(selectedCountry) ? selectedCountry : "OTHER";
  const docs = DOCUMENT_TYPES[countryKey].docs;

  const isPending = profile?.verification_status === "pending";
  const isRejected = profile?.verification_status === "rejected";
  const currentStep = isPending ? 1 : 0;

  useEffect(() => {
    if (profile?.verification_status === "approved") {
      navigate("/feed", { replace: true });
    }
  }, [profile?.verification_status, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 10MB."); return; }
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") { toast.error("Formato inválido. Use imagem ou PDF."); return; }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file || !selectedDocType || !user) return;
    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("verification-docs").upload(path, file);
      if (uploadError) throw uploadError;

      const { error: reqError } = await supabase
        .from("verification_requests")
        .insert({ user_id: user.id, status: "pending" } as any);
      if (reqError) throw reqError;

      await supabase.from("profiles").update({ verification_status: "pending" } as any).eq("user_id", user.id);
      await refreshProfile();
      toast.success("Documento enviado! Sua verificação está em análise.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao enviar documento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <Shield className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Verificação de Identidade</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Para garantir um ambiente seguro, precisamos confirmar sua identidade. É rápido e seus dados são protegidos.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between relative">
            {/* Connection lines */}
            <div className="absolute top-5 left-[calc(16.67%+12px)] right-[calc(16.67%+12px)] h-0.5 bg-border" />
            <div
              className="absolute top-5 left-[calc(16.67%+12px)] h-0.5 bg-primary transition-all duration-500"
              style={{ width: currentStep === 0 ? "0%" : currentStep === 1 ? "50%" : "100%" }}
            />

            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center z-10 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  i < currentStep ? "bg-primary text-primary-foreground"
                  : i === currentStep ? "bg-primary/20 text-primary border-2 border-primary"
                  : "bg-muted text-muted-foreground"
                }`}>
                  {i < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <p className={`text-xs font-medium ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isPending ? (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-primary animate-pulse" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Cadastro em análise</h2>
                <p className="text-muted-foreground text-sm">
                  Seu documento foi enviado com sucesso e está sendo analisado pela nossa equipe. Você receberá um <strong className="text-foreground">e-mail</strong> quando sua verificação for concluída.
                </p>
                <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 text-left">
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Seu documento já foi <strong className="text-foreground">apagado dos nossos servidores</strong> após o envio para análise. Nenhum dado sensível é armazenado.
                  </p>
                </div>
                <p className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> Geralmente leva até 24 horas úteis
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    await refreshProfile();
                    toast.info("Status verificado. Aguarde a aprovação.");
                  }}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Verificar status
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/login", { replace: true });
                  }}
                  className="w-full py-2.5 text-muted-foreground rounded-lg font-medium hover:text-foreground transition text-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              </div>
            </motion.div>

          ) : isRejected ? (
            <motion.div
              key="rejected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-card border border-destructive/30 rounded-xl p-6 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Verificação não aprovada</h2>
                <p className="text-muted-foreground text-sm">
                  Infelizmente sua verificação não foi aprovada. Isso pode acontecer se o documento estava ilegível ou não correspondia aos critérios. Você pode enviar novamente.
                </p>
                <button
                  onClick={async () => {
                    await supabase.from("profiles").update({ verification_status: "unverified" } as any).eq("user_id", user?.id);
                    await refreshProfile();
                  }}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  Enviar novo documento
                </button>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login", { replace: true });
                }}
                className="w-full py-2.5 text-muted-foreground rounded-lg font-medium hover:text-foreground transition text-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </motion.div>

          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Security guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: EyeOff, text: "Documento apagado após verificação" },
                  { icon: Lock, text: "Conexão criptografada" },
                  { icon: ShieldCheck, text: "Dados nunca compartilhados" },
                ].map((g, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-border rounded-lg p-3 flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <g.icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">{g.text}</p>
                  </motion.div>
                ))}
              </div>

              {/* Privacy notice */}
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="font-semibold text-destructive text-sm">
                      Seu documento NÃO é armazenado
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Na <strong className="text-foreground">Alluzion Corporate</strong>, acreditamos que se não temos seus dados armazenados, não existe o que vazar. Seu documento é permanentemente apagado após a análise.
                    </p>
                  </div>
                </div>
              </div>

              {/* Country Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
                  País do documento
                </label>
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={(e) => { setSelectedCountry(e.target.value); setSelectedDocType(""); }}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground appearance-none pr-10"
                  >
                    {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
                  Tipo de documento
                </label>
                <div className="grid gap-2">
                  {docs.map((doc) => (
                    <button
                      key={doc}
                      onClick={() => setSelectedDocType(doc)}
                      className={`text-left px-4 py-3 rounded-lg border transition text-sm flex items-center gap-3 ${
                        selectedDocType === doc
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <FileText className={`w-4 h-4 flex-shrink-0 ${selectedDocType === doc ? "text-primary" : ""}`} />
                      {doc}
                      {selectedDocType === doc && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload */}
              {selectedDocType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
                    Foto do documento
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full rounded-lg border border-border max-h-64 object-contain bg-muted"
                      />
                      <button
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1.5 text-foreground hover:bg-background transition"
                      >
                        ✕
                      </button>
                      <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2.5 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Documento selecionado
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5 transition"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="text-sm font-medium">Enviar arquivo</span>
                        <span className="text-xs opacity-70">JPG, PNG ou PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.setAttribute("capture", "environment");
                            fileInputRef.current.click();
                          }
                        }}
                        className="flex-1 flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5 transition"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-sm font-medium">Usar câmera</span>
                        <span className="text-xs opacity-70">Tire uma foto agora</span>
                      </button>
                    </div>
                  )}

                  {file && !file.type.startsWith("image/") && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <p className="text-sm text-foreground truncate">{file.name}</p>
                      <button onClick={() => { setFile(null); setPreview(null); }} className="ml-auto text-muted-foreground hover:text-foreground text-xs">✕</button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!file || !selectedDocType || submitting}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg shadow-primary/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando com segurança...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Enviar para verificação
                  </>
                )}
              </button>

              {/* Logout option */}
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login", { replace: true });
                }}
                className="w-full py-2 text-muted-foreground text-sm hover:text-foreground transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair da conta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VerificacaoIdentidade;

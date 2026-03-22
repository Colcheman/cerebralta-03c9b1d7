import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Upload, Camera, FileCheck, AlertTriangle, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_TYPES: Record<string, { label: string; docs: string[] }> = {
  BR: { label: "Brasil", docs: ["RG (Registro Geral)", "CNH (Carteira Nacional de Habilitação)", "Passaporte"] },
  US: { label: "Estados Unidos", docs: ["Driver's License", "Passport", "State ID"] },
  PT: { label: "Portugal", docs: ["Cartão de Cidadão", "Passaporte"] },
  OTHER: { label: "Outro país", docs: ["National ID", "Passport", "Driver's License"] },
};

const VerificacaoIdentidade = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCountry, setSelectedCountry] = useState(profile?.country || "BR");
  const [selectedDocType, setSelectedDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const countryKey = Object.keys(DOCUMENT_TYPES).includes(selectedCountry) ? selectedCountry : "OTHER";
  const docs = DOCUMENT_TYPES[countryKey].docs;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      toast.error("Formato inválido. Use imagem ou PDF.");
      return;
    }
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
      // Upload to temporary bucket
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-docs")
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Create verification request
      const { error: reqError } = await supabase
        .from("verification_requests" as any)
        .insert({
          user_id: user.id,
          status: "pending",
        } as any);

      if (reqError) throw reqError;

      // Update profile status
      await supabase
        .from("profiles")
        .update({ verification_status: "pending" } as any)
        .eq("user_id", user.id);

      await refreshProfile();
      toast.success("Documento enviado! Sua verificação está em análise.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao enviar documento.");
    } finally {
      setSubmitting(false);
    }
  };

  // If already verified or pending, redirect
  if (profile?.verification_status === "approved") {
    navigate("/feed", { replace: true });
    return null;
  }

  const isPending = profile?.verification_status === "pending";
  const isRejected = profile?.verification_status === "rejected";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Verificação de Identidade</h1>
          <p className="text-muted-foreground text-sm">
            Para a segurança de todos, precisamos verificar sua identidade.
          </p>
        </div>

        {isPending ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
            <FileCheck className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Cadastro em análise</h2>
            <p className="text-muted-foreground text-sm">
              Seu documento foi enviado e está sendo analisado pela nossa equipe. Você receberá um e-mail quando sua verificação for aprovada.
            </p>
            <p className="text-muted-foreground text-xs">
              Esse processo geralmente leva até 24 horas úteis.
            </p>
            <button
              onClick={async () => {
                await refreshProfile();
                if (profile?.verification_status === "approved") {
                  navigate("/feed", { replace: true });
                }
              }}
              className="px-6 py-2 bg-muted text-foreground rounded-lg font-medium hover:opacity-90 transition text-sm"
            >
              Verificar status
            </button>
          </div>
        ) : isRejected ? (
          <div className="bg-card border border-destructive/30 rounded-xl p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Verificação não aprovada</h2>
            <p className="text-muted-foreground text-sm">
              Infelizmente sua verificação não foi aprovada. Você pode enviar um novo documento abaixo.
            </p>
            <button
              onClick={async () => {
                // Reset status to unverified so form shows
                await supabase
                  .from("profiles")
                  .update({ verification_status: "unverified" } as any)
                  .eq("user_id", user?.id);
                await refreshProfile();
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
            >
              Enviar novo documento
            </button>
          </div>
        ) : (
          <>
            {/* Privacy Warning */}
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span className="font-semibold text-destructive text-sm">
                  A imagem do seu documento NÃO é armazenada em nossos servidores e é apagada após a verificação.
                </span>
              </div>
            </div>

            {/* Trust explanation */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-sm text-muted-foreground">
              <p>
                Na <strong className="text-foreground">Alluzion Corporate</strong>, acreditamos que a melhor forma de proteger nossos usuários é não armazenar dados sensíveis desnecessários.
              </p>
              <p>Se não temos seus dados armazenados, não existe risco de vazamento.</p>
              <p>
                Nossa empresa não vende, compartilha ou utiliza dados pessoais para manipulação ou fins comerciais.
              </p>
            </div>

            {/* Country Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">País do documento</label>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedDocType("");
                  }}
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
              <label className="text-sm font-medium text-foreground">Tipo de documento</label>
              <div className="grid gap-2">
                {docs.map((doc) => (
                  <button
                    key={doc}
                    onClick={() => setSelectedDocType(doc)}
                    className={`text-left px-4 py-3 rounded-lg border transition text-sm ${
                      selectedDocType === doc
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {doc}
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
                <label className="text-sm font-medium text-foreground">
                  Foto do documento ({selectedDocType})
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
                      className="absolute top-2 right-2 bg-background/80 rounded-full p-1 text-foreground hover:bg-background"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-foreground transition"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">Enviar arquivo</span>
                    </button>
                    <button
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute("capture", "environment");
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-foreground transition"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-sm">Usar câmera</span>
                    </button>
                  </div>
                )}

                {file && !file.type.startsWith("image/") && (
                  <p className="text-sm text-muted-foreground">📄 {file.name}</p>
                )}
              </motion.div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!file || !selectedDocType || submitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Enviar para verificação
                </>
              )}
            </button>

          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerificacaoIdentidade;

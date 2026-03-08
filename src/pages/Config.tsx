import { motion } from "framer-motion";
import { Shield, Bell, Palette, Lock, Smartphone, Globe } from "lucide-react";

const sections = [
  {
    icon: Shield,
    title: "Segurança",
    items: [
      { label: "Autenticação 2FA", desc: "Proteja sua conta com verificação dupla", toggle: true },
      { label: "Senha do Aplicativo", desc: "Senha extra para abrir o app no dispositivo", toggle: true },
    ],
  },
  {
    icon: Bell,
    title: "Notificações",
    items: [
      { label: "Lembretes diários", desc: "Receba lembretes de missões", toggle: true },
      { label: "WhatsApp", desc: "Notificações via WhatsApp", toggle: false },
      { label: "Email", desc: "Resumo semanal por email", toggle: true },
    ],
  },
  {
    icon: Palette,
    title: "Personalização",
    items: [
      { label: "Cores do tema", desc: "Personalize as cores da interface" },
    ],
  },
  {
    icon: Lock,
    title: "Privacidade",
    items: [
      { label: "Perfil privado", desc: "Oculte seu progresso de outros usuários", toggle: false },
      { label: "Dados criptografados", desc: "Seus dados são protegidos com criptografia" },
    ],
  },
];

const Config = () => (
  <div className="max-w-2xl mx-auto px-4 py-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="font-display text-2xl font-bold text-foreground mb-1">Configurações</h1>
      <p className="text-sm text-muted-foreground mb-6">Ajuste sua experiência Cerebralta</p>
    </motion.div>

    <div className="space-y-4">
      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <section.icon className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
          </div>
          <div className="space-y-3">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {item.toggle !== undefined && (
                  <button
                    className={`w-11 h-6 rounded-full transition-all ${
                      item.toggle ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                        item.toggle ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Config;

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, ExternalLink, Globe, BookMarked, Mail, Phone, MessageCircle, Send, Building2, Shield, Server, Headphones, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Sobre = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);

    // Open WhatsApp with the message
    const text = `*Contato via Cerebralta*\n\n*Nome:* ${form.name}\n*E-mail:* ${form.email}\n*Assunto:* ${form.subject || "Geral"}\n\n${form.message}`;
    window.open(`https://api.whatsapp.com/send?phone=5543988420455&text=${encodeURIComponent(text)}`, "_blank");

    toast({ title: "Redirecionando para o WhatsApp", description: "Envie a mensagem pelo WhatsApp para finalizar." });
    setForm({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-primary mb-4">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Cerebralta</h1>
          <p className="text-sm text-muted-foreground mt-1">Rede Social & Plataforma Educativa</p>
        </div>

        {/* About */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Sobre a Plataforma</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cerebralta é uma rede social e plataforma educativa de alto desempenho, projetada para
            <strong className="text-foreground"> Arquitetos Mentais</strong> — indivíduos comprometidos com evolução constante,
            domínio estratégico e crescimento pessoal. Aqui, cada interação é curada para desenvolvimento real.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Combinamos ciência comportamental, gamificação inteligente e uma comunidade de elite para transformar
            o aprendizado em um processo viciante — sem as distrações das redes tradicionais.
          </p>
        </div>

        {/* Founder */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Fundador</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cerebralta foi fundada por <strong className="text-foreground">Alexandre Boos</strong>, como parte do
            ecossistema <strong className="text-foreground">Alluzion Corporate</strong> — conglomerado de tecnologia e
            inovação focado em soluções que transformam performance humana.
          </p>
        </div>

        {/* Alluzion Corporate Section */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Alluzion Corporate</h2>
              <p className="text-xs text-muted-foreground">Responsável pelo suporte e infraestrutura</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            A <strong className="text-foreground">Alluzion Corporate</strong> é a empresa responsável pelo desenvolvimento, 
            infraestrutura e suporte técnico da plataforma Cerebralta. Com sede em Londrina-PR, a Alluzion atua com 
            soluções de tecnologia de ponta, garantindo segurança, estabilidade e evolução contínua.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Server className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Desenvolvimento</p>
                <p className="text-[11px] text-muted-foreground">Engenharia de software</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Infraestrutura</p>
                <p className="text-[11px] text-muted-foreground">Segurança e servidores</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Headphones className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Suporte</p>
                <p className="text-[11px] text-muted-foreground">Atendimento técnico</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Fale Conosco</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Entre em contato com a equipe da Alluzion Corporate para suporte, dúvidas ou sugestões.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://api.whatsapp.com/send?phone=5543988420455"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-[hsl(142,70%,45%)]/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-[hsl(142,70%,45%)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">WhatsApp</p>
                <p className="text-xs text-muted-foreground">(43) 98842-0455</p>
              </div>
            </a>

            <a
              href="tel:+5543988420455"
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Telefone</p>
                <p className="text-xs text-muted-foreground">(43) 98842-0455</p>
              </div>
            </a>

            <a
              href="mailto:contato@alluzioncorporate.com"
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">E-mail</p>
                <p className="text-xs text-muted-foreground">contato@alluzioncorporate.com</p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/alluzion_corporate"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-[hsl(330,80%,55%)]/10 flex items-center justify-center shrink-0">
                <Instagram className="w-5 h-5 text-[hsl(330,80%,55%)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Instagram</p>
                <p className="text-xs text-muted-foreground">@alluzion_corporate</p>
              </div>
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Envie uma Mensagem</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Preencha o formulário abaixo e sua mensagem será enviada diretamente para a equipe de suporte via WhatsApp.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Seu Nome *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Alexandre Boos"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Seu E-mail *</label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="voce@email.com"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assunto</label>
              <input
                type="text"
                maxLength={200}
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Suporte, Dúvida, Sugestão..."
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sua Mensagem *</label>
              <textarea
                required
                maxLength={1000}
                rows={4}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Escreva sua mensagem aqui..."
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !form.name.trim() || !form.email.trim() || !form.message.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Enviar via WhatsApp
            </button>
          </form>
        </div>

        {/* Links */}
        <Link
          to="/manual"
          className="glass rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Manual do Arquiteto Mental
            </p>
            <p className="text-xs text-muted-foreground">Como usar a plataforma, regras e descontos</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <a
          href="https://www.alluzioncorporate.com"
          target="_blank"
          rel="noopener noreferrer"
          className="glass rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Alluzion Corporate
            </p>
            <p className="text-xs text-muted-foreground">www.alluzioncorporate.com</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>

        <p className="text-center text-xs text-muted-foreground pb-4">
          © {new Date().getFullYear()} Alluzion Corporate. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default Sobre;

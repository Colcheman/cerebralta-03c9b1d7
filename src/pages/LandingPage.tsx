import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Brain, Flame, Target, Users, Trophy, BookOpen, Shield, Zap,
  ArrowRight, MessageCircle, Mail, Phone, Instagram, Building2,
  ChevronRight, Star, Sparkles, Lock, EyeOff, ShieldCheck, ServerOff,
} from "lucide-react";

const features = [
  { icon: Flame, title: "Missões Diárias", desc: "Desafios estratégicos que treinam disciplina, foco e pensamento crítico." },
  { icon: Target, title: "Metas Pessoais", desc: "Defina objetivos e acompanhe seu progresso rumo à evolução contínua." },
  { icon: Users, title: "Rede Social de Elite", desc: "Conecte-se com Arquitetos Mentais comprometidos com crescimento real." },
  { icon: Trophy, title: "Conquistas & Ranking", desc: "Desbloqueie conquistas e suba de nível conforme evolui na plataforma." },
  { icon: BookOpen, title: "Aprendizado Curado", desc: "Conteúdo exclusivo sobre estratégia, estoicismo e desenvolvimento pessoal." },
  { icon: Shield, title: "Privacidade Total", desc: "Seus dados protegidos com criptografia. Login via CPF, sem e-mail exposto." },
];

const levels = [
  { name: "Iniciante", pts: "0", color: "text-muted-foreground" },
  { name: "Aprendiz", pts: "100", color: "text-primary" },
  { name: "Estrategista", pts: "500", color: "text-primary" },
  { name: "Mestre", pts: "1.500", color: "text-accent" },
  { name: "Visionário", pts: "3.000", color: "text-accent" },
  { name: "Arquiteto-Chefe", pts: "5.000+", color: "text-accent" },
];

const stats = [
  { value: "6", label: "Níveis de Evolução" },
  { value: "∞", label: "Missões Disponíveis" },
  { value: "75%", label: "Desconto Máximo" },
  { value: "24/7", label: "Acesso Completo" },
];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Cerebralta</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#niveis" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Níveis</a>
            <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contato</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/feed" className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                Ir ao Feed
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Entrar
                </Link>
                <Link to="/login" className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-1.5">
                  Criar Conta <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-8">
              <Sparkles className="w-3.5 h-3.5" /> Plataforma de Elite para Arquitetos Mentais
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6">
              Desperte.{" "}
              <span className="bg-gradient-to-r from-primary to-[hsl(var(--accent))] bg-clip-text text-transparent">
                Domine.
              </span>{" "}
              Evolua.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Cerebralta é a rede social e plataforma educativa para quem busca evolução real. 
              Missões diárias, metas pessoais e uma comunidade de alto desempenho.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="bg-gradient-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-bold shadow-primary hover:opacity-90 transition-all flex items-center gap-2"
              >
                Começar Agora <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#funcionalidades"
                className="border border-border text-foreground px-8 py-4 rounded-xl text-base font-medium hover:bg-muted transition-all"
              >
                Saiba Mais
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-border bg-card/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-3xl font-bold text-accent">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Tudo que um <span className="text-primary">Arquiteto Mental</span> precisa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas estratégicas projetadas para transformar seu crescimento pessoal em resultados mensuráveis.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-6 hover:border-primary/30 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section id="niveis" className="py-20 px-6 bg-card/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Sistema de <span className="text-accent">Evolução</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Suba de nível conforme completa missões e participa da comunidade. Quanto maior seu nível, maior o desconto na assinatura.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {levels.map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-4 text-center hover:border-accent/30 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Star className={`w-5 h-5 ${l.color}`} />
                </div>
                <p className="text-sm font-semibold text-foreground">{l.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{l.pts} pts</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Como <span className="text-primary">funciona</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Cadastre-se", desc: "Crie sua conta usando apenas seu CPF. Seguro e sem e-mail exposto.", icon: Shield },
              { step: "02", title: "Complete Missões", desc: "Receba missões diárias que desenvolvem foco, disciplina e pensamento estratégico.", icon: Zap },
              { step: "03", title: "Evolua", desc: "Suba de nível, desbloqueie conquistas e conecte-se com Arquitetos Mentais.", icon: Trophy },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-bold text-accent mb-2">PASSO {s.step}</p>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Block */}
      <section className="py-24 px-6 bg-card/30 border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Lock className="w-3.5 h-3.5" />
              Anti Big-Tech
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-5">
              Se não temos seus dados,<br />
              <span className="text-primary">não existe o que vazar.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Inacreditavelmente simples. Extremamente seguro. Diferente de tudo que você já viu.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              {
                icon: ServerOff,
                title: "Documentos apagados",
                desc: "Após a verificação de identidade, seu documento é permanentemente deletado dos nossos servidores. Não armazenamos o que não precisamos.",
              },
              {
                icon: EyeOff,
                title: "Dados não vendidos",
                desc: "Não vendemos, compartilhamos ou utilizamos seus dados pessoais para publicidade, manipulação ou qualquer fim comercial. Ponto final.",
              },
              {
                icon: ShieldCheck,
                title: "Sem manipulação",
                desc: "Sem algoritmos viciantes. Sem notificações manipulativas. O Cerebralta foi construído para te desenvolver, não para te prender.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="glass rounded-2xl p-6 border-destructive/10 hover:border-destructive/30 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 text-center border-primary/20"
          >
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              A <strong className="text-foreground">Alluzion Corporate</strong> acredita que privacidade não é um recurso premium — 
              é um direito fundamental. Por isso, construímos o Cerebralta com a filosofia de <strong className="text-foreground">dados mínimos</strong>: 
              coletamos apenas o essencial e descartamos o que não precisamos mais.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contato" className="py-20 px-6 bg-card/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Fale <span className="text-primary">Conosco</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              O suporte é feito pela <strong className="text-foreground">Alluzion Corporate</strong>, responsável pelo 
              desenvolvimento, infraestrutura e suporte da plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="https://api.whatsapp.com/send?phone=5543988420455" target="_blank" rel="noopener noreferrer"
              className="glass rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 rounded-full bg-[hsl(142,70%,45%)]/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[hsl(142,70%,45%)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">WhatsApp</p>
                <p className="text-xs text-muted-foreground">(43) 98842-0455</p>
              </div>
            </a>
            <a href="tel:+5543988420455"
              className="glass rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Telefone</p>
                <p className="text-xs text-muted-foreground">(43) 98842-0455</p>
              </div>
            </a>
            <a href="mailto:contato@alluzioncorporate.com"
              className="glass rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">E-mail</p>
                <p className="text-xs text-muted-foreground text-[11px]">contato@alluzioncorporate.com</p>
              </div>
            </a>
            <a href="https://www.instagram.com/alluzion_corporate" target="_blank" rel="noopener noreferrer"
              className="glass rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 rounded-full bg-[hsl(330,80%,55%)]/10 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-[hsl(330,80%,55%)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Instagram</p>
                <p className="text-xs text-muted-foreground">@alluzion_corporate</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Pronto para se tornar um <span className="text-accent">Arquiteto Mental</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Junte-se à plataforma que está transformando o desenvolvimento pessoal no Brasil.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-10 py-4 rounded-xl text-base font-bold shadow-primary hover:opacity-90 transition-all"
            >
              Criar Minha Conta <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">Cerebralta</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
            <a href="https://www.alluzioncorporate.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Alluzion Corporate
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Alluzion Corporate
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

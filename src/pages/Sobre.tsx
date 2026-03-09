import { motion } from "framer-motion";
import { Brain, ExternalLink, Globe, BookMarked } from "lucide-react";
import { Link } from "react-router-dom";

const Sobre = () => (
  <div className="max-w-2xl mx-auto px-4 py-6">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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

      {/* Link */}
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

      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Alluzion Corporate. Todos os direitos reservados.
      </p>
    </motion.div>
  </div>
);

export default Sobre;

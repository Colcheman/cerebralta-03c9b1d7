import { motion } from "framer-motion";
import {
  BookOpen, Zap, Trophy, Users, MessageCircle, Target, Brain,
  Flame, Percent, Star, Shield, AlertTriangle, CheckCircle2,
  Lock, Heart, ChevronRight, Sparkles
} from "lucide-react";

interface Section {
  icon: React.ElementType;
  title: string;
  color: string;
  items: string[];
}

const sections: Section[] = [
  {
    icon: Flame,
    title: "Feed — O Coração da Plataforma",
    color: "text-streak",
    items: [
      "O Feed é onde a comunidade se conecta. Veja posts de outros Arquitetos Mentais, interaja, comente e compartilhe reflexões.",
      "Publique seus pensamentos, aprendizados, estratégias e conquistas. Use as categorias: Reflexão, Estratégia, Estoicismo ou Prática.",
      "Curta e comente posts de outros membros — interações constroem reputação e fortalecem a comunidade.",
      "Evite posts superficiais. A comunidade valoriza profundidade e conteúdo que agrega.",
    ],
  },
  {
    icon: Target,
    title: "Missões — Evolução Diária",
    color: "text-primary",
    items: [
      "Ao entrar pela primeira vez, você conversa com o Mentor IA que entende o que você quer melhorar na vida.",
      "Com base na conversa, a IA cria missões personalizadas e exclusivas para a sua situação.",
      "Cada missão exige que você escreva como a cumpriu e o que aprendeu — reflexão honesta é obrigatória.",
      "Ao completar todas as missões, a IA gera um novo conjunto baseado no seu progresso atual.",
      "Missões rendem pontos que sobem seu nível e geram descontos na assinatura.",
    ],
  },
  {
    icon: BookOpen,
    title: "Aprendizado — Conteúdo de Elite",
    color: "text-accent",
    items: [
      "Acesse artigos e módulos educativos sobre estoicismo, psicologia, liderança e estratégia.",
      "Peça uma Dica Personalizada e a IA gera um conselho exclusivo baseado no seu nível e progresso.",
      "Solicite um novo artigo e a IA cria conteúdo aprofundado sobre o tema que você precisa.",
      "Membros premium têm acesso a todo o conteúdo avançado da plataforma.",
    ],
  },
  {
    icon: Trophy,
    title: "Conquistas — Marcos da Jornada",
    color: "text-accent",
    items: [
      "Conquistas são desbloqueadas automaticamente ao atingir marcos de pontos, streak, missões e posts.",
      "Marcos especiais de streak: 7 dias, 30 dias e 100 dias consecutivos geram celebrações na plataforma.",
      "Cada conquista é uma prova do seu comprometimento real com a evolução.",
      "Veja o progresso de cada conquista e saiba exatamente o que falta para desbloqueá-la.",
    ],
  },
  {
    icon: Users,
    title: "Grupos — Tribu de Alta Performance",
    color: "text-primary",
    items: [
      "Crie ou entre em grupos temáticos para conectar-se com membros com os mesmos objetivos.",
      "Grupos têm chat interno exclusivo para os membros.",
      "Use grupos para accountability: comprometa-se publicamente com seus objetivos.",
      "Grupos podem ser usados para desafios coletivos, mastermind e troca de estratégias.",
    ],
  },
  {
    icon: MessageCircle,
    title: "Mensagens — Conexões Diretas",
    color: "text-primary",
    items: [
      "Envie mensagens diretas para outros membros da comunidade.",
      "Configure sua privacidade em Configurações: receba mensagens de todos ou apenas de amigos.",
      "Use o chat direto para networking, mentoria e troca de experiências reais.",
    ],
  },
];

const discountRules = [
  { pct: "75%", label: "Comentar seu progresso todos os dias do mês (30/31 dias)" },
  { pct: "45%", label: "Comentar seu progresso em pelo menos 20 dias no mês" },
  { pct: "25%", label: "Comentar seu progresso em pelo menos 10 dias no mês" },
  { pct: "0%", label: "Menos de 10 dias de participação — mensalidade cheia de R$ 52,90" },
];

const conduct = [
  { ok: true, text: "Compartilhar aprendizados, reflexões e estratégias genuínas" },
  { ok: true, text: "Oferecer críticas construtivas com respeito e intenção de ajudar" },
  { ok: true, text: "Celebrar conquistas alheias sem inveja — vitória de um é inspiração para todos" },
  { ok: true, text: "Manter linguagem direta, honesta e madura" },
  { ok: false, text: "Conteúdo sexual, pornográfico ou sugestivo de qualquer natureza" },
  { ok: false, text: "Bullying, humilhação, ataques pessoais ou discurso de ódio" },
  { ok: false, text: "Spam, autopromoção excessiva ou links irrelevantes" },
  { ok: false, text: "Fingir progresso ou reflexões falsas para acumular pontos — engana só a si mesmo" },
  { ok: false, text: "Política, religião ou qualquer debate que gere divisão sem valor prático" },
  { ok: false, text: "Compartilhar informações pessoais de outros membros sem consentimento" },
];

const CardSection = ({ icon: Icon, title, color, items, i }: Section & { i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.07 }}
    className="glass rounded-2xl p-5"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
    </div>
    <ul className="space-y-2.5">
      {items.map((item, j) => (
        <li key={j} className="flex items-start gap-2.5">
          <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
        </li>
      ))}
    </ul>
  </motion.div>
);

const Manual = () => (
  <div className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">
    {/* Header */}
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-primary mb-4">
        <Brain className="w-8 h-8 text-primary-foreground" />
      </div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-1">Manual do Arquiteto Mental</h1>
      <p className="text-sm text-muted-foreground">Tudo o que você precisa saber para evoluir de verdade no Cerebralta</p>
    </motion.div>

    {/* What is */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="text-sm font-bold text-foreground">O que é o Cerebralta?</h2>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        O Cerebralta é uma rede social de desenvolvimento mental masculino. Não é um aplicativo de motivação superficial 
        — é uma plataforma projetada para homens que querem evoluir de verdade: disciplina, mindset, saúde, estratégia e liderança.
        Cada recurso da plataforma existe com um propósito: fazer você agir, refletir e crescer todos os dias.
      </p>
    </motion.div>

    {/* Feature Sections */}
    {sections.map((s, i) => (
      <CardSection key={s.title} {...s} i={i + 1} />
    ))}

    {/* Discount System */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="glass rounded-2xl p-5 border border-accent/20"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <Percent className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Sistema de Desconto — R$ 52,90/mês</h2>
          <p className="text-xs text-muted-foreground">Você já começa com 75% de desconto!</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        No Cerebralta, quanto mais você pratica, menos você paga. Os descontos são calculados sobre a assinatura do 
        mês seguinte com base na sua consistência no mês atual.
      </p>

      <div className="space-y-3">
        {discountRules.map(({ pct, label }) => (
          <div key={pct} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
            <span className="text-accent font-bold text-sm shrink-0 w-10 text-right">{pct}</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-accent/5 border border-accent/10">
        <p className="text-xs text-accent font-semibold mb-1">💡 Desconto máximo: 75%</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Para garantir os 75%, entre na plataforma todos os dias e registre seu progresso real comentando 
          seus aprendizados, missões e reflexões. Consistência é a chave.
        </p>
      </div>
    </motion.div>

    {/* Points & Levels */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <Star className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-sm font-bold text-foreground">Pontos e Níveis</h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          ["0 pts", "Iniciante"],
          ["100 pts", "Aprendiz"],
          ["500 pts", "Praticante"],
          ["1.500 pts", "Estrategista"],
          ["3.000 pts", "Mestre"],
          ["5.000 pts", "Arquiteto"],
          ["10.000 pts", "Lendário"],
        ].map(([pts, level]) => (
          <div key={level} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
            <span className="text-xs text-muted-foreground">{pts}</span>
            <span className="text-xs font-semibold text-foreground">{level}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Pontos são ganhos completando missões com reflexão honesta. Seu nível aparece no seu perfil e nos rankings da comunidade.
      </p>
    </motion.div>

    {/* Conduct */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Código de Conduta</h2>
          <p className="text-xs text-muted-foreground">Regras básicas para manter a comunidade de elite</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {conduct.map(({ ok, text }, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${ok ? "bg-success/5" : "bg-destructive/5"}`}>
            {ok
              ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            }
            <p className="text-xs leading-relaxed" style={{ color: ok ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
              {ok ? "✅ " : "🚫 "}{text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Violações são moderadas </strong>
          e podem resultar em aviso, suspensão temporária ou banimento permanente da plataforma, dependendo da gravidade.
          A comunidade é construída por todos — respeite-a.
        </p>
      </div>
    </motion.div>

    {/* Privacy */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-sm font-bold text-foreground">Privacidade e Segurança</h2>
      </div>
      <ul className="space-y-2">
        {[
          "Seu CPF é usado apenas para autenticação segura — nunca é exibido publicamente.",
          "Configure um e-mail de recuperação nas Configurações para não perder acesso à sua conta.",
          "Ative o PIN de bloqueio do app para proteção adicional em Configurações.",
          "Controle quem pode te enviar mensagens: todos ou apenas seus amigos.",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
          </li>
        ))}
      </ul>
    </motion.div>

    {/* Final */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.75 }}
      className="glass rounded-2xl p-5 border border-primary/20 text-center"
    >
      <Heart className="w-6 h-6 text-primary mx-auto mb-3" />
      <p className="text-sm font-semibold text-foreground mb-1">Bem-vindo à sua evolução</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        O Cerebralta foi construído por e para homens que levam o crescimento a sério.
        Cada dia que você aparece, reflete e age — você se torna uma versão melhor.
        <strong className="text-foreground"> A consistência é o único segredo.</strong>
      </p>
    </motion.div>
  </div>
);

export default Manual;

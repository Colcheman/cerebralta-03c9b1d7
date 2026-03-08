export interface Post {
  id: string;
  author: string;
  avatar: string;
  level: string;
  content: string;
  category: 'reflexão' | 'estratégia' | 'exercício' | 'filosofia';
  likes: number;
  comments: number;
  timestamp: string;
  liked?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  completed: boolean;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

export const LEVELS = [
  { name: "Iniciante", minPoints: 0, color: "muted" },
  { name: "Consciente", minPoints: 100, color: "primary" },
  { name: "Disciplinado", minPoints: 500, color: "primary" },
  { name: "Estrategista", minPoints: 1500, color: "accent" },
  { name: "Dominante", minPoints: 3000, color: "accent" },
  { name: "Cerebralta", minPoints: 5000, color: "gold" },
] as const;

export const mockPosts: Post[] = [
  {
    id: "1",
    author: "Marcus Vieira",
    avatar: "MV",
    level: "Estrategista",
    content: "\"O impedimento à ação avança a ação. O que está no caminho, torna-se o caminho.\" — Marco Aurélio. Hoje apliquei isso ao enfrentar um problema no trabalho que estava evitando há semanas.",
    category: "reflexão",
    likes: 24,
    comments: 8,
    timestamp: "2h atrás",
  },
  {
    id: "2",
    author: "Ana Stoica",
    avatar: "AS",
    level: "Disciplinado",
    content: "Missão de journaling completada por 30 dias consecutivos. A clareza mental que isso trouxe é indescritível. Para quem está começando: 10 minutos por dia bastam.",
    category: "exercício",
    likes: 45,
    comments: 12,
    timestamp: "4h atrás",
  },
  {
    id: "3",
    author: "Pedro Estrategista",
    avatar: "PE",
    level: "Dominante",
    content: "Maquiavel nos ensina que a fortuna é como um rio: quando tranquilo, todos aproveitam; quando furioso, destrói tudo. A chave é construir diques antes da tempestade. Planejamento estratégico é tudo.",
    category: "estratégia",
    likes: 33,
    comments: 5,
    timestamp: "6h atrás",
  },
  {
    id: "4",
    author: "Lucia Seneca",
    avatar: "LS",
    level: "Consciente",
    content: "\"Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.\" — Sêneca. Comecei minha prática de exposição ao frio hoje. 2 minutos de ducha gelada.",
    category: "filosofia",
    likes: 18,
    comments: 3,
    timestamp: "8h atrás",
  },
];

export const mockMissions: Mission[] = [
  { id: "m1", title: "Journaling Matinal", description: "Escreva 3 páginas de fluxo de consciência ao acordar", category: "Reflexão", points: 15, completed: false, icon: "📝" },
  { id: "m2", title: "Leitura Estoica", description: "Leia 1 capítulo de Meditações de Marco Aurélio", category: "Estoicismo", points: 20, completed: false, icon: "📖" },
  { id: "m3", title: "Exposição ao Frio", description: "2 minutos de ducha gelada (método Wim Hof)", category: "Disciplina", points: 25, completed: true, icon: "🧊" },
  { id: "m4", title: "Meditação", description: "15 minutos de meditação focada na respiração", category: "Mindfulness", points: 20, completed: false, icon: "🧘" },
  { id: "m5", title: "Análise Estratégica", description: "Identifique um problema e crie 3 soluções possíveis", category: "Estratégia", points: 30, completed: false, icon: "♟️" },
];

export const mockAchievements: Achievement[] = [
  { id: "a1", title: "Primeiro Passo", description: "Complete sua primeira missão", icon: "🏅", unlocked: true, date: "01/03/2026" },
  { id: "a2", title: "Streak de 7 Dias", description: "Complete missões por 7 dias consecutivos", icon: "🔥", unlocked: true, date: "08/03/2026" },
  { id: "a3", title: "Filósofo", description: "Leia 10 textos de estoicismo", icon: "📚", unlocked: false },
  { id: "a4", title: "Guerreiro do Frio", description: "Complete 30 sessões de exposição ao frio", icon: "❄️", unlocked: false },
  { id: "a5", title: "Mente Estratégica", description: "Complete 20 missões de estratégia", icon: "🎯", unlocked: false },
  { id: "a6", title: "Cerebralta Supremo", description: "Alcance o nível máximo", icon: "👑", unlocked: false },
];

export const mockUser = {
  name: "Guerreiro Estoico",
  level: "Disciplinado",
  points: 680,
  nextLevel: 1500,
  streak: 12,
  missionsCompleted: 47,
  totalMissions: 120,
};

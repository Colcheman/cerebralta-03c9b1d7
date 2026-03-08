import { motion } from "framer-motion";
import { Users, Plus, MessageCircle } from "lucide-react";

const mockGroups = [
  { id: "1", name: "Estoicos Matinais", members: 24, desc: "Journaling e reflexão antes das 7h", active: true },
  { id: "2", name: "Guerreiros do Frio", members: 12, desc: "Prática diária de Wim Hof", active: true },
  { id: "3", name: "Dupla Accountability", members: 2, desc: "Parceria de crescimento com @MarcusV", active: false },
  { id: "4", name: "Estrategistas", members: 18, desc: "Análise e debate de estratégias de vida", active: true },
];

const Grupos = () => (
  <div className="max-w-2xl mx-auto px-4 py-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Grupos</h1>
          <p className="text-sm text-muted-foreground">Comunidades de prática</p>
        </div>
        <button className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:opacity-90 transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </motion.div>

    <div className="space-y-3">
      {mockGroups.map((group, i) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass rounded-xl p-5 hover:border-primary/20 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{group.desc}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">{group.members} membros</span>
                  {group.active && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Ativo
                    </span>
                  )}
                </div>
              </div>
            </div>
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Grupos;

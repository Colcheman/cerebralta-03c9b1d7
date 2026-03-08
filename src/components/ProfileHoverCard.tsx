import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Award, Flame } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  name: string;
  level: string;
  avatar: string;
}

const ELEVATED_LEVELS = ["Estrategista", "Mestre", "Visionário", "Arquiteto-Chefe"];

const ProfileHoverCard = ({ children, name, level, avatar }: Props) => {
  const isElevated = ELEVATED_LEVELS.includes(level);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="glass w-64 p-4" side="top" sideOffset={8}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
            isElevated ? "bg-gradient-gold text-accent-foreground" : "bg-gradient-primary text-primary-foreground"
          }`}>
            {avatar}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-foreground">{name}</p>
              {isElevated && <Award className="w-3.5 h-3.5 text-accent" />}
            </div>
            <p className="text-xs text-accent">{level}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Arquiteto Mental na plataforma Cerebralta</p>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileHoverCard;

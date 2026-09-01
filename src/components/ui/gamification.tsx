import { motion } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  Target, 
  Star, 
  Zap, 
  Medal,
  Crown,
  Rocket,
  Award
} from "lucide-react";
import { Badge } from "./badge";
import { matchFirst } from "@/lib/variant";

// Streak indicator
interface StreakProps {
  count: number;
  label?: string;
}

export const StreakIndicator = ({ count, label = "dias seguidos" }: StreakProps) => {
  const isActive = count > 0;
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        isActive 
          ? "bg-orange-500/10 border border-orange-500/20" 
          : "bg-muted border border-border"
      }`}
    >
      <motion.div
        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <Flame className={`h-4 w-4 ${isActive ? "text-orange-500" : "text-muted-foreground"}`} />
      </motion.div>
      <span className={`text-sm font-medium ${isActive ? "text-orange-600" : "text-muted-foreground"}`}>
        {count} {label}
      </span>
    </motion.div>
  );
};

// Achievement badge
interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: "trophy" | "star" | "target" | "zap" | "medal" | "crown" | "rocket" | "award";
  unlocked: boolean;
  progress?: number; // 0-100
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  zap: Zap,
  medal: Medal,
  crown: Crown,
  rocket: Rocket,
  award: Award,
};

export const AchievementBadge = ({ 
  title, 
  description, 
  icon, 
  unlocked,
  progress = 0 
}: AchievementBadgeProps) => {
  const Icon = iconMap[icon];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
        unlocked 
          ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30" 
          : "bg-muted/50 border-border grayscale"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          unlocked 
            ? "bg-gradient-to-br from-yellow-500 to-orange-500" 
            : "bg-muted"
        }`}>
          <Icon className={`h-5 w-5 ${unlocked ? "text-white" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${!unlocked && "text-muted-foreground"}`}>
            {title}
          </h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {unlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Badge className="bg-yellow-500 text-white border-0">
              ✓
            </Badge>
          </motion.div>
        )}
      </div>
      
      {!unlocked && progress > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}% completo</p>
        </div>
      )}
    </motion.div>
  );
};

// Progress level indicator
interface LevelProgressProps {
  level: number;
  currentXP: number;
  requiredXP: number;
  title?: string;
}

export const LevelProgress = ({ level, currentXP, requiredXP, title = "Nível" }: LevelProgressProps) => {
  const progress = (currentXP / requiredXP) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold">{level}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="font-semibold">Explorador</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Próximo nível</p>
          <p className="font-mono text-sm">{currentXP}/{requiredXP} XP</p>
        </div>
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full gradient-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};

// Quick stats with animation
interface QuickStatProps {
  value: number;
  label: string;
  icon: "trophy" | "star" | "target" | "zap" | "medal";
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export const QuickStat = ({ value, label, icon, trend, trendValue }: QuickStatProps) => {
  const Icon = iconMap[icon];
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-4 rounded-xl bg-card border border-border"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-primary" />
        {trend && trendValue && (
          <span className={`text-xs font-medium ${
            matchFirst([
  [trend === "up", () => ("text-green-500")],
  [trend === "down", () => ("text-red-500")],
], () => ("text-muted-foreground"))
          }`}>
            {matchFirst([
  [trend === "up", () => ("↑")],
  [trend === "down", () => ("↓")],
], () => ("→"))} {trendValue}
          </span>
        )}
      </div>
      <motion.p
        className="text-2xl font-bold font-display"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {value.toLocaleString()}
      </motion.p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
};

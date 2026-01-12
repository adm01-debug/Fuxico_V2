import { motion } from "framer-motion";
import { Loader2, Mail, FileText, BarChart3, Search } from "lucide-react";

type LoadingType = "default" | "emails" | "documents" | "analytics" | "search";

interface LoadingStateProps {
  type?: LoadingType;
  message?: string;
  submessage?: string;
  className?: string;
}

const loadingConfigs: Record<LoadingType, {
  icon: typeof Loader2;
  messages: string[];
  submessage: string;
  gradient: string;
}> = {
  default: {
    icon: Loader2,
    messages: ["Carregando...", "Quase lá...", "Aguarde um momento..."],
    submessage: "Preparando seus dados",
    gradient: "from-primary to-accent",
  },
  emails: {
    icon: Mail,
    messages: [
      "Buscando seus emails...",
      "Analisando aberturas...",
      "Calculando métricas...",
    ],
    submessage: "Organizando seus rastreamentos",
    gradient: "from-blue-500 to-cyan-400",
  },
  documents: {
    icon: FileText,
    messages: [
      "Carregando documentos...",
      "Processando visualizações...",
      "Organizando arquivos...",
    ],
    submessage: "Preparando seus documentos rastreados",
    gradient: "from-purple-500 to-violet-400",
  },
  analytics: {
    icon: BarChart3,
    messages: [
      "Calculando métricas...",
      "Gerando gráficos...",
      "Analisando tendências...",
    ],
    submessage: "Processando suas análises",
    gradient: "from-orange-500 to-amber-400",
  },
  search: {
    icon: Search,
    messages: [
      "Pesquisando...",
      "Analisando resultados...",
      "Filtrando dados...",
    ],
    submessage: "Buscando correspondências",
    gradient: "from-slate-500 to-gray-400",
  },
};

export const LoadingState = ({
  type = "default",
  message,
  submessage,
  className = "",
}: LoadingStateProps) => {
  const config = loadingConfigs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      <motion.div
        className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} bg-opacity-20 flex items-center justify-center mb-6`}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={{ rotate: type === "default" ? 360 : 0 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Icon className="h-10 w-10 text-white" />
        </motion.div>
        
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/80"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.3,
            }}
            style={{
              transformOrigin: "40px 40px",
            }}
          />
        ))}
      </motion.div>

      <motion.p
        className="text-lg font-medium mb-1"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message || config.messages[0]}
      </motion.p>
      
      <p className="text-sm text-muted-foreground">
        {submessage || config.submessage}
      </p>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient}`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Skeleton with shimmer effect
export const SkeletonShimmer = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-muted rounded ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

// Card skeleton
export const CardSkeleton = () => (
  <div className="p-6 rounded-xl border border-border bg-card space-y-4">
    <div className="flex items-center gap-4">
      <SkeletonShimmer className="w-12 h-12 rounded-lg" />
      <div className="space-y-2 flex-1">
        <SkeletonShimmer className="h-4 w-3/4" />
        <SkeletonShimmer className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonShimmer className="h-20 w-full" />
    <div className="flex gap-2">
      <SkeletonShimmer className="h-8 w-20 rounded-md" />
      <SkeletonShimmer className="h-8 w-20 rounded-md" />
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    <div className="flex gap-4 p-4 border-b border-border">
      <SkeletonShimmer className="h-4 w-1/4" />
      <SkeletonShimmer className="h-4 w-1/4" />
      <SkeletonShimmer className="h-4 w-1/4" />
      <SkeletonShimmer className="h-4 w-1/4" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4">
        <SkeletonShimmer className="h-4 w-1/4" />
        <SkeletonShimmer className="h-4 w-1/4" />
        <SkeletonShimmer className="h-4 w-1/4" />
        <SkeletonShimmer className="h-4 w-1/4" />
      </div>
    ))}
  </div>
);

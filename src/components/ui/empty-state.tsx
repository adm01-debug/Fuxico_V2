import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  FileText, 
  Link2, 
  BarChart3, 
  Users, 
  Bell,
  Search,
  Filter,
  Plus,
  Inbox,
  MousePointerClick,
  Eye,
  TrendingUp,
  Calendar,
  Globe,
  Award,
  Target
} from "lucide-react";

type EmptyStateType = 
  | "emails" 
  | "documents" 
  | "links" 
  | "analytics" 
  | "search" 
  | "filter" 
  | "notifications"
  | "leads"
  | "campaigns"
  | "geo";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfigs: Record<EmptyStateType, {
  icon: typeof Mail;
  title: string;
  description: string;
  actionLabel: string;
  gradient: string;
  illustration: React.ReactNode;
}> = {
  emails: {
    icon: Mail,
    title: "Nenhum email rastreado ainda",
    description: "Comece a enviar emails rastreados e veja aqui quem está abrindo suas mensagens.",
    actionLabel: "Criar Primeiro Rastreamento",
    gradient: "from-blue-500 to-cyan-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Inbox className="h-12 w-12 text-blue-500" />
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Eye className="h-4 w-4 text-primary" />
        </motion.div>
        <motion.div
          className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </motion.div>
      </div>
    ),
  },
  documents: {
    icon: FileText,
    title: "Nenhum documento rastreado",
    description: "Faça upload de PDFs e documentos para rastrear quem visualiza seus arquivos.",
    actionLabel: "Fazer Upload",
    gradient: "from-purple-500 to-violet-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-400/20 flex items-center justify-center"
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <FileText className="h-12 w-12 text-purple-500" />
        </motion.div>
        <motion.div
          className="absolute top-0 right-0 w-4 h-4 rounded-full bg-purple-400"
          animate={{ scale: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet-400" />
          ))}
        </motion.div>
      </div>
    ),
  },
  links: {
    icon: Link2,
    title: "Nenhum link rastreado",
    description: "Crie links rastreáveis para monitorar cliques e engajamento.",
    actionLabel: "Criar Link",
    gradient: "from-green-500 to-emerald-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-400/20 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Link2 className="h-12 w-12 text-green-500" />
        </motion.div>
        <motion.div
          className="absolute -right-3 top-1/2 transform -translate-y-1/2"
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <MousePointerClick className="h-6 w-6 text-emerald-500" />
        </motion.div>
      </div>
    ),
  },
  analytics: {
    icon: BarChart3,
    title: "Sem dados para exibir",
    description: "Envie emails rastreados para começar a ver análises detalhadas.",
    actionLabel: "Ver Tutorial",
    gradient: "from-orange-500 to-amber-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-400/20 flex items-end justify-center gap-1 p-4"
        >
          {[40, 60, 35, 75, 50].map((height, i) => (
            <motion.div
              key={i}
              className="w-3 rounded-t bg-gradient-to-t from-orange-500 to-amber-400"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity, repeatDelay: 2 }}
            />
          ))}
        </motion.div>
        <motion.div
          className="absolute -top-2 right-0"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp className="h-5 w-5 text-orange-500" />
        </motion.div>
      </div>
    ),
  },
  search: {
    icon: Search,
    title: "Nenhum resultado encontrado",
    description: "Tente ajustar os termos de busca ou remova alguns filtros.",
    actionLabel: "Limpar Busca",
    gradient: "from-slate-500 to-gray-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-500/20 to-gray-400/20 flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Search className="h-12 w-12 text-slate-500" />
        </motion.div>
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-2xl"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ❓
        </motion.div>
      </div>
    ),
  },
  filter: {
    icon: Filter,
    title: "Nenhum item corresponde aos filtros",
    description: "Ajuste os filtros selecionados para ver mais resultados.",
    actionLabel: "Limpar Filtros",
    gradient: "from-indigo-500 to-blue-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-400/20 flex items-center justify-center"
        >
          <Filter className="h-12 w-12 text-indigo-500" />
        </motion.div>
        <motion.div
          className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500/50"
          animate={{ scale: [1, 0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    ),
  },
  notifications: {
    icon: Bell,
    title: "Nenhuma notificação",
    description: "Você está em dia! Novas notificações aparecerão aqui.",
    actionLabel: "Configurar Alertas",
    gradient: "from-yellow-500 to-orange-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-400/20 flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <Bell className="h-12 w-12 text-yellow-500" />
        </motion.div>
        <motion.div
          className="absolute -top-1 -right-1 text-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          ✨
        </motion.div>
      </div>
    ),
  },
  leads: {
    icon: Target,
    title: "Nenhum lead qualificado",
    description: "Envie emails rastreados para gerar pontuação de leads automaticamente.",
    actionLabel: "Criar Rastreamento",
    gradient: "from-rose-500 to-pink-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-400/20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Target className="h-12 w-12 text-rose-500" />
        </motion.div>
        <motion.div
          className="absolute -bottom-2 right-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Award className="h-6 w-6 text-pink-500" />
        </motion.div>
      </div>
    ),
  },
  campaigns: {
    icon: Users,
    title: "Nenhuma campanha ativa",
    description: "Crie campanhas para organizar seus emails e acompanhar resultados.",
    actionLabel: "Criar Campanha",
    gradient: "from-teal-500 to-cyan-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-400/20 flex items-center justify-center"
        >
          <Calendar className="h-12 w-12 text-teal-500" />
        </motion.div>
        <motion.div
          className="absolute -right-2 -top-2 flex -space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 border-2 border-background"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </div>
    ),
  },
  geo: {
    icon: Globe,
    title: "Sem dados geográficos",
    description: "Dados de localização aparecerão quando seus emails forem abertos.",
    actionLabel: "Saiba Mais",
    gradient: "from-sky-500 to-blue-400",
    illustration: (
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-400/20 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Globe className="h-12 w-12 text-sky-500" />
        </motion.div>
        <motion.div
          className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-green-500"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>
    ),
  },
};

export const EmptyState = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) => {
  const config = emptyStateConfigs[type];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        {config.illustration}
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold font-display mb-2"
      >
        {title || config.title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-sm mb-6"
      >
        {description || config.description}
      </motion.p>
      
      {onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={onAction}
            className={`gap-2 bg-gradient-to-r ${config.gradient} text-white border-0 hover:opacity-90 transition-opacity`}
          >
            <Plus className="h-4 w-4" />
            {actionLabel || config.actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

import React from "react";
import { motion } from "framer-motion";
import {
  Mail, FileText, Link2, BarChart3, Users, Bell, Search, Filter,
  Inbox, MousePointerClick, Eye, TrendingUp, Calendar, Globe, Award,
  Target, ClipboardList, FlaskConical, Clock, Sparkles,
} from "lucide-react";

export type EmptyStateType =
  | "emails" | "documents" | "links" | "analytics" | "search" | "filter"
  | "notifications" | "leads" | "campaigns" | "geo" | "templates"
  | "abtesting" | "followup" | "reports" | "sequences" | "unsubscribe"
  | "webhooks" | "insights";

export interface EmptyStateConfig {
  icon: typeof Mail;
  title: string;
  description: string;
  actionLabel: string;
  gradient: string;
  illustration: React.ReactNode;
}

// Reusable animated illustration wrapper
const IllustrationBox = ({ gradient, children, animate }: {
  gradient: string;
  children: React.ReactNode;
  animate?: Record<string, number[] | string[] | number>;
}) => (
  <motion.div
    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
    animate={animate as any}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

export const emptyStateConfigs: Record<EmptyStateType, EmptyStateConfig> = {
  emails: {
    icon: Mail,
    title: "Nenhum email rastreado ainda",
    description: "Comece a enviar emails rastreados e veja aqui quem está abrindo suas mensagens.",
    actionLabel: "Criar Primeiro Rastreamento",
    gradient: "from-blue-500 to-cyan-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-blue-500/20 to-cyan-400/20" animate={{ y: [0, -8, 0] }}>
          <Inbox className="h-12 w-12 text-blue-500" />
        </IllustrationBox>
        <motion.div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
          <Eye className="h-4 w-4 text-primary" />
        </motion.div>
        <motion.div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
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
        <IllustrationBox gradient="from-purple-500/20 to-violet-400/20" animate={{ rotate: [0, 3, -3, 0] }}>
          <FileText className="h-12 w-12 text-purple-500" />
        </IllustrationBox>
        <motion.div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-purple-400"
          animate={{ scale: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
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
        <IllustrationBox gradient="from-green-500/20 to-emerald-400/20" animate={{ scale: [1, 1.05, 1] }}>
          <Link2 className="h-12 w-12 text-green-500" />
        </IllustrationBox>
        <motion.div className="absolute -right-3 top-1/2 transform -translate-y-1/2"
          animate={{ x: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
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
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-400/20 flex items-end justify-center gap-1 p-4">
          {[40, 60, 35, 75, 50].map((height, i) => (
            <motion.div key={i} className="w-3 rounded-t bg-gradient-to-t from-orange-500 to-amber-400"
              initial={{ height: 0 }} animate={{ height: `${height}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity, repeatDelay: 2 }} />
          ))}
        </div>
        <motion.div className="absolute -top-2 right-0" animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
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
        <IllustrationBox gradient="from-slate-500/20 to-gray-400/20" animate={{ rotate: [0, 10, -10, 0] }}>
          <Search className="h-12 w-12 text-slate-500" />
        </IllustrationBox>
        <motion.div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-2xl"
          animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }}>❓</motion.div>
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
        <IllustrationBox gradient="from-indigo-500/20 to-blue-400/20">
          <Filter className="h-12 w-12 text-indigo-500" />
        </IllustrationBox>
        <motion.div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500/50"
          animate={{ scale: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
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
        <IllustrationBox gradient="from-yellow-500/20 to-orange-400/20" animate={{ rotate: [0, 10, -10, 0] }}>
          <Bell className="h-12 w-12 text-yellow-500" />
        </IllustrationBox>
        <motion.div className="absolute -top-1 -right-1 text-xl"
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}>✨</motion.div>
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
        <IllustrationBox gradient="from-rose-500/20 to-pink-400/20" animate={{ scale: [1, 1.1, 1] }}>
          <Target className="h-12 w-12 text-rose-500" />
        </IllustrationBox>
        <motion.div className="absolute -bottom-2 right-0" animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
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
        <IllustrationBox gradient="from-teal-500/20 to-cyan-400/20">
          <Calendar className="h-12 w-12 text-teal-500" />
        </IllustrationBox>
        <motion.div className="absolute -right-2 -top-2 flex -space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 border-2 border-background"
              animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
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
        <IllustrationBox gradient="from-sky-500/20 to-blue-400/20" animate={{ rotate: 360 }}>
          <Globe className="h-12 w-12 text-sky-500" />
        </IllustrationBox>
        <motion.div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500"
          animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
      </div>
    ),
  },
  templates: {
    icon: FileText,
    title: "Nenhum template criado",
    description: "Crie templates prontos com pixel de tracking para enviar emails profissionais.",
    actionLabel: "Criar Template",
    gradient: "from-violet-500 to-purple-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-violet-500/20 to-purple-400/20" animate={{ y: [0, -5, 0] }}>
          <FileText className="h-12 w-12 text-violet-500" />
        </IllustrationBox>
        <motion.div className="absolute -top-1 -right-1"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <Sparkles className="h-5 w-5 text-purple-400" />
        </motion.div>
      </div>
    ),
  },
  abtesting: {
    icon: FlaskConical,
    title: "Nenhum teste A/B criado",
    description: "Compare assuntos diferentes para descobrir qual tem melhor performance.",
    actionLabel: "Criar Teste",
    gradient: "from-fuchsia-500 to-pink-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-fuchsia-500/20 to-pink-400/20">
          <FlaskConical className="h-12 w-12 text-fuchsia-500" />
        </IllustrationBox>
        <motion.div className="absolute -top-2 left-2 text-lg"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>A</motion.div>
        <motion.div className="absolute -bottom-2 right-2 text-lg"
          animate={{ y: [0, 5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>B</motion.div>
      </div>
    ),
  },
  followup: {
    icon: Clock,
    title: "Nenhum lembrete de follow-up",
    description: "Configure lembretes automáticos para fazer follow-up nos momentos certos.",
    actionLabel: "Criar Lembrete",
    gradient: "from-amber-500 to-yellow-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-amber-500/20 to-yellow-400/20" animate={{ rotate: [0, 5, -5, 0] }}>
          <Clock className="h-12 w-12 text-amber-500" />
        </IllustrationBox>
        <motion.div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-400/30 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
          <Bell className="h-4 w-4 text-amber-500" />
        </motion.div>
      </div>
    ),
  },
  reports: {
    icon: ClipboardList,
    title: "Nenhum relatório agendado",
    description: "Configure relatórios automáticos para receber métricas importantes.",
    actionLabel: "Agendar Relatório",
    gradient: "from-emerald-500 to-teal-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-emerald-500/20 to-teal-400/20">
          <ClipboardList className="h-12 w-12 text-emerald-500" />
        </IllustrationBox>
        <motion.div className="absolute -bottom-1 -left-1" animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
          <Calendar className="h-5 w-5 text-teal-500" />
        </motion.div>
      </div>
    ),
  },
  sequences: {
    icon: Mail,
    title: "Nenhuma sequência criada",
    description: "Crie sequências de email automatizadas para aumentar taxas de resposta.",
    actionLabel: "Criar Sequência",
    gradient: "from-cyan-500 to-blue-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-cyan-500/20 to-blue-400/20">
          <Mail className="h-12 w-12 text-cyan-500" />
        </IllustrationBox>
        <motion.div className="absolute -right-2 top-2 flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-3 h-3 rounded-full bg-blue-400"
              animate={{ x: [0, 10, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }} />
          ))}
        </motion.div>
        <motion.div className="absolute -bottom-2 left-1/2 -translate-x-1/2"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <TrendingUp className="h-5 w-5 text-cyan-500" />
        </motion.div>
      </div>
    ),
  },
  unsubscribe: {
    icon: Users,
    title: "Lista de exclusão vazia",
    description: "Adicione emails que não devem receber comunicações.",
    actionLabel: "Adicionar Email",
    gradient: "from-slate-500 to-gray-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-slate-500/20 to-gray-400/20">
          <Users className="h-12 w-12 text-slate-500" />
        </IllustrationBox>
        <motion.div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <span className="text-xs">✕</span>
        </motion.div>
      </div>
    ),
  },
  webhooks: {
    icon: Globe,
    title: "Nenhum webhook configurado",
    description: "Configure endpoints para receber notificações em tempo real.",
    actionLabel: "Configurar Webhook",
    gradient: "from-indigo-500 to-purple-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-indigo-500/20 to-purple-400/20">
          <Globe className="h-12 w-12 text-indigo-500" />
        </IllustrationBox>
        <motion.div className="absolute -right-2 top-1/2 -translate-y-1/2"
          animate={{ x: [0, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
          <motion.div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }} />
            ))}
          </motion.div>
        </motion.div>
      </div>
    ),
  },
  insights: {
    icon: Sparkles,
    title: "Sem dados para análise",
    description: "Envie emails rastreados para gerar insights com IA automaticamente.",
    actionLabel: "Criar Rastreamento",
    gradient: "from-yellow-500 to-amber-400",
    illustration: (
      <div className="relative">
        <IllustrationBox gradient="from-yellow-500/20 to-amber-400/20" animate={{ rotate: [0, 5, -5, 0] }}>
          <Sparkles className="h-12 w-12 text-yellow-500" />
        </IllustrationBox>
        <motion.div className="absolute -top-2 -right-2"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
          <span className="text-2xl">✨</span>
        </motion.div>
      </div>
    ),
  },
};

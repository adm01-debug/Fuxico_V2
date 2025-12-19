// FUXICO Onboarding Configuration
// Configuração dos passos do tour de onboarding

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;
  showProgress?: boolean;
  showSkip?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface TourConfig {
  id: string;
  name: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

// ============================================
// DASHBOARD TOUR
// ============================================

export const dashboardTour: TourConfig = {
  id: 'dashboard-tour',
  name: 'Tour do Dashboard',
  steps: [
    {
      id: 'welcome',
      target: 'body',
      title: '👋 Bem-vindo ao FUXICO!',
      content: 'Vamos fazer um tour rápido pelas principais funcionalidades do sistema de rastreamento de emails.',
      position: 'center',
      showProgress: false,
      nextLabel: 'Começar Tour',
    },
    {
      id: 'stats-cards',
      target: '[data-tour="stats-cards"]',
      title: '📊 Estatísticas Gerais',
      content: 'Aqui você vê um resumo dos seus emails rastreados: total enviado, aberturas, cliques e taxa de abertura.',
      position: 'bottom',
      spotlightPadding: 16,
    },
    {
      id: 'email-list',
      target: '[data-tour="email-list"]',
      title: '📧 Lista de Emails',
      content: 'Esta é a lista de todos os emails que você está rastreando. Clique em um email para ver os detalhes de quem e quando abriu.',
      position: 'right',
      spotlightPadding: 8,
    },
    {
      id: 'email-detail',
      target: '[data-tour="email-detail"]',
      title: '🔍 Detalhes do Email',
      content: 'Quando você selecionar um email, verá aqui todos os eventos: cada abertura, clique em link, informações de localização e dispositivo.',
      position: 'left',
      spotlightPadding: 8,
    },
    {
      id: 'create-tracking',
      target: '[data-tour="create-tracking"]',
      title: '➕ Criar Rastreamento',
      content: 'Clique aqui para criar um novo rastreamento. Você receberá um pixel e links que podem ser adicionados ao seu email.',
      position: 'bottom',
      spotlightPadding: 4,
    },
    {
      id: 'tabs',
      target: '[data-tour="tabs"]',
      title: '📑 Outras Funcionalidades',
      content: 'Use estas abas para acessar: Documentos rastreados, Links standalone, integração com Bitrix24 e Auditoria de emails.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      id: 'extension',
      target: 'body',
      title: '🧩 Extensão do Chrome',
      content: 'Para rastrear automaticamente os emails enviados pelo Gmail, instale nossa extensão do Chrome. Ela injeta o pixel de rastreamento automaticamente!',
      position: 'center',
      showProgress: false,
      nextLabel: 'Concluir Tour',
    },
  ],
};

// ============================================
// EXTENSION TOUR
// ============================================

export const extensionTour: TourConfig = {
  id: 'extension-tour',
  name: 'Tour da Extensão',
  steps: [
    {
      id: 'extension-welcome',
      target: 'body',
      title: '🧩 Extensão FUXICO',
      content: 'Parabéns por instalar a extensão! Veja como ela funciona.',
      position: 'center',
      nextLabel: 'Continuar',
    },
    {
      id: 'toggle-button',
      target: '.fuxico-toggle-btn',
      title: '🎚️ Ativar/Desativar',
      content: 'Use este botão para ativar ou desativar o rastreamento. Quando verde, todos os emails serão rastreados.',
      position: 'bottom',
    },
    {
      id: 'send-email',
      target: '[aria-label*="Send"], [aria-label*="Enviar"]',
      title: '📤 Enviando Email',
      content: 'Quando você clicar em Enviar, o FUXICO automaticamente adiciona o pixel de rastreamento ao email.',
      position: 'top',
    },
    {
      id: 'notifications',
      target: 'body',
      title: '🔔 Notificações',
      content: 'Você receberá notificações quando seus emails forem abertos. Configure isso nas preferências.',
      position: 'center',
      nextLabel: 'Entendi!',
    },
  ],
};

// ============================================
// BITRIX24 TOUR
// ============================================

export const bitrixTour: TourConfig = {
  id: 'bitrix-tour',
  name: 'Tour do Bitrix24',
  steps: [
    {
      id: 'bitrix-intro',
      target: '[data-tour="bitrix-tab"]',
      title: '🔗 Integração Bitrix24',
      content: 'Configure a integração com seu Bitrix24 para sincronizar contatos, atividades e negócios automaticamente.',
      position: 'bottom',
    },
    {
      id: 'webhook-config',
      target: '[data-tour="webhook-input"]',
      title: '🔑 Webhook URL',
      content: 'Cole aqui a URL do webhook do seu Bitrix24. Você encontra isso em CRM > Configurações > Integração > REST API.',
      position: 'bottom',
    },
    {
      id: 'auto-sync',
      target: '[data-tour="auto-sync"]',
      title: '🔄 Sincronização Automática',
      content: 'Ative estas opções para que o FUXICO crie contatos e registre atividades automaticamente quando emails forem abertos.',
      position: 'left',
    },
  ],
};

// ============================================
// FIRST TIME USER TOUR
// ============================================

export const firstTimeTour: TourConfig = {
  id: 'first-time',
  name: 'Primeiro Acesso',
  steps: [
    {
      id: 'ft-welcome',
      target: 'body',
      title: '🎉 Bem-vindo ao FUXICO!',
      content: 'O FUXICO é um sistema completo de rastreamento de emails. Saiba exatamente quando seus emails são lidos!',
      position: 'center',
      showSkip: true,
      nextLabel: 'Vamos lá!',
    },
    {
      id: 'ft-how-it-works',
      target: 'body',
      title: '⚙️ Como Funciona',
      content: 'O FUXICO usa um pixel invisível 1x1 que é inserido nos seus emails. Quando o destinatário abre o email, registramos a abertura.',
      position: 'center',
    },
    {
      id: 'ft-privacy',
      target: 'body',
      title: '🔒 Privacidade',
      content: 'Seus dados são protegidos e apenas você pode ver as estatísticas dos seus emails. Respeitamos a privacidade de todos.',
      position: 'center',
    },
    {
      id: 'ft-get-started',
      target: 'body',
      title: '🚀 Próximos Passos',
      content: '1. Instale a extensão do Chrome para Gmail\n2. Envie um email de teste\n3. Veja o rastreamento funcionando!',
      position: 'center',
      nextLabel: 'Começar a Usar',
    },
  ],
};

// ============================================
// TOUR REGISTRY
// ============================================

export const tours: Record<string, TourConfig> = {
  'dashboard': dashboardTour,
  'extension': extensionTour,
  'bitrix': bitrixTour,
  'first-time': firstTimeTour,
};

export function getTour(id: string): TourConfig | undefined {
  return tours[id];
}

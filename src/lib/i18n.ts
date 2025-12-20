// =============================================================================
// FUXICO - Configuração de Internacionalização (i18n)
// Arquivo: src/lib/i18n.ts
// =============================================================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// =============================================================================
// TRADUÇÕES
// =============================================================================

const resources = {
  pt: {
    translation: {
      // Navegação
      nav: {
        dashboard: 'Dashboard',
        emails: 'Emails',
        links: 'Links',
        documents: 'Documentos',
        reports: 'Relatórios',
        templates: 'Templates',
        settings: 'Configurações',
        audit: 'Auditoria',
        bitrix: 'Bitrix24',
      },
      
      // Dashboard
      dashboard: {
        title: 'Dashboard',
        welcome: 'Bem-vindo ao FUXICO',
        totalEmails: 'Total de Emails',
        openRate: 'Taxa de Abertura',
        clickRate: 'Taxa de Cliques',
        bounceRate: 'Taxa de Bounce',
        recentActivity: 'Atividade Recente',
        noData: 'Nenhum dado disponível',
      },
      
      // Emails
      email: {
        recipient: 'Destinatário',
        subject: 'Assunto',
        status: 'Status',
        opens: 'Aberturas',
        clicks: 'Cliques',
        createdAt: 'Criado em',
        firstOpen: 'Primeira abertura',
        lastOpen: 'Última abertura',
        noSubject: '(Sem assunto)',
        statuses: {
          pending: 'Pendente',
          delivered: 'Entregue',
          opened: 'Aberto',
          clicked: 'Clicado',
          bounced: 'Rejeitado',
          failed: 'Falhou',
        },
      },
      
      // Ações
      actions: {
        create: 'Criar',
        edit: 'Editar',
        delete: 'Excluir',
        cancel: 'Cancelar',
        save: 'Salvar',
        copy: 'Copiar',
        export: 'Exportar',
        filter: 'Filtrar',
        search: 'Buscar',
        refresh: 'Atualizar',
        viewDetails: 'Ver detalhes',
        close: 'Fechar',
      },
      
      // Formulários
      form: {
        recipientEmail: 'Email do Destinatário',
        emailSubject: 'Assunto do Email',
        required: 'Obrigatório',
        invalidEmail: 'Email inválido',
        minLength: 'Mínimo {{min}} caracteres',
        maxLength: 'Máximo {{max}} caracteres',
      },
      
      // Mensagens
      messages: {
        success: 'Operação realizada com sucesso',
        error: 'Ocorreu um erro',
        copied: 'Copiado para a área de transferência',
        saved: 'Salvo com sucesso',
        deleted: 'Excluído com sucesso',
        loading: 'Carregando...',
        noResults: 'Nenhum resultado encontrado',
        confirmDelete: 'Tem certeza que deseja excluir?',
      },
      
      // Autenticação
      auth: {
        login: 'Entrar',
        logout: 'Sair',
        email: 'Email',
        password: 'Senha',
        confirmPassword: 'Confirmar Senha',
        forgotPassword: 'Esqueci minha senha',
        createAccount: 'Criar conta',
        alreadyHaveAccount: 'Já tem uma conta?',
        dontHaveAccount: 'Não tem uma conta?',
        invalidCredentials: 'Credenciais inválidas',
      },
      
      // Filtros
      filters: {
        all: 'Todos',
        today: 'Hoje',
        yesterday: 'Ontem',
        last7days: 'Últimos 7 dias',
        last30days: 'Últimos 30 dias',
        thisMonth: 'Este mês',
        lastMonth: 'Mês passado',
        custom: 'Personalizado',
        from: 'De',
        to: 'Até',
      },
      
      // Exportação
      export: {
        title: 'Exportar Dados',
        format: 'Formato',
        dateRange: 'Período',
        includeStats: 'Incluir estatísticas',
        exporting: 'Exportando...',
        success: 'Exportação concluída',
      },
      
      // Configurações
      settings: {
        title: 'Configurações',
        profile: 'Perfil',
        notifications: 'Notificações',
        integrations: 'Integrações',
        security: 'Segurança',
        language: 'Idioma',
        theme: 'Tema',
        themes: {
          light: 'Claro',
          dark: 'Escuro',
          system: 'Sistema',
        },
      },
      
      // Erros
      errors: {
        generic: 'Algo deu errado. Tente novamente.',
        network: 'Erro de conexão. Verifique sua internet.',
        unauthorized: 'Sessão expirada. Faça login novamente.',
        notFound: 'Recurso não encontrado.',
        rateLimit: 'Muitas requisições. Aguarde um momento.',
        validation: 'Dados inválidos. Verifique os campos.',
      },
      
      // Tempo relativo
      time: {
        justNow: 'Agora mesmo',
        minutesAgo: 'há {{count}} minuto',
        minutesAgo_plural: 'há {{count}} minutos',
        hoursAgo: 'há {{count}} hora',
        hoursAgo_plural: 'há {{count}} horas',
        daysAgo: 'há {{count}} dia',
        daysAgo_plural: 'há {{count}} dias',
        weeksAgo: 'há {{count}} semana',
        weeksAgo_plural: 'há {{count}} semanas',
      },
    },
  },
  
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        emails: 'Emails',
        links: 'Links',
        documents: 'Documents',
        reports: 'Reports',
        templates: 'Templates',
        settings: 'Settings',
        audit: 'Audit',
        bitrix: 'Bitrix24',
      },
      
      dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome to FUXICO',
        totalEmails: 'Total Emails',
        openRate: 'Open Rate',
        clickRate: 'Click Rate',
        bounceRate: 'Bounce Rate',
        recentActivity: 'Recent Activity',
        noData: 'No data available',
      },
      
      email: {
        recipient: 'Recipient',
        subject: 'Subject',
        status: 'Status',
        opens: 'Opens',
        clicks: 'Clicks',
        createdAt: 'Created at',
        firstOpen: 'First open',
        lastOpen: 'Last open',
        noSubject: '(No subject)',
        statuses: {
          pending: 'Pending',
          delivered: 'Delivered',
          opened: 'Opened',
          clicked: 'Clicked',
          bounced: 'Bounced',
          failed: 'Failed',
        },
      },
      
      actions: {
        create: 'Create',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        save: 'Save',
        copy: 'Copy',
        export: 'Export',
        filter: 'Filter',
        search: 'Search',
        refresh: 'Refresh',
        viewDetails: 'View details',
        close: 'Close',
      },
      
      form: {
        recipientEmail: 'Recipient Email',
        emailSubject: 'Email Subject',
        required: 'Required',
        invalidEmail: 'Invalid email',
        minLength: 'Minimum {{min}} characters',
        maxLength: 'Maximum {{max}} characters',
      },
      
      messages: {
        success: 'Operation successful',
        error: 'An error occurred',
        copied: 'Copied to clipboard',
        saved: 'Saved successfully',
        deleted: 'Deleted successfully',
        loading: 'Loading...',
        noResults: 'No results found',
        confirmDelete: 'Are you sure you want to delete?',
      },
      
      auth: {
        login: 'Login',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        forgotPassword: 'Forgot password',
        createAccount: 'Create account',
        alreadyHaveAccount: 'Already have an account?',
        dontHaveAccount: "Don't have an account?",
        invalidCredentials: 'Invalid credentials',
      },
      
      filters: {
        all: 'All',
        today: 'Today',
        yesterday: 'Yesterday',
        last7days: 'Last 7 days',
        last30days: 'Last 30 days',
        thisMonth: 'This month',
        lastMonth: 'Last month',
        custom: 'Custom',
        from: 'From',
        to: 'To',
      },
      
      export: {
        title: 'Export Data',
        format: 'Format',
        dateRange: 'Date Range',
        includeStats: 'Include statistics',
        exporting: 'Exporting...',
        success: 'Export completed',
      },
      
      settings: {
        title: 'Settings',
        profile: 'Profile',
        notifications: 'Notifications',
        integrations: 'Integrations',
        security: 'Security',
        language: 'Language',
        theme: 'Theme',
        themes: {
          light: 'Light',
          dark: 'Dark',
          system: 'System',
        },
      },
      
      errors: {
        generic: 'Something went wrong. Please try again.',
        network: 'Connection error. Check your internet.',
        unauthorized: 'Session expired. Please login again.',
        notFound: 'Resource not found.',
        rateLimit: 'Too many requests. Please wait.',
        validation: 'Invalid data. Check the fields.',
      },
      
      time: {
        justNow: 'Just now',
        minutesAgo: '{{count}} minute ago',
        minutesAgo_plural: '{{count}} minutes ago',
        hoursAgo: '{{count}} hour ago',
        hoursAgo_plural: '{{count}} hours ago',
        daysAgo: '{{count}} day ago',
        daysAgo_plural: '{{count}} days ago',
        weeksAgo: '{{count}} week ago',
        weeksAgo_plural: '{{count}} weeks ago',
      },
    },
  },
  
  es: {
    translation: {
      nav: {
        dashboard: 'Panel',
        emails: 'Correos',
        links: 'Enlaces',
        documents: 'Documentos',
        reports: 'Informes',
        templates: 'Plantillas',
        settings: 'Configuración',
        audit: 'Auditoría',
        bitrix: 'Bitrix24',
      },
      
      dashboard: {
        title: 'Panel',
        welcome: 'Bienvenido a FUXICO',
        totalEmails: 'Total de Correos',
        openRate: 'Tasa de Apertura',
        clickRate: 'Tasa de Clics',
        bounceRate: 'Tasa de Rebote',
        recentActivity: 'Actividad Reciente',
        noData: 'Sin datos disponibles',
      },
      
      email: {
        recipient: 'Destinatario',
        subject: 'Asunto',
        status: 'Estado',
        opens: 'Aperturas',
        clicks: 'Clics',
        createdAt: 'Creado en',
        firstOpen: 'Primera apertura',
        lastOpen: 'Última apertura',
        noSubject: '(Sin asunto)',
        statuses: {
          pending: 'Pendiente',
          delivered: 'Entregado',
          opened: 'Abierto',
          clicked: 'Cliqueado',
          bounced: 'Rebotado',
          failed: 'Fallido',
        },
      },
      
      actions: {
        create: 'Crear',
        edit: 'Editar',
        delete: 'Eliminar',
        cancel: 'Cancelar',
        save: 'Guardar',
        copy: 'Copiar',
        export: 'Exportar',
        filter: 'Filtrar',
        search: 'Buscar',
        refresh: 'Actualizar',
        viewDetails: 'Ver detalles',
        close: 'Cerrar',
      },
      
      messages: {
        success: 'Operación exitosa',
        error: 'Ocurrió un error',
        copied: 'Copiado al portapapeles',
        saved: 'Guardado exitosamente',
        deleted: 'Eliminado exitosamente',
        loading: 'Cargando...',
        noResults: 'Sin resultados',
        confirmDelete: '¿Está seguro de eliminar?',
      },
      
      auth: {
        login: 'Iniciar sesión',
        logout: 'Cerrar sesión',
        email: 'Correo',
        password: 'Contraseña',
        confirmPassword: 'Confirmar Contraseña',
        forgotPassword: 'Olvidé mi contraseña',
        createAccount: 'Crear cuenta',
        alreadyHaveAccount: '¿Ya tiene una cuenta?',
        dontHaveAccount: '¿No tiene una cuenta?',
        invalidCredentials: 'Credenciales inválidas',
      },
      
      errors: {
        generic: 'Algo salió mal. Intente de nuevo.',
        network: 'Error de conexión. Verifique su internet.',
        unauthorized: 'Sesión expirada. Inicie sesión de nuevo.',
        notFound: 'Recurso no encontrado.',
        rateLimit: 'Demasiadas solicitudes. Espere un momento.',
        validation: 'Datos inválidos. Verifique los campos.',
      },
    },
  },
};

// =============================================================================
// INICIALIZAÇÃO
// =============================================================================

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    debug: import.meta.env.DEV,
    
    interpolation: {
      escapeValue: false, // React já faz escape
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'fuxico_language',
    },
  });

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Altera o idioma atual
 */
export function changeLanguage(lang: string): Promise<void> {
  return i18n.changeLanguage(lang);
}

/**
 * Retorna o idioma atual
 */
export function getCurrentLanguage(): string {
  return i18n.language;
}

/**
 * Idiomas disponíveis
 */
export const availableLanguages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export default i18n;

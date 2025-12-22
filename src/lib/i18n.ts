// =============================================================================
// FUXICO - Sistema de Internacionalização (i18n)
// Suporte a: Português (BR), English (US), Español (ES)
// =============================================================================

export type Language = 'pt-BR' | 'en-US' | 'es-ES';

export interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
  'pt-BR': {
    common: {
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      add: 'Adicionar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      refresh: 'Atualizar',
      close: 'Fechar',
      confirm: 'Confirmar',
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Atenção',
      info: 'Informação',
    },
    auth: {
      login: 'Entrar',
      logout: 'Sair',
      register: 'Cadastrar',
      email: 'Email',
      password: 'Senha',
      forgotPassword: 'Esqueceu a senha?',
      rememberMe: 'Lembrar de mim',
    },
    dashboard: {
      title: 'Dashboard',
      emails: 'Emails',
      links: 'Links',
      documents: 'Documentos',
      reports: 'Relatórios',
      settings: 'Configurações',
      analytics: 'Analytics',
      campaigns: 'Campanhas',
      templates: 'Templates',
      audit: 'Auditoria',
    },
    tracking: {
      opens: 'Aberturas',
      clicks: 'Cliques',
      bounces: 'Bounces',
      delivered: 'Entregues',
      pending: 'Pendentes',
      selfOpens: 'Auto-aberturas',
      uniqueOpens: 'Aberturas Únicas',
      openRate: 'Taxa de Abertura',
      clickRate: 'Taxa de Cliques',
    },
    email: {
      to: 'Para',
      from: 'De',
      subject: 'Assunto',
      date: 'Data',
      status: 'Status',
      noEmails: 'Nenhum email encontrado',
      createTracking: 'Criar Rastreamento',
    },
    settings: {
      profile: 'Perfil',
      notifications: 'Notificações',
      integrations: 'Integrações',
      security: 'Segurança',
      preferences: 'Preferências',
      theme: 'Tema',
      language: 'Idioma',
      darkMode: 'Modo Escuro',
      lightMode: 'Modo Claro',
      systemMode: 'Usar do Sistema',
    },
  },
  'en-US': {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      refresh: 'Refresh',
      close: 'Close',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      rememberMe: 'Remember me',
    },
    dashboard: {
      title: 'Dashboard',
      emails: 'Emails',
      links: 'Links',
      documents: 'Documents',
      reports: 'Reports',
      settings: 'Settings',
      analytics: 'Analytics',
      campaigns: 'Campaigns',
      templates: 'Templates',
      audit: 'Audit',
    },
    tracking: {
      opens: 'Opens',
      clicks: 'Clicks',
      bounces: 'Bounces',
      delivered: 'Delivered',
      pending: 'Pending',
      selfOpens: 'Self-opens',
      uniqueOpens: 'Unique Opens',
      openRate: 'Open Rate',
      clickRate: 'Click Rate',
    },
    email: {
      to: 'To',
      from: 'From',
      subject: 'Subject',
      date: 'Date',
      status: 'Status',
      noEmails: 'No emails found',
      createTracking: 'Create Tracking',
    },
    settings: {
      profile: 'Profile',
      notifications: 'Notifications',
      integrations: 'Integrations',
      security: 'Security',
      preferences: 'Preferences',
      theme: 'Theme',
      language: 'Language',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      systemMode: 'Use System',
    },
  },
  'es-ES': {
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      add: 'Añadir',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      refresh: 'Actualizar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      success: 'Éxito',
      error: 'Error',
      warning: 'Atención',
      info: 'Información',
    },
    auth: {
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
      register: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      rememberMe: 'Recuérdame',
    },
    dashboard: {
      title: 'Panel',
      emails: 'Correos',
      links: 'Enlaces',
      documents: 'Documentos',
      reports: 'Informes',
      settings: 'Configuración',
      analytics: 'Analíticas',
      campaigns: 'Campañas',
      templates: 'Plantillas',
      audit: 'Auditoría',
    },
    tracking: {
      opens: 'Aperturas',
      clicks: 'Clics',
      bounces: 'Rebotes',
      delivered: 'Entregados',
      pending: 'Pendientes',
      selfOpens: 'Auto-aperturas',
      uniqueOpens: 'Aperturas Únicas',
      openRate: 'Tasa de Apertura',
      clickRate: 'Tasa de Clics',
    },
    email: {
      to: 'Para',
      from: 'De',
      subject: 'Asunto',
      date: 'Fecha',
      status: 'Estado',
      noEmails: 'No se encontraron correos',
      createTracking: 'Crear Seguimiento',
    },
    settings: {
      profile: 'Perfil',
      notifications: 'Notificaciones',
      integrations: 'Integraciones',
      security: 'Seguridad',
      preferences: 'Preferencias',
      theme: 'Tema',
      language: 'Idioma',
      darkMode: 'Modo Oscuro',
      lightMode: 'Modo Claro',
      systemMode: 'Usar del Sistema',
    },
  },
};

// Get browser language
function getBrowserLanguage(): Language {
  const browserLang = navigator.language;
  if (browserLang.startsWith('pt')) return 'pt-BR';
  if (browserLang.startsWith('es')) return 'es-ES';
  return 'en-US';
}

// Current language state
let currentLanguage: Language = 'pt-BR';

// Initialize with browser or stored preference
export function initI18n(): Language {
  const stored = localStorage.getItem('fuxico-language') as Language;
  currentLanguage = stored || getBrowserLanguage();
  return currentLanguage;
}

// Get current language
export function getLanguage(): Language {
  return currentLanguage;
}

// Set language
export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem('fuxico-language', lang);
  window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
}

// Translate function
export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English
      value = translations['en-US'];
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// React hook for translations
import { useState, useEffect, useCallback } from 'react';

export function useTranslation() {
  const [lang, setLang] = useState<Language>(currentLanguage);
  
  useEffect(() => {
    const handleChange = (e: CustomEvent<Language>) => setLang(e.detail);
    window.addEventListener('languageChange', handleChange as EventListener);
    return () => window.removeEventListener('languageChange', handleChange as EventListener);
  }, []);
  
  const translate = useCallback((key: string) => t(key), [lang]);
  
  return {
    t: translate,
    language: lang,
    setLanguage,
    languages: ['pt-BR', 'en-US', 'es-ES'] as Language[],
  };
}

// Initialize on load
if (typeof window !== 'undefined') {
  initI18n();
}

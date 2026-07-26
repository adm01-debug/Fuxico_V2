// FUXICO - Configuração Centralizada
// Este arquivo contém configurações da extensão com suporte a atualização dinâmica

const FUXICO_CONFIG = {
  // ============================================
  // CONFIGURAÇÃO BASE (fallback se API falhar)
  // ============================================
  
  // URLs do Backend (Supabase)
  SUPABASE_URL: 'https://npjfwzzapbtcguoupozd.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wamZ3enphcGJ0Y2d1b3Vwb3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzMzNjUsImV4cCI6MjA4MTU0OTM2NX0.YXA4kIY0eJl2Z3jeIw6yTB-KDjWwHLlftjOz6qVkoEw',
  
  // URL do Dashboard Web
  DASHBOARD_URL: 'https://fuxico.lovable.app',
  
  // Versão da extensão
  VERSION: '1.4.0',
  
  // Getter para API URL
  get API_URL() {
    return `${this.SUPABASE_URL}/functions/v1`;
  },
  
  // Endpoints das Edge Functions
  ENDPOINTS: {
    CREATE_TRACKING: '/create-tracking',
    TRACK_PIXEL: '/track-pixel',
    TRACK_LINK: '/track-link',
    TRACK_DOCUMENT: '/track-document',
    GET_STATS: '/get-tracking-stats',
    REPORT_BOUNCE: '/report-bounce',
    LOG_EMAIL_ACTIVITY: '/log-email-activity',
    GET_CONFIG: '/get-config',
    GET_DETAIL: '/get-tracking-detail',
    CREATE_REMINDER: '/create-reminder',
  },
  
  // Intervalos de verificação (em ms)
  INTERVALS: {
    POLL_OPENS: 30000,        // 30 segundos
    CHECK_COMPOSE: 1000,      // 1 segundo
    BOUNCE_CHECK: 30000,      // 30 segundos
    AUDIT_CHECK: 60000,       // 1 minuto
    TOKEN_REFRESH: 1800000,   // 30 minutos
    CONFIG_REFRESH: 3600000,  // 1 hora
  },
  
  // Configurações de detecção
  DETECTION: {
    SELF_OPEN_THRESHOLD_MS: 2 * 60 * 1000, // 2 minutos
  },
  
  // Features habilitadas
  FEATURES: {
    EMAIL_TRACKING: true,
    LINK_TRACKING: true,
    DOCUMENT_TRACKING: true,
    BOUNCE_DETECTION: true,
    EMAIL_AUDIT: true,
    BITRIX_INTEGRATION: true,
    WEBHOOKS: true,
    GEOLOCATION: false,
  },
  
  // ============================================
  // MÉTODOS DE CONFIGURAÇÃO DINÂMICA
  // ============================================
  
  // Flag para indicar se config foi carregada do servidor
  _isRemoteLoaded: false,
  _lastFetch: null,
  
  // Carregar configuração do servidor
  async loadRemoteConfig() {
    try {
      // Verificar se já carregou recentemente
      if (this._lastFetch && (Date.now() - this._lastFetch) < this.INTERVALS.CONFIG_REFRESH) {
        // // console.log('[FUXICO Config] Usando config em cache');
        return true;
      }
      
      const response = await fetch(`${this.API_URL}${this.ENDPOINTS.GET_CONFIG}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const remoteConfig = await response.json();
      
      // Atualizar configurações locais
      if (remoteConfig.version) this.VERSION = remoteConfig.version;
      if (remoteConfig.dashboardUrl) this.DASHBOARD_URL = remoteConfig.dashboardUrl;
      if (remoteConfig.intervals) {
        this.INTERVALS = {
          ...this.INTERVALS,
          POLL_OPENS: remoteConfig.intervals.pollOpens || this.INTERVALS.POLL_OPENS,
          CHECK_COMPOSE: remoteConfig.intervals.checkCompose || this.INTERVALS.CHECK_COMPOSE,
          BOUNCE_CHECK: remoteConfig.intervals.bounceCheck || this.INTERVALS.BOUNCE_CHECK,
          AUDIT_CHECK: remoteConfig.intervals.auditCheck || this.INTERVALS.AUDIT_CHECK,
          TOKEN_REFRESH: remoteConfig.intervals.tokenRefresh || this.INTERVALS.TOKEN_REFRESH,
        };
      }
      if (remoteConfig.detection) {
        this.DETECTION.SELF_OPEN_THRESHOLD_MS = remoteConfig.detection.selfOpenThresholdMs || this.DETECTION.SELF_OPEN_THRESHOLD_MS;
      }
      if (remoteConfig.features) {
        this.FEATURES = {
          EMAIL_TRACKING: remoteConfig.features.emailTracking ?? this.FEATURES.EMAIL_TRACKING,
          LINK_TRACKING: remoteConfig.features.linkTracking ?? this.FEATURES.LINK_TRACKING,
          DOCUMENT_TRACKING: remoteConfig.features.documentTracking ?? this.FEATURES.DOCUMENT_TRACKING,
          BOUNCE_DETECTION: remoteConfig.features.bounceDetection ?? this.FEATURES.BOUNCE_DETECTION,
          EMAIL_AUDIT: remoteConfig.features.emailAudit ?? this.FEATURES.EMAIL_AUDIT,
          BITRIX_INTEGRATION: remoteConfig.features.bitrixIntegration ?? this.FEATURES.BITRIX_INTEGRATION,
          WEBHOOKS: remoteConfig.features.webhooks ?? this.FEATURES.WEBHOOKS,
          GEOLOCATION: remoteConfig.features.geolocation ?? this.FEATURES.GEOLOCATION,
        };
      }
      
      this._isRemoteLoaded = true;
      this._lastFetch = Date.now();
      
      // // console.log('[FUXICO Config] Configuração remota carregada:', this.VERSION);
      return true;
      
    } catch (error) {
      // console.warn('[FUXICO Config] Erro ao carregar config remota, usando fallback:', error.message);
      return false;
    }
  },
  
  // Verificar se uma feature está habilitada
  isFeatureEnabled(feature) {
    return this.FEATURES[feature] === true;
  },
  
  // Obter URL completa de um endpoint
  getEndpointUrl(endpoint) {
    const path = this.ENDPOINTS[endpoint];
    if (!path) {
      // console.warn(`[FUXICO Config] Endpoint desconhecido: ${endpoint}`);
      return null;
    }
    return `${this.API_URL}${path}`;
  },
};

// Tentar carregar config remota na inicialização (não bloqueante)
if (typeof window !== 'undefined' || typeof self !== 'undefined') {
  // Executar em background após 1 segundo
  setTimeout(() => {
    FUXICO_CONFIG.loadRemoteConfig().catch(() => {});
  }, 1000);
}

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FUXICO_CONFIG;
}

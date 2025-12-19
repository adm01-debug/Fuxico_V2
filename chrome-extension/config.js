// FUXICO - Configuração Centralizada
// Este arquivo contém todas as configurações da extensão

const FUXICO_CONFIG = {
  // URLs do Backend (Supabase)
  SUPABASE_URL: 'https://npjfwzzapbtcguoupozd.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wamZ3enphaGJ0Y2d1b3Vwb3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTQ0NDAsImV4cCI6MjA1MDAzMDQ0MH0.pJzT9p_example_key',
  
  // Endpoints das Edge Functions
  get API_URL() {
    return `${this.SUPABASE_URL}/functions/v1`;
  },
  
  ENDPOINTS: {
    CREATE_TRACKING: '/create-tracking',
    TRACK_PIXEL: '/track-pixel',
    TRACK_LINK: '/track-link',
    GET_STATS: '/get-tracking-stats',
    REPORT_BOUNCE: '/report-bounce',
    LOG_EMAIL_ACTIVITY: '/log-email-activity',
  },
  
  // URL do Dashboard Web
  DASHBOARD_URL: 'https://fuxico.lovable.app',
  
  // Intervalos de verificação (em ms)
  INTERVALS: {
    POLL_OPENS: 30000,        // 30 segundos
    CHECK_COMPOSE: 1000,      // 1 segundo
    BOUNCE_CHECK: 30000,      // 30 segundos
    AUDIT_CHECK: 60000,       // 1 minuto
  },
  
  // Configurações de detecção
  DETECTION: {
    SELF_OPEN_THRESHOLD_MS: 2 * 60 * 1000, // 2 minutos
  },
  
  // Versão da extensão
  VERSION: '1.1.0',
};

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FUXICO_CONFIG;
}

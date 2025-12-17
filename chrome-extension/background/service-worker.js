// FUXICO - Background Service Worker

// Configuração
const CONFIG = {
  API_URL: 'https://npjfwzzapbtcguoupozd.supabase.co/functions/v1',
  POLL_INTERVAL: 30000, // 30 segundos
};

// Estado
let lastCheckTimestamp = null;

// Inicialização
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[FUXICO] Extensão instalada:', details.reason);
  
  // Configurar valores padrão
  chrome.storage.sync.set({
    trackingEnabled: true,
    notificationsEnabled: true,
    soundEnabled: false,
  });

  // Criar alarme para verificação periódica
  chrome.alarms.create('checkOpens', { periodInMinutes: 0.5 });
});

// Verificar aberturas periodicamente
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkOpens') {
    await checkForNewOpens();
  }
});

// Verificar novas aberturas
async function checkForNewOpens() {
  try {
    const settings = await chrome.storage.sync.get(['notificationsEnabled']);
    if (!settings.notificationsEnabled) return;

    // Buscar estatísticas do backend
    const response = await fetch(`${CONFIG.API_URL}/get-tracking-stats`);
    if (!response.ok) return;

    const data = await response.json();
    
    // Verificar se há novas aberturas desde última checagem
    if (data.emails && lastCheckTimestamp) {
      const newOpens = data.emails.filter(email => {
        // Lógica para detectar novas aberturas
        return email.opens > 0 && new Date(email.created_at) > new Date(lastCheckTimestamp);
      });

      // Notificar sobre novas aberturas
      for (const email of newOpens) {
        await showNotification(
          'Email Aberto!',
          `${email.recipient_email} abriu seu email`,
          email.tracking_id
        );
      }
    }

    lastCheckTimestamp = new Date().toISOString();
    
  } catch (error) {
    console.error('[FUXICO] Erro ao verificar aberturas:', error);
  }
}

// Mostrar notificação do sistema
async function showNotification(title, message, id) {
  try {
    await chrome.notifications.create(id || `fuxico-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      priority: 2,
      silent: false,
    });
  } catch (error) {
    console.error('[FUXICO] Erro ao criar notificação:', error);
  }
}

// Escutar cliques em notificações
chrome.notifications.onClicked.addListener((notificationId) => {
  // Abrir dashboard do FUXICO
  chrome.tabs.create({
    url: 'https://your-app-url.lovable.app/' // Atualize com sua URL
  });
});

// Escutar mensagens do content script ou popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[FUXICO] Mensagem recebida:', request);

  if (request.action === 'showNotification') {
    showNotification(request.title, request.message, request.id);
    sendResponse({ success: true });
  }

  if (request.action === 'trackEmail') {
    // Registrar email no backend
    trackEmail(request.data).then(result => {
      sendResponse(result);
    });
    return true; // Indica resposta assíncrona
  }

  if (request.action === 'getStats') {
    getStats().then(stats => {
      sendResponse(stats);
    });
    return true;
  }

  return true;
});

// Registrar email para tracking
async function trackEmail(data) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/create-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[FUXICO] Erro ao registrar tracking:', error);
    return { success: false, error: error.message };
  }
}

// Obter estatísticas
async function getStats() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/get-tracking-stats`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[FUXICO] Erro ao obter stats:', error);
    return { emails: [], total: 0 };
  }
}

console.log('[FUXICO] Service Worker iniciado');

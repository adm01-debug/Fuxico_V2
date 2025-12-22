// FUXICO - Background Service Worker
// Versão 1.1.0 - Com gestão de autenticação

// Importar configuração
importScripts('../config.js');

// Usar config ou fallback
const CONFIG = typeof FUXICO_CONFIG !== 'undefined' ? FUXICO_CONFIG : {
  SUPABASE_URL: 'https://npjfwzzapbtcguoupozd.supabase.co',
  get API_URL() { return `${this.SUPABASE_URL}/functions/v1`; },
  INTERVALS: { POLL_OPENS: 30000 },
  VERSION: '1.1.0',
};

// ============================================
// ESTADO
// ============================================

let authToken = null;
let currentUser = null;
let lastCheckTimestamp = null;

// ============================================
// INICIALIZAÇÃO
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
  
  
  // Configurar valores padrão
  chrome.storage.sync.set({
    trackingEnabled: true,
    notificationsEnabled: true,
    soundEnabled: false,
  });

  // Criar alarme para verificação periódica
  chrome.alarms.create('checkOpens', { periodInMinutes: 0.5 });
  chrome.alarms.create('refreshToken', { periodInMinutes: 30 }); // Refresh a cada 30 min
});

// Carregar token na inicialização
chrome.storage.sync.get(['authToken', 'user'], (result) => {
  if (result.authToken) {
    authToken = result.authToken;
    currentUser = result.user;
    
  }
});

// ============================================
// ALARMES
// ============================================

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkOpens') {
    await checkForNewOpens();
  }
  if (alarm.name === 'refreshToken') {
    await refreshAuthToken();
  }
});

// ============================================
// AUTENTICAÇÃO
// ============================================

async function refreshAuthToken() {
  try {
    const result = await chrome.storage.sync.get(['refreshToken', 'tokenExpiry']);
    
    if (!result.refreshToken) {
      
      return;
    }
    
    // Verificar se token está próximo de expirar (menos de 10 min)
    if (result.tokenExpiry) {
      const expiry = new Date(result.tokenExpiry);
      const now = new Date();
      const diffMinutes = (expiry - now) / 60000;
      
      if (diffMinutes > 10) {
        , 'minutos');
        return;
      }
    }
    
    
    
    const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        refresh_token: result.refreshToken,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + (data.expires_in || 3600));
      
      await chrome.storage.sync.set({
        authToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiry: expiry.toISOString(),
      });
      
      authToken = data.access_token;
      
      // Notificar content scripts
      broadcastAuthUpdate();
      
      
    } else {
      
      // Token inválido, limpar sessão
      await clearAuth();
    }
  } catch (error) {
    
  }
}

async function clearAuth() {
  authToken = null;
  currentUser = null;
  await chrome.storage.sync.remove(['authToken', 'refreshToken', 'user', 'tokenExpiry']);
  broadcastAuthUpdate();
}

function broadcastAuthUpdate() {
  // Notificar todas as tabs do Gmail
  chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'setAuthToken',
        token: authToken,
      }).catch(() => {});
    });
  });
}

// ============================================
// VERIFICAÇÃO DE ABERTURAS
// ============================================

async function checkForNewOpens() {
  try {
    // Verificar se temos autenticação
    if (!authToken) {
      const result = await chrome.storage.sync.get(['authToken']);
      if (result.authToken) {
        authToken = result.authToken;
      } else {
        
        return;
      }
    }
    
    const settings = await chrome.storage.sync.get(['notificationsEnabled']);
    if (!settings.notificationsEnabled) return;

    // Buscar estatísticas do backend COM autenticação
    const response = await fetch(`${CONFIG.API_URL}/get-tracking-stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      // Token expirado, tentar renovar
      await refreshAuthToken();
      return;
    }
    
    if (!response.ok) return;

    const data = await response.json();
    
    // Verificar se há novas aberturas desde última checagem
    if (data.emails && lastCheckTimestamp) {
      for (const email of data.emails) {
        // Verificar aberturas recentes
        if (email.opens > 0) {
          const lastCheck = new Date(lastCheckTimestamp);
          // Lógica para detectar novas aberturas baseada em eventos
          // Por enquanto, só notificamos emails com aberturas > 0 que são recentes
          const emailDate = new Date(email.created_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
          if (emailDate > fiveMinutesAgo && !email._notified) {
            await showNotification(
              '📬 Email Aberto!',
              `${email.recipient_email} abriu seu email`,
              email.tracking_id
            );
          }
        }
      }
    }

    lastCheckTimestamp = new Date().toISOString();
    
  } catch (error) {
    
  }
}

// ============================================
// NOTIFICAÇÕES
// ============================================

async function showNotification(title, message, id) {
  try {
    const settings = await chrome.storage.sync.get(['soundEnabled']);
    
    await chrome.notifications.create(id || `fuxico-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      priority: 2,
      silent: !settings.soundEnabled,
    });
  } catch (error) {
    
  }
}

// Clique em notificação abre o dashboard
chrome.notifications.onClicked.addListener((notificationId) => {
  const dashboardUrl = CONFIG.DASHBOARD_URL || 'https://fuxico.lovable.app';
  chrome.tabs.create({ url: dashboardUrl });
});

// ============================================
// MENSAGENS
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  

  // Auth state changed (do popup)
  if (request.action === 'authStateChanged') {
    authToken = request.token;
    currentUser = request.user;
    
    if (request.isAuthenticated) {
      
    } else {
      
    }
    
    // Notificar content scripts
    broadcastAuthUpdate();
    
    sendResponse({ success: true });
    return true;
  }

  // Mostrar notificação
  if (request.action === 'showNotification') {
    showNotification(request.title, request.message, request.id);
    sendResponse({ success: true });
    return true;
  }

  // Registrar email para tracking (do content script)
  if (request.action === 'trackEmail') {
    trackEmail(request.data).then(result => {
      sendResponse(result);
    });
    return true; // Indica resposta assíncrona
  }

  // Obter estatísticas
  if (request.action === 'getStats') {
    getStats().then(stats => {
      sendResponse(stats);
    });
    return true;
  }

  // Obter token atual
  if (request.action === 'getAuthToken') {
    sendResponse({ token: authToken, user: currentUser });
    return true;
  }

  return true;
});

// ============================================
// API CALLS
// ============================================

async function trackEmail(data) {
  try {
    if (!authToken) {
      return { success: false, error: 'Não autenticado' };
    }
    
    const response = await fetch(`${CONFIG.API_URL}/create-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      await refreshAuthToken();
      return { success: false, error: 'Token expirado, tente novamente' };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    
    return { success: false, error: error.message };
  }
}

async function getStats() {
  try {
    if (!authToken) {
      return { emails: [], total: 0, error: 'Não autenticado' };
    }
    
    const response = await fetch(`${CONFIG.API_URL}/get-tracking-stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      await refreshAuthToken();
      return { emails: [], total: 0, error: 'Token expirado' };
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    
    return { emails: [], total: 0 };
  }
}



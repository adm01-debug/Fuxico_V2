// FUXICO - Background Service Worker
// Versão 1.2.0 - Compatível com classic worker (não module)

// Importar configuração centralizada
importScripts('../config.js');

// Usar config ou fallback
const CONFIG = typeof FUXICO_CONFIG !== 'undefined' ? FUXICO_CONFIG : {
  SUPABASE_URL: 'https://npjfwzzapbtcguoupozd.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wamZ3enphcGJ0Y2d1b3Vwb3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzMzNjUsImV4cCI6MjA4MTU0OTM2NX0.YXA4kIY0eJl2Z3jeIw6yTB-KDjWwHLlftjOz6qVkoEw',
  DASHBOARD_URL: 'https://fuxico.lovable.app',
  get API_URL() { return `${this.SUPABASE_URL}/functions/v1`; },
  INTERVALS: { POLL_OPENS: 30000 },
  VERSION: '1.2.0',
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
  chrome.storage.sync.set({
    trackingEnabled: true,
    notificationsEnabled: true,
    soundEnabled: false,
  });

  chrome.alarms.create('checkOpens', { periodInMinutes: 0.5 });
  chrome.alarms.create('refreshToken', { periodInMinutes: 30 });
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
        return; // Token ainda válido
      }
    }
    
    const anonKey = CONFIG.SUPABASE_ANON_KEY || '';
    
    const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
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
    console.error('[FUXICO SW] Erro ao refresh token:', error);
  }
}

async function clearAuth() {
  authToken = null;
  currentUser = null;
  await chrome.storage.sync.remove(['authToken', 'refreshToken', 'user', 'tokenExpiry']);
  broadcastAuthUpdate();
}

function broadcastAuthUpdate() {
  chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
    if (!tabs) return;
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
    if (!authToken) {
      const result = await chrome.storage.sync.get(['authToken']);
      if (result.authToken) {
        authToken = result.authToken;
      } else {
        return;
      }
    }
    
    const settings = await chrome.storage.sync.get(['notificationsEnabled']);
    if (settings.notificationsEnabled === false) return;

    const response = await fetch(`${CONFIG.API_URL}/get-tracking-stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      await refreshAuthToken();
      return;
    }
    
    if (!response.ok) return;

    const data = await response.json();
    const emails = Array.isArray(data.emails) ? data.emails : [];
    
    if (emails.length > 0 && lastCheckTimestamp) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      for (const email of emails) {
        if (email.opens > 0) {
          const emailDate = new Date(email.created_at);
          
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
    console.error('[FUXICO SW] Erro ao verificar aberturas:', error);
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
    console.error('[FUXICO SW] Erro ao mostrar notificação:', error);
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
    broadcastAuthUpdate();
    sendResponse({ success: true });
    return true;
  }

  // Refresh token (do content script)
  if (request.action === 'refreshToken') {
    refreshAuthToken().then(() => {
      sendResponse({ success: true });
    }).catch(() => {
      sendResponse({ success: false });
    });
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
    return true;
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
    console.error('[FUXICO SW] Erro ao rastrear email:', error);
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
    console.error('[FUXICO SW] Erro ao buscar stats:', error);
    return { emails: [], total: 0 };
  }
}

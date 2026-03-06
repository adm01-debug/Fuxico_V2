// FUXICO - Gmail Content Script
// Versão 1.3.0 - Com config centralizada e indicadores visuais na inbox

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO (usa config.js via FUXICO_CONFIG ou fallback)
  // ============================================
  
  const CONFIG = typeof FUXICO_CONFIG !== 'undefined' ? {
    SUPABASE_URL: FUXICO_CONFIG.SUPABASE_URL,
    get API_URL() { return `${this.SUPABASE_URL}/functions/v1`; },
    ENDPOINTS: FUXICO_CONFIG.ENDPOINTS,
    INTERVALS: FUXICO_CONFIG.INTERVALS,
    FEATURES: FUXICO_CONFIG.FEATURES,
  } : {
    SUPABASE_URL: 'https://npjfwzzapbtcguoupozd.supabase.co',
    get API_URL() { return `${this.SUPABASE_URL}/functions/v1`; },
    ENDPOINTS: {
      CREATE_TRACKING: '/create-tracking',
      TRACK_PIXEL: '/track-pixel',
      REPORT_BOUNCE: '/report-bounce',
      LOG_EMAIL_ACTIVITY: '/log-email-activity',
      GET_STATS: '/get-tracking-stats',
    },
    INTERVALS: {
      CHECK_COMPOSE: 1000,
      BOUNCE_CHECK: 30000,
      AUDIT_CHECK: 60000,
      INBOX_INDICATORS: 15000,
      STATS_CACHE: 60000,
    },
    FEATURES: {
      EMAIL_TRACKING: true,
      BOUNCE_DETECTION: true,
    },
  };

  // ============================================
  // ESTADO GLOBAL
  // ============================================
  
  let isTrackingEnabled = true;
  let observedComposeWindows = new Set();
  let processedEmails = new Set();
  let authToken = null;
  let isAuthenticated = false;
  let emailStatsCache = new Map();
  let lastStatsFetch = 0;

  // ============================================
  // UTILITÁRIOS
  // ============================================
  
  const log = (msg, ...args) => console.log(`[FUXICO] ${msg}`, ...args);
  const error = (msg, ...args) => console.error(`[FUXICO] ${msg}`, ...args);

  // ============================================
  // AUTENTICAÇÃO
  // ============================================
  
  async function loadAuthToken() {
    try {
      const result = await chrome.storage.sync.get(['authToken', 'tokenExpiry']);
      
      if (result.authToken) {
        if (result.tokenExpiry) {
          const expiry = new Date(result.tokenExpiry);
          if (expiry > new Date()) {
            authToken = result.authToken;
            isAuthenticated = true;
            log('Token válido carregado');
            return true;
          } else {
            log('Token expirado, solicitando refresh...');
            // Request token refresh from service worker
            try {
              await chrome.runtime.sendMessage({ action: 'refreshToken' });
              // Re-check after refresh attempt
              const refreshed = await chrome.storage.sync.get(['authToken', 'tokenExpiry']);
              if (refreshed.authToken && new Date(refreshed.tokenExpiry) > new Date()) {
                authToken = refreshed.authToken;
                isAuthenticated = true;
                return true;
              }
            } catch (e) {
              // Service worker may not be ready
            }
          }
        } else {
          authToken = result.authToken;
          isAuthenticated = true;
          return true;
        }
      }
      
      isAuthenticated = false;
      return false;
    } catch (e) {
      error('Erro ao carregar token:', e);
      return false;
    }
  }

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['trackingEnabled']);
      isTrackingEnabled = result.trackingEnabled !== false;
      log('Tracking:', isTrackingEnabled ? 'ON' : 'OFF', '| Auth:', isAuthenticated ? 'YES' : 'NO');
    } catch (e) {
      error('Erro ao carregar configurações:', e);
    }
  }

  // ============================================
  // CACHE DE ESTATÍSTICAS
  // ============================================

  async function fetchEmailStats() {
    if (!isAuthenticated || !authToken) return null;
    
    const now = Date.now();
    const cacheInterval = CONFIG.INTERVALS?.STATS_CACHE || 60000;
    if (now - lastStatsFetch < cacheInterval && emailStatsCache.size > 0) {
      return emailStatsCache;
    }

    try {
      const endpoint = CONFIG.ENDPOINTS?.GET_STATS || '/get-tracking-stats';
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        emailStatsCache.clear();
        
        // Index by recipient email and subject for matching
        const emails = Array.isArray(data.emails) ? data.emails : [];
        emails.forEach(email => {
          if (!email.recipient_email) return;
          
          const key = `${email.recipient_email}|${email.subject || ''}`.toLowerCase();
          emailStatsCache.set(key, {
            trackingId: email.tracking_id,
            opens: email.opens || 0,
            clicks: email.clicks || 0,
            selfOpens: email.selfOpens || 0,
            createdAt: email.created_at,
            recipientEmail: email.recipient_email,
            subject: email.subject,
          });
          
          // Also index by just recipient email for fuzzy matching
          const emailKey = email.recipient_email.toLowerCase();
          if (!emailStatsCache.has(emailKey)) {
            emailStatsCache.set(emailKey, {
              trackingId: email.tracking_id,
              opens: email.opens || 0,
              clicks: email.clicks || 0,
              selfOpens: email.selfOpens || 0,
              createdAt: email.created_at,
              recipientEmail: email.recipient_email,
              subject: email.subject,
            });
          }
        });
        
        lastStatsFetch = now;
        log(`Stats cache atualizado: ${emailStatsCache.size} entradas`);
        return emailStatsCache;
      } else if (response.status === 401) {
        isAuthenticated = false;
        authToken = null;
        log('Token inválido (401), desconectado');
      }
    } catch (e) {
      error('Erro ao buscar stats:', e);
    }
    
    return null;
  }

  // ============================================
  // INDICADORES NA INBOX
  // ============================================

  function createIndicatorElement(stats) {
    const container = document.createElement('div');
    container.className = 'fuxico-inbox-indicator';
    
    const hasOpens = stats.opens > 0;
    const hasClicks = stats.clicks > 0;
    
    if (!hasOpens && !hasClicks) {
      container.innerHTML = `
        <div class="fuxico-indicator fuxico-indicator-pending" title="Aguardando leitura">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
      `;
    } else {
      const openText = stats.opens === 1 ? '1 abertura' : `${stats.opens} aberturas`;
      const clickText = stats.clicks > 0 ? ` • ${stats.clicks} clique${stats.clicks > 1 ? 's' : ''}` : '';
      const tooltip = `${openText}${clickText}`;
      
      container.innerHTML = `
        <div class="fuxico-indicator fuxico-indicator-opened" title="${tooltip}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          ${stats.opens > 1 ? `<span class="fuxico-indicator-badge">${stats.opens}</span>` : ''}
        </div>
        ${hasClicks ? `
          <div class="fuxico-indicator fuxico-indicator-clicked" title="${stats.clicks} clique${stats.clicks > 1 ? 's' : ''}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 15l-2 5L9 9l11 4-5 2z"/>
              <path d="M22 22l-5-5"/>
            </svg>
          </div>
        ` : ''}
      `;
    }
    
    return container;
  }

  function extractEmailFromRow(row) {
    const selectors = [
      '.yP [email]',
      '.yW [email]', 
      '[data-hovercard-id]',
      '.bA4 [email]',
    ];
    
    for (const selector of selectors) {
      const element = row.querySelector(selector);
      if (element) {
        const email = element.getAttribute('email') || element.getAttribute('data-hovercard-id');
        if (email && email.includes('@')) {
          return email.toLowerCase();
        }
      }
    }
    
    return null;
  }

  function extractSubjectFromRow(row) {
    const subjectEl = row.querySelector('.y6 .bog, .bqe, [data-thread-subject]');
    return subjectEl?.textContent?.trim()?.toLowerCase() || '';
  }

  async function updateInboxIndicators() {
    if (!isAuthenticated) return;
    
    const stats = await fetchEmailStats();
    if (!stats || stats.size === 0) return;

    const emailRows = document.querySelectorAll('tr.zA');
    
    emailRows.forEach(row => {
      if (row.querySelector('.fuxico-inbox-indicator')) return;
      
      const recipientEmail = extractEmailFromRow(row);
      const subject = extractSubjectFromRow(row);
      
      if (!recipientEmail) return;
      
      const exactKey = `${recipientEmail}|${subject}`;
      let emailStats = stats.get(exactKey);
      
      if (!emailStats) {
        emailStats = stats.get(recipientEmail);
      }
      
      if (emailStats) {
        const indicator = createIndicatorElement(emailStats);
        const subjectCell = row.querySelector('.xT, .y6');
        if (subjectCell) {
          subjectCell.style.position = 'relative';
          subjectCell.insertBefore(indicator, subjectCell.firstChild);
        }
      }
    });
  }

  function startInboxIndicators() {
    setTimeout(updateInboxIndicators, 2000);
    
    const indicatorInterval = CONFIG.INTERVALS?.INBOX_INDICATORS || 15000;
    setInterval(updateInboxIndicators, indicatorInterval);
    
    let lastHash = window.location.hash;
    setInterval(() => {
      if (window.location.hash !== lastHash) {
        lastHash = window.location.hash;
        setTimeout(updateInboxIndicators, 1000);
      }
    }, 500);
    
    const observer = new MutationObserver((mutations) => {
      const hasNewRows = mutations.some(m => 
        m.addedNodes.length > 0 && 
        Array.from(m.addedNodes).some(n => n.nodeName === 'TR')
      );
      if (hasNewRows) {
        setTimeout(updateInboxIndicators, 500);
      }
    });
    
    const emailList = document.querySelector('[role="main"]');
    if (emailList) {
      observer.observe(emailList, { childList: true, subtree: true });
    }
    
    log('Indicadores de inbox iniciados');
  }

  // ============================================
  // FUNÇÕES DE TRACKING
  // ============================================
  
  function generateTrackingId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function createPixelHTML(trackingId) {
    const endpoint = CONFIG.ENDPOINTS?.TRACK_PIXEL || '/track-pixel';
    const pixelUrl = `${CONFIG.API_URL}${endpoint}?t=${trackingId}`;
    return `<img src="${pixelUrl}" width="1" height="1" style="display:none;opacity:0;width:1px;height:1px;" alt="" data-fuxico-pixel="true">`; 
  }

  function extractRecipients(composeWindow) {
    const recipients = [];
    
    const toFields = composeWindow.querySelectorAll('[email], [data-hovercard-id]');
    toFields.forEach(field => {
      const email = field.getAttribute('email') || field.getAttribute('data-hovercard-id');
      if (email && email.includes('@')) {
        recipients.push(email);
      }
    });

    if (recipients.length === 0) {
      const toContainer = composeWindow.querySelector('[name="to"]');
      if (toContainer) {
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        const matches = toContainer.value?.match(emailRegex) || [];
        recipients.push(...matches);
      }
    }

    return [...new Set(recipients)];
  }

  function extractSubject(composeWindow) {
    const subjectInput = composeWindow.querySelector('[name="subjectbox"]');
    return subjectInput?.value || '';
  }

  // ============================================
  // INJEÇÃO DE PIXEL
  // ============================================
  
  async function injectPixelBeforeSend(composeWindow) {
    if (!isAuthenticated || !authToken) {
      log('Não autenticado, mostrando aviso...');
      showNotification('⚠️ Login Necessário', 'Clique no ícone FUXICO para fazer login');
      return;
    }
    
    if (!isTrackingEnabled) {
      log('Tracking desabilitado');
      return;
    }

    const recipients = extractRecipients(composeWindow);
    const subject = extractSubject(composeWindow);

    if (recipients.length === 0) {
      log('Nenhum destinatário encontrado');
      return;
    }

    const trackingId = generateTrackingId();
    const pixelHTML = createPixelHTML(trackingId);

    const bodyDiv = composeWindow.querySelector(
      '[role="textbox"][aria-label*="Message"], ' +
      '[role="textbox"][aria-label*="Corpo"], ' +
      '[role="textbox"][aria-label*="message"], ' +
      '[contenteditable="true"][g_editable="true"]'
    );
    
    if (bodyDiv) {
      const pixelContainer = document.createElement('div');
      pixelContainer.innerHTML = pixelHTML;
      pixelContainer.style.cssText = 'font-size:1px;line-height:1px;height:1px;overflow:hidden;';
      bodyDiv.appendChild(pixelContainer);

      log(`Pixel injetado! TrackingID: ${trackingId}`);

      try {
        const endpoint = CONFIG.ENDPOINTS?.CREATE_TRACKING || '/create-tracking';
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            recipientEmail: recipients[0],
            subject: subject,
            metadata: {
              allRecipients: recipients,
              source: 'chrome-extension',
              timestamp: new Date().toISOString(),
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          log('Tracking registrado:', data.trackingId);
          showNotification('✅ FUXICO Ativado', `Email para ${recipients[0]} será rastreado`);
          lastStatsFetch = 0;
        } else if (response.status === 401) {
          error('Token expirado');
          showNotification('⚠️ Sessão Expirada', 'Faça login novamente na extensão');
          isAuthenticated = false;
          authToken = null;
        } else {
          const errData = await response.text().catch(() => '');
          error('Erro ao registrar tracking:', response.status, errData);
          showNotification('❌ Erro', 'Não foi possível registrar o rastreamento');
        }
      } catch (e) {
        error('Erro de rede:', e);
        showNotification('❌ Erro de Rede', 'Verifique sua conexão');
      }
    } else {
      error('Corpo do email não encontrado');
    }
  }

  // ============================================
  // NOTIFICAÇÕES
  // ============================================
  
  function showNotification(title, message) {
    const existing = document.querySelector('.fuxico-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'fuxico-toast';
    toast.innerHTML = `
      <div class="fuxico-toast-icon">📧</div>
      <div class="fuxico-toast-content">
        <div class="fuxico-toast-title">${escapeHtml(title)}</div>
        <div class="fuxico-toast-message">${escapeHtml(message)}</div>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // UI DO GMAIL
  // ============================================
  
  function addTrackingToggle(composeWindow) {
    if (composeWindow.querySelector('.fuxico-toggle')) return;

    const toolbar = composeWindow.querySelector('[role="toolbar"]');
    if (!toolbar) return;

    const authIndicator = isAuthenticated ? '🟢' : '🔴';
    const authTitle = isAuthenticated ? 'Conectado' : 'Não conectado - clique no ícone FUXICO';
    
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'fuxico-toggle';
    toggleContainer.innerHTML = `
      <button class="fuxico-toggle-btn ${isTrackingEnabled ? 'active' : ''}" title="${authTitle}">
        <span class="fuxico-toggle-icon">📍</span>
        <span class="fuxico-toggle-text">FUXICO</span>
        <span class="fuxico-auth-indicator" title="${authTitle}">${authIndicator}</span>
      </button>
    `;

    const btn = toggleContainer.querySelector('.fuxico-toggle-btn');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isAuthenticated) {
        showNotification('🔐 Login Necessário', 'Clique no ícone FUXICO no navegador para fazer login');
        return;
      }
      
      isTrackingEnabled = !isTrackingEnabled;
      btn.classList.toggle('active', isTrackingEnabled);
      
      chrome.storage.sync.set({ trackingEnabled: isTrackingEnabled });
      
      showNotification(
        isTrackingEnabled ? '✅ Tracking Ativado' : '⏸️ Tracking Pausado',
        isTrackingEnabled ? 'Emails serão rastreados' : 'Emails não serão rastreados'
      );
    });

    toolbar.parentNode.insertBefore(toggleContainer, toolbar.nextSibling);
    log('Toggle adicionado');
  }

  function interceptSendButton(composeWindow) {
    const composeId = composeWindow.dataset.fuxicoId;
    if (!composeId) {
      composeWindow.dataset.fuxicoId = generateTrackingId().slice(0, 8);
    }

    // Support multiple Gmail languages
    const sendButton = composeWindow.querySelector(
      '[data-tooltip*="Send"], [aria-label*="Send"], [aria-label*="Enviar"], ' +
      '[data-tooltip*="Enviar"], [aria-label*="Senden"], [aria-label*="Envoyer"]'
    );
    
    if (sendButton && !sendButton.dataset.fuxicoIntercepted) {
      sendButton.dataset.fuxicoIntercepted = 'true';

      sendButton.addEventListener('mousedown', async (e) => {
        if (isTrackingEnabled && isAuthenticated) {
          await injectPixelBeforeSend(composeWindow);
        }
      }, true);

      composeWindow.addEventListener('keydown', async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          if (isTrackingEnabled && isAuthenticated) {
            await injectPixelBeforeSend(composeWindow);
          }
        }
      }, true);

      log('Botão de enviar interceptado');
    }
  }

  // ============================================
  // OBSERVAÇÃO DE COMPOSE
  // ============================================
  
  function observeComposeWindows() {
    const composeSelector = '[role="dialog"], .nH.Hd[role="main"]';
    
    const checkForCompose = () => {
      const composeWindows = document.querySelectorAll(composeSelector);
      
      composeWindows.forEach(win => {
        const hasMessageField = win.querySelector(
          '[role="textbox"][aria-label*="Message"], ' +
          '[role="textbox"][aria-label*="Corpo"], ' +
          '[role="textbox"][aria-label*="message"], ' +
          '[contenteditable="true"][g_editable="true"]'
        );
        
        if (hasMessageField && !observedComposeWindows.has(win)) {
          observedComposeWindows.add(win);
          log('Nova janela de compose detectada');
          
          addTrackingToggle(win);
          interceptSendButton(win);
        }
      });

      // Cleanup removed compose windows
      observedComposeWindows.forEach(win => {
        if (!document.contains(win)) {
          observedComposeWindows.delete(win);
        }
      });
    };

    const checkInterval = CONFIG.INTERVALS?.CHECK_COMPOSE || 1000;
    setInterval(checkForCompose, checkInterval);

    const observer = new MutationObserver(() => checkForCompose());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ============================================
  // DETECÇÃO DE BOUNCE
  // ============================================
  
  const BOUNCE_SENDERS = ['mailer-daemon', 'postmaster', 'mail-daemon', 'delivery status', 'undeliverable'];
  const BOUNCE_SUBJECTS = ['undeliverable', 'delivery status', 'delivery failure', 'returned mail', 'falha na entrega', 'não entregue'];

  async function checkForBounceEmails() {
    if (!isAuthenticated) return;
    
    try {
      const emailRows = document.querySelectorAll('tr.zA');
      
      for (const row of emailRows) {
        if (row.dataset.fuxicoBounceChecked) continue;
        row.dataset.fuxicoBounceChecked = 'true';
        
        const senderElement = row.querySelector('.yW .bA4 [email], .yW .yP [email]');
        const subjectElement = row.querySelector('.y6 .bog');
        
        if (!senderElement || !subjectElement) continue;
        
        const senderEmail = (senderElement.getAttribute('email') || '').toLowerCase();
        const subject = (subjectElement.textContent || '').toLowerCase();
        
        const isBounce = BOUNCE_SENDERS.some(s => senderEmail.includes(s)) || 
                         BOUNCE_SUBJECTS.some(s => subject.includes(s));
        
        if (isBounce) {
          log('Bounce detectado:', subject);
          const bouncedEmail = extractBouncedEmailAddress(row);
          if (bouncedEmail) {
            await reportBounce(bouncedEmail, subject);
          }
        }
      }
    } catch (e) {
      error('Erro ao verificar bounces:', e);
    }
  }

  function extractBouncedEmailAddress(row) {
    const snippetElement = row.querySelector('.y2');
    if (snippetElement) {
      const snippet = snippetElement.textContent || '';
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const matches = snippet.match(emailRegex);
      if (matches && matches.length > 0) {
        const userEmails = matches.filter(email => 
          !BOUNCE_SENDERS.some(s => email.toLowerCase().includes(s))
        );
        if (userEmails.length > 0) return userEmails[0];
      }
    }
    return null;
  }

  async function reportBounce(recipientEmail, bounceSubject) {
    try {
      const bounceType = bounceSubject.includes('permanent') || bounceSubject.includes('failed') ? 'hard' : 'soft';
      const endpoint = CONFIG.ENDPOINTS?.REPORT_BOUNCE || '/report-bounce';
      
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          bounce_type: bounceType,
          bounce_reason: bounceSubject
        }),
      });

      if (response.ok) {
        log('Bounce reportado:', recipientEmail);
        showNotification('📭 Bounce Detectado', `Email para ${recipientEmail} não foi entregue`);
      }
    } catch (e) {
      error('Erro ao reportar bounce:', e);
    }
  }

  function startBounceDetection() {
    const bounceEnabled = CONFIG.FEATURES?.BOUNCE_DETECTION !== false;
    if (!bounceEnabled) {
      log('Detecção de bounce desabilitada');
      return;
    }
    
    checkForBounceEmails();
    const bounceInterval = CONFIG.INTERVALS?.BOUNCE_CHECK || 30000;
    setInterval(checkForBounceEmails, bounceInterval);
    log('Detecção de bounce iniciada');
  }

  // ============================================
  // MENSAGENS DO POPUP/BACKGROUND
  // ============================================
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleTracking') {
      isTrackingEnabled = request.enabled;
      log('Tracking alterado:', isTrackingEnabled ? 'ON' : 'OFF');
      sendResponse({ success: true });
    }
    
    if (request.action === 'setAuthToken') {
      authToken = request.token;
      isAuthenticated = !!request.token;
      log('Token atualizado, autenticado:', isAuthenticated);
      
      // Atualizar toggles existentes
      document.querySelectorAll('.fuxico-auth-indicator').forEach(el => {
        el.textContent = isAuthenticated ? '🟢' : '🔴';
      });
      
      // Refresh inbox indicators
      if (isAuthenticated) {
        lastStatsFetch = 0;
        updateInboxIndicators();
      }
      
      sendResponse({ success: true });
    }
    
    if (request.action === 'getStatus') {
      sendResponse({ 
        trackingEnabled: isTrackingEnabled,
        composeWindowsCount: observedComposeWindows.size,
        isAuthenticated: isAuthenticated,
        cachedEmails: emailStatsCache.size
      });
    }
    
    if (request.action === 'refreshStats') {
      lastStatsFetch = 0;
      updateInboxIndicators();
      sendResponse({ success: true });
    }
    
    return true;
  });

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  async function init() {
    log('Iniciando FUXICO v1.3.0...');
    
    await new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve);
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await loadAuthToken();
    await loadSettings();

    observeComposeWindows();
    startBounceDetection();
    startInboxIndicators();

    log('FUXICO inicializado!', isAuthenticated ? '(Autenticado)' : '(Não autenticado)');
    
    if (!isAuthenticated) {
      showNotification('🔐 FUXICO', 'Clique no ícone da extensão para fazer login');
    }
  }

  init();

})();

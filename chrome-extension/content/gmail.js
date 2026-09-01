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
      GET_DETAIL: '/get-tracking-detail',
      CREATE_REMINDER: '/create-reminder',
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

  const DASHBOARD_URL = (typeof FUXICO_CONFIG !== 'undefined' && FUXICO_CONFIG.DASHBOARD_URL)
    || 'https://fuxico.lovable.app';

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

  // Preferências (Mailtrack-like)
  let showMarkers = true;
  let hideSelfOpens = true;
  let signatureEnabled = false;
  let reminderDays = 3;

  // Cache curto do detalhe por trackingId
  const detailCache = new Map(); // trackingId -> { at, data }
  const DETAIL_TTL = 30000;


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
      const result = await chrome.storage.sync.get([
        'trackingEnabled',
        'showMarkers',
        'hideSelfOpens',
        'signatureEnabled',
        'reminderDays',
      ]);
      isTrackingEnabled = result.trackingEnabled !== false;
      showMarkers = result.showMarkers !== false;
      hideSelfOpens = result.hideSelfOpens !== false;
      signatureEnabled = result.signatureEnabled === true;
      reminderDays = Number(result.reminderDays) > 0 ? Number(result.reminderDays) : 3;
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

          // A RPC `get_emails_with_stats` retorna open_count/click_count.
          // Mantemos fallback para nomes antigos por compatibilidade.
          const entry = {
            trackingId: email.tracking_id,
            opens: Number(email.open_count ?? email.opens ?? 0),
            uniqueOpens: Number(email.unique_opens ?? email.open_count ?? 0),
            clicks: Number(email.total_link_clicks ?? email.click_count ?? email.clicks ?? 0),
            selfOpens: Number(email.self_opens ?? email.selfOpens ?? 0),
            lastOpenedAt: email.last_opened_at || null,
            createdAt: email.created_at,
            recipientEmail: email.recipient_email,
            subject: email.subject,
          };

          const key = `${email.recipient_email}|${email.subject || ''}`.toLowerCase();
          emailStatsCache.set(key, entry);

          // Also index by just recipient email for fuzzy matching
          const emailKey = email.recipient_email.toLowerCase();
          if (!emailStatsCache.has(emailKey)) {
            emailStatsCache.set(emailKey, entry);
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
  // MARCADORES ✓✓ (INBOX / ENVIADOS / THREAD)
  // ============================================

  const CHECK_SINGLE_SVG = `
    <svg class="fuxico-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 12.5 9 17.5 20 6.5"/>
    </svg>`;

  const CHECK_DOUBLE_SVG = `
    <svg class="fuxico-check" width="20" height="16" viewBox="0 0 30 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 12.5 7 17.5 18 6.5"/>
      <path d="M11 12.5 16 17.5 27 6.5"/>
    </svg>`;

  /** Aberturas visíveis no marcador — ignora auto-aberturas quando configurado. */
  function visibleOpens(stats) {
    const total = Number(stats.opens || 0);
    if (!hideSelfOpens) return total;
    return Math.max(0, total - Number(stats.selfOpens || 0));
  }

  function markerTooltip(stats) {
    const opens = visibleOpens(stats);
    if (opens <= 0) return 'FUXICO • Enviado, ainda não lido';
    const openText = opens === 1 ? 'Aberto 1 vez' : `Aberto ${opens} vezes`;
    const clickText = stats.clicks > 0
      ? ` • ${stats.clicks} clique${stats.clicks > 1 ? 's' : ''}`
      : '';
    return `FUXICO • ${openText}${clickText} — clique para ver o histórico`;
  }

  function createIndicatorElement(stats) {
    const container = document.createElement('div');
    container.className = 'fuxico-inbox-indicator';
    container.dataset.fuxicoTracking = stats.trackingId || '';

    const opens = visibleOpens(stats);
    const isRead = opens > 0;
    const tooltip = markerTooltip(stats);

    container.innerHTML = `
      <button type="button"
              class="fuxico-marker ${isRead ? 'fuxico-marker-read' : 'fuxico-marker-sent'}"
              aria-label="${escapeHtml(tooltip)}"
              title="${escapeHtml(tooltip)}">
        ${isRead ? CHECK_DOUBLE_SVG : CHECK_SINGLE_SVG}
        ${opens > 1 ? `<span class="fuxico-marker-badge">${opens > 99 ? '99+' : opens}</span>` : ''}
      </button>
      ${stats.clicks > 0 ? `
        <span class="fuxico-marker fuxico-marker-click"
              title="${stats.clicks} clique${stats.clicks > 1 ? 's' : ''} em links">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 15l-2 5L9 9l11 4-5 2z"/>
            <path d="M22 22l-5-5"/>
          </svg>
        </span>` : ''}
    `;

    const btn = container.querySelector('.fuxico-marker-read, .fuxico-marker-sent');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openHistoryPopover(btn, stats);
    });

    return container;
  }

  // ============================================
  // POPOVER — HISTÓRICO COMPLETO DE RASTREAMENTO
  // ============================================

  function closeHistoryPopover() {
    document.querySelectorAll('.fuxico-popover').forEach(el => el.remove());
    document.removeEventListener('keydown', onPopoverKeydown, true);
  }

  function onPopoverKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeHistoryPopover();
    }
  }

  function relativeTime(iso) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '—';
    const diff = Date.now() - then;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'agora mesmo';
    if (min < 60) return `há ${min} min`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `há ${days}d`;
    return new Date(then).toLocaleDateString('pt-BR');
  }

  function absoluteTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  async function fetchTrackingDetail(trackingId) {
    const cached = detailCache.get(trackingId);
    if (cached && Date.now() - cached.at < DETAIL_TTL) return cached.data;

    const endpoint = CONFIG.ENDPOINTS?.GET_DETAIL || '/get-tracking-detail';
    const response = await fetch(
      `${CONFIG.API_URL}${endpoint}?trackingId=${encodeURIComponent(trackingId)}`,
      { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      if (response.status === 401) {
        isAuthenticated = false;
        authToken = null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    detailCache.set(trackingId, { at: Date.now(), data });
    return data;
  }

  function renderTimeline(detail) {
    const events = Array.isArray(detail.timeline) ? detail.timeline : [];
    const visible = events.filter(ev => ev.type === 'open' || ev.type === 'click');

    if (visible.length === 0) {
      return `<div class="fuxico-popover-empty">Nenhuma abertura registrada ainda.</div>`;
    }

    return `<ul class="fuxico-timeline">${visible.slice(0, 30).map(ev => {
      const place = [ev.city, ev.country].filter(Boolean).join(', ');
      const isClick = ev.type === 'click';
      return `
        <li class="fuxico-timeline-item ${ev.isSelfOpen ? 'fuxico-timeline-self' : ''}">
          <span class="fuxico-timeline-dot ${isClick ? 'click' : 'open'}"></span>
          <div class="fuxico-timeline-body">
            <div class="fuxico-timeline-title">
              ${isClick ? 'Clique em link' : 'Abertura'}
              ${ev.isSelfOpen ? '<span class="fuxico-tag">sua própria abertura</span>' : ''}
            </div>
            <div class="fuxico-timeline-meta">
              ${escapeHtml(relativeTime(ev.at))} · ${escapeHtml(absoluteTime(ev.at))}
              · ${escapeHtml(ev.device || '—')} · ${escapeHtml(ev.client || '—')}
              ${place ? ` · ${escapeHtml(place)}` : ''}
            </div>
          </div>
        </li>`;
    }).join('')}</ul>`;
  }

  function renderLinks(detail) {
    const links = Array.isArray(detail.links) ? detail.links.filter(l => l.clicks > 0) : [];
    if (links.length === 0) return '';
    return `
      <div class="fuxico-popover-section">
        <div class="fuxico-popover-subtitle">Cliques por link</div>
        <ul class="fuxico-link-list">
          ${links.slice(0, 8).map(l => `
            <li><span class="fuxico-link-url" title="${escapeHtml(l.url || '')}">${escapeHtml(l.url || '')}</span>
            <span class="fuxico-link-count">${l.clicks}</span></li>
          `).join('')}
        </ul>
      </div>`;
  }

  function positionPopover(popover, anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = 360;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    popover.style.left = `${left}px`;
    if (spaceBelow > 320) {
      popover.style.top = `${rect.bottom + 8}px`;
    } else {
      popover.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    }
  }

  async function openHistoryPopover(anchor, stats) {
    closeHistoryPopover();

    const popover = document.createElement('div');
    popover.className = 'fuxico-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Histórico completo de rastreamento');
    popover.innerHTML = `
      <div class="fuxico-popover-header">
        <div>
          <div class="fuxico-popover-title">Histórico de rastreamento</div>
          <div class="fuxico-popover-subject">${escapeHtml(stats.subject || stats.recipientEmail || '')}</div>
        </div>
        <button type="button" class="fuxico-popover-close" aria-label="Fechar">×</button>
      </div>
      <div class="fuxico-popover-content"><div class="fuxico-popover-loading">Carregando…</div></div>
    `;
    document.body.appendChild(popover);
    positionPopover(popover, anchor);

    popover.querySelector('.fuxico-popover-close').addEventListener('click', closeHistoryPopover);
    popover.addEventListener('click', (e) => e.stopPropagation());
    setTimeout(() => document.addEventListener('click', closeHistoryPopover, { once: true }), 0);
    document.addEventListener('keydown', onPopoverKeydown, true);

    const content = popover.querySelector('.fuxico-popover-content');

    if (!stats.trackingId) {
      content.innerHTML = `<div class="fuxico-popover-empty">Rastreamento não identificado para esta conversa.</div>`;
      return;
    }

    try {
      const detail = await fetchTrackingDetail(stats.trackingId);
      const s = detail.summary || {};
      content.innerHTML = `
        <div class="fuxico-popover-stats">
          <div><strong>${s.opens ?? 0}</strong><span>aberturas</span></div>
          <div><strong>${s.clicks ?? 0}</strong><span>cliques</span></div>
          <div><strong>${s.selfOpens ?? 0}</strong><span>próprias</span></div>
        </div>
        ${renderTimeline(detail)}
        ${renderLinks(detail)}
        <a class="fuxico-popover-link" target="_blank" rel="noopener noreferrer"
           href="${DASHBOARD_URL}/tracking-analytics?tracking=${encodeURIComponent(stats.trackingId)}">
          Ver no dashboard →
        </a>
      `;
    } catch (e) {
      error('Erro ao carregar histórico:', e);
      content.innerHTML = `<div class="fuxico-popover-error">Não foi possível carregar o histórico. Verifique sua conexão ou faça login novamente.</div>`;
    }
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

  function matchStats(stats, recipientEmail, subject) {
    if (!recipientEmail) return null;
    return stats.get(`${recipientEmail}|${subject}`) || stats.get(recipientEmail) || null;
  }

  /** Marcadores nas listagens (inbox e Enviados). */
  function renderRowMarkers(stats) {
    document.querySelectorAll('tr.zA').forEach(row => {
      const recipientEmail = extractEmailFromRow(row);
      const subject = extractSubjectFromRow(row);
      const emailStats = matchStats(stats, recipientEmail, subject);

      const existing = row.querySelector('.fuxico-inbox-indicator');
      if (!emailStats) {
        if (existing) existing.remove();
        return;
      }

      // Idempotente: só re-renderiza quando o estado muda
      const signature = `${emailStats.trackingId}:${visibleOpens(emailStats)}:${emailStats.clicks}`;
      if (existing && existing.dataset.fuxicoSignature === signature) return;
      if (existing) existing.remove();

      const indicator = createIndicatorElement(emailStats);
      indicator.dataset.fuxicoSignature = signature;

      const subjectCell = row.querySelector('.xT, .y6');
      if (subjectCell) {
        subjectCell.style.position = 'relative';
        subjectCell.insertBefore(indicator, subjectCell.firstChild);
      }
    });
  }

  /** Marcador dentro da conversa aberta (thread view). */
  function renderThreadMarkers(stats) {
    document.querySelectorAll('.gE.iv.gt, .adn.ads .gE').forEach(header => {
      const recipientEl = header.querySelector('[email], [data-hovercard-id]');
      const recipientEmail = (
        recipientEl?.getAttribute('email') || recipientEl?.getAttribute('data-hovercard-id') || ''
      ).toLowerCase();
      if (!recipientEmail) return;

      const subject = (document.querySelector('h2.hP')?.textContent || '').trim().toLowerCase();
      const emailStats = matchStats(stats, recipientEmail, subject);
      if (!emailStats) return;

      const signature = `${emailStats.trackingId}:${visibleOpens(emailStats)}:${emailStats.clicks}`;
      const existing = header.querySelector('.fuxico-inbox-indicator');
      if (existing && existing.dataset.fuxicoSignature === signature) return;
      if (existing) existing.remove();

      const indicator = createIndicatorElement(emailStats);
      indicator.dataset.fuxicoSignature = signature;
      indicator.classList.add('fuxico-thread-indicator');
      header.appendChild(indicator);
    });
  }

  async function updateInboxIndicators() {
    if (!isAuthenticated) return;

    if (!showMarkers) {
      document.querySelectorAll('.fuxico-inbox-indicator').forEach(el => el.remove());
      return;
    }

    const stats = await fetchEmailStats();
    if (!stats || stats.size === 0) return;

    renderRowMarkers(stats);
    renderThreadMarkers(stats);
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
      // Assinatura opcional "Enviado com FUXICO" (desligada por padrão)
      const wantsSignature = composeWindow.dataset.fuxicoSignature === 'on'
        || (signatureEnabled && composeWindow.dataset.fuxicoSignature !== 'off');
      if (wantsSignature && !bodyDiv.querySelector('.fuxico-signature-line')) {
        const sig = document.createElement('div');
        sig.className = 'fuxico-signature-line';
        sig.style.cssText = 'font-size:12px;color:#6b7280;margin-top:12px;';
        sig.textContent = 'Enviado com FUXICO';
        bodyDiv.appendChild(sig);
      }

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

          // Lembrete de follow-up se o usuário ativou no compose
          if (composeWindow.dataset.fuxicoReminder === 'on') {
            await createFollowUpReminder(data.trackingId || trackingId);
          }
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
  // LEMBRETES DE FOLLOW-UP
  // ============================================

  async function createFollowUpReminder(trackingId) {
    try {
      const endpoint = CONFIG.ENDPOINTS?.CREATE_REMINDER || '/create-reminder';
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ trackingId, reminderDays }),
      });

      if (response.ok) {
        showNotification('⏰ Lembrete criado', `Avisaremos se não houver abertura em ${reminderDays} dia(s)`);
      } else {
        error('Erro ao criar lembrete:', response.status);
      }
    } catch (e) {
      error('Erro de rede ao criar lembrete:', e);
    }
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

    // Lembrete "se não abrir em N dias"
    const reminderBtn = document.createElement('button');
    reminderBtn.type = 'button';
    reminderBtn.className = 'fuxico-compose-chip';
    reminderBtn.textContent = `⏰ Lembrar em ${reminderDays}d`;
    reminderBtn.title = `Criar lembrete se o destinatário não abrir em ${reminderDays} dias`;
    reminderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const on = composeWindow.dataset.fuxicoReminder !== 'on';
      composeWindow.dataset.fuxicoReminder = on ? 'on' : 'off';
      reminderBtn.classList.toggle('active', on);
    });
    toggleContainer.appendChild(reminderBtn);

    // Assinatura opcional
    const sigBtn = document.createElement('button');
    sigBtn.type = 'button';
    sigBtn.className = 'fuxico-compose-chip';
    sigBtn.textContent = '✍️ Assinatura';
    sigBtn.title = 'Incluir "Enviado com FUXICO" no rodapé deste e-mail';
    if (signatureEnabled) {
      sigBtn.classList.add('active');
      composeWindow.dataset.fuxicoSignature = 'on';
    }
    sigBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const on = composeWindow.dataset.fuxicoSignature !== 'on';
      composeWindow.dataset.fuxicoSignature = on ? 'on' : 'off';
      sigBtn.classList.toggle('active', on);
    });
    toggleContainer.appendChild(sigBtn);

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
    log('Iniciando FUXICO v1.4.0...');
    
    await new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve);
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await loadAuthToken();
    await loadSettings();

    // Reage a mudanças de preferências feitas no popup
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;
        if (changes.trackingEnabled) isTrackingEnabled = changes.trackingEnabled.newValue !== false;
        if (changes.showMarkers) showMarkers = changes.showMarkers.newValue !== false;
        if (changes.hideSelfOpens) hideSelfOpens = changes.hideSelfOpens.newValue !== false;
        if (changes.signatureEnabled) signatureEnabled = changes.signatureEnabled.newValue === true;
        if (changes.reminderDays) {
          const v = Number(changes.reminderDays.newValue);
          reminderDays = v > 0 ? v : 3;
        }
        detailCache.clear();
        document.querySelectorAll('.fuxico-inbox-indicator').forEach(el => el.remove());
        updateInboxIndicators();
      });
    }

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

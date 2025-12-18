// FUXICO - Gmail Content Script
// Injeta funcionalidades de tracking no Gmail

(function() {
  'use strict';

  // Configuração - ATUALIZE COM SUA URL DO SUPABASE
  const CONFIG = {
    API_URL: 'https://npjfwzzapbtcguoupozd.supabase.co/functions/v1',
    PIXEL_ENDPOINT: '/track-pixel',
    CREATE_TRACKING_ENDPOINT: '/create-tracking',
    REPORT_BOUNCE_ENDPOINT: '/report-bounce',
    LOG_EMAIL_ACTIVITY_ENDPOINT: '/log-email-activity',
    CHECK_INTERVAL: 1000, // 1 segundo
    BOUNCE_CHECK_INTERVAL: 30000, // 30 segundos
    AUDIT_CHECK_INTERVAL: 60000, // 1 minuto
  };

  // Estado global
  let isTrackingEnabled = true;
  let observedComposeWindows = new Set();
  let processedEmails = new Set(); // Para evitar logs duplicados de auditoria
  let authToken = null; // Token de autenticação

  // Utilitários
  const log = (msg, ...args) => console.log(`[FUXICO] ${msg}`, ...args);
  const error = (msg, ...args) => console.error(`[FUXICO ERROR] ${msg}`, ...args);

  // Carregar configurações do storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['trackingEnabled', 'authToken']);
      isTrackingEnabled = result.trackingEnabled !== false; // default true
      authToken = result.authToken || null;
      log('Configurações carregadas. Tracking:', isTrackingEnabled ? 'ON' : 'OFF', 'Auth:', authToken ? 'YES' : 'NO');
    } catch (e) {
      error('Erro ao carregar configurações:', e);
    }
  }

  // Gerar ID único para tracking
  function generateTrackingId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Criar pixel HTML
  function createPixelHTML(trackingId) {
    const pixelUrl = `${CONFIG.API_URL}${CONFIG.PIXEL_ENDPOINT}?id=${trackingId}`;
    return `<img src="${pixelUrl}" width="1" height="1" style="display:none;opacity:0;width:1px;height:1px;" alt="" data-fuxico-pixel="true">`;
  }

  // Extrair emails do campo "To"
  function extractRecipients(composeWindow) {
    const recipients = [];
    
    // Gmail usa diferentes seletores dependendo da versão
    const toFields = composeWindow.querySelectorAll('[email], [data-hovercard-id]');
    toFields.forEach(field => {
      const email = field.getAttribute('email') || field.getAttribute('data-hovercard-id');
      if (email && email.includes('@')) {
        recipients.push(email);
      }
    });

    // Fallback: tentar extrair do texto
    if (recipients.length === 0) {
      const toContainer = composeWindow.querySelector('[name="to"]');
      if (toContainer) {
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        const matches = toContainer.value?.match(emailRegex) || [];
        recipients.push(...matches);
      }
    }

    return [...new Set(recipients)]; // Remove duplicatas
  }

  // Extrair assunto
  function extractSubject(composeWindow) {
    const subjectInput = composeWindow.querySelector('[name="subjectbox"]');
    return subjectInput?.value || '';
  }

  // Injetar pixel no corpo do email antes de enviar
  async function injectPixelBeforeSend(composeWindow) {
    if (!isTrackingEnabled) {
      log('Tracking desabilitado, não injetando pixel');
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

    // Encontrar o corpo do email (contenteditable div)
    const bodyDiv = composeWindow.querySelector('[role="textbox"][aria-label*="Message"], [contenteditable="true"][aria-label*="Corpo"]');
    
    if (bodyDiv) {
      // Injetar pixel no final do corpo
      const pixelContainer = document.createElement('div');
      pixelContainer.innerHTML = pixelHTML;
      pixelContainer.style.cssText = 'font-size:1px;line-height:1px;height:1px;';
      bodyDiv.appendChild(pixelContainer);

      log(`Pixel injetado! TrackingID: ${trackingId}`);

      // Registrar tracking no backend
      try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.CREATE_TRACKING_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientEmail: recipients[0], // Principal destinatário
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
          
          // Notificar usuário
          showNotification('FUXICO ativado', `Email para ${recipients[0]} será rastreado`);
        } else {
          error('Erro ao registrar tracking:', await response.text());
        }
      } catch (e) {
        error('Erro de rede ao registrar tracking:', e);
      }
    } else {
      error('Corpo do email não encontrado');
    }
  }

  // Mostrar notificação
  function showNotification(title, message) {
    // Toast notification dentro do Gmail
    const toast = document.createElement('div');
    toast.className = 'fuxico-toast';
    toast.innerHTML = `
      <div class="fuxico-toast-icon">📧</div>
      <div class="fuxico-toast-content">
        <div class="fuxico-toast-title">${title}</div>
        <div class="fuxico-toast-message">${message}</div>
      </div>
    `;
    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Remover após 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Adicionar toggle de tracking na janela de compose
  function addTrackingToggle(composeWindow) {
    // Verificar se já existe
    if (composeWindow.querySelector('.fuxico-toggle')) return;

    // Encontrar a toolbar do compose (onde ficam os botões)
    const toolbar = composeWindow.querySelector('[role="toolbar"]');
    if (!toolbar) return;

    // Criar container do toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'fuxico-toggle';
    toggleContainer.innerHTML = `
      <button class="fuxico-toggle-btn ${isTrackingEnabled ? 'active' : ''}" title="FUXICO: Rastrear este email">
        <span class="fuxico-icon">👁️</span>
        <span class="fuxico-label">FUXICO</span>
      </button>
    `;

    // Adicionar evento de click
    const btn = toggleContainer.querySelector('.fuxico-toggle-btn');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isTrackingEnabled = !isTrackingEnabled;
      btn.classList.toggle('active', isTrackingEnabled);
      
      // Salvar preferência
      chrome.storage.sync.set({ trackingEnabled: isTrackingEnabled });
      
      showNotification(
        isTrackingEnabled ? 'Tracking Ativado' : 'Tracking Desativado',
        isTrackingEnabled ? 'Seus emails serão rastreados' : 'Emails não serão rastreados'
      );
    });

    // Inserir na toolbar
    toolbar.parentNode.insertBefore(toggleContainer, toolbar.nextSibling);
    log('Toggle de tracking adicionado');
  }

  // Interceptar botão de enviar
  function interceptSendButton(composeWindow) {
    const composeId = composeWindow.dataset.fuxicoId;
    if (!composeId) {
      composeWindow.dataset.fuxicoId = generateTrackingId().slice(0, 8);
    }

    // Encontrar botão de enviar
    const sendButton = composeWindow.querySelector('[data-tooltip*="Send"], [aria-label*="Send"], [aria-label*="Enviar"]');
    
    if (sendButton && !sendButton.dataset.fuxicoIntercepted) {
      sendButton.dataset.fuxicoIntercepted = 'true';

      // Adicionar listener de mousedown (acontece antes do click)
      sendButton.addEventListener('mousedown', async (e) => {
        if (isTrackingEnabled) {
          await injectPixelBeforeSend(composeWindow);
        }
      }, true);

      // Também interceptar atalho Ctrl+Enter / Cmd+Enter
      composeWindow.addEventListener('keydown', async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          if (isTrackingEnabled) {
            await injectPixelBeforeSend(composeWindow);
          }
        }
      }, true);

      log('Botão de enviar interceptado');
    }
  }

  // Observar novas janelas de compose
  function observeComposeWindows() {
    // Gmail usa classes dinâmicas, então procuramos por estrutura
    const composeSelector = '[role="dialog"], .nH.Hd[role="main"]';
    
    const checkForCompose = () => {
      const composeWindows = document.querySelectorAll(composeSelector);
      
      composeWindows.forEach(win => {
        // Verificar se é realmente uma janela de compose (tem campo de mensagem)
        const hasMessageField = win.querySelector('[role="textbox"][aria-label*="Message"], [contenteditable="true"][g_editable="true"]');
        
        if (hasMessageField && !observedComposeWindows.has(win)) {
          observedComposeWindows.add(win);
          log('Nova janela de compose detectada');
          
          // Adicionar funcionalidades
          addTrackingToggle(win);
          interceptSendButton(win);
        }
      });

      // Limpar referências de janelas fechadas
      observedComposeWindows.forEach(win => {
        if (!document.contains(win)) {
          observedComposeWindows.delete(win);
        }
      });
    };

    // Verificar periodicamente (Gmail carrega conteúdo dinamicamente)
    setInterval(checkForCompose, CONFIG.CHECK_INTERVAL);

    // Também observar mutações do DOM
    const observer = new MutationObserver(() => {
      checkForCompose();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Adicionar indicadores de tracking na lista de enviados
  function addTrackingIndicatorsToSentFolder() {
    // Esta funcionalidade requer acesso ao histórico de tracking
    // Por enquanto, apenas um placeholder
    log('Indicadores de pasta enviados - a implementar');
  }

  // Detectar emails de bounce na caixa de entrada
  const BOUNCE_SENDERS = [
    'mailer-daemon',
    'postmaster',
    'mail-daemon',
    'mail delivery',
    'delivery status notification',
    'undeliverable',
    'failed delivery',
    'mail system',
    'auto-reply'
  ];

  const BOUNCE_SUBJECTS = [
    'undeliverable',
    'delivery status notification',
    'delivery failure',
    'returned mail',
    'mail delivery failed',
    'failure notice',
    'undelivered mail',
    'não foi possível entregar',
    'falha na entrega',
    'email não entregue'
  ];

  async function checkForBounceEmails() {
    try {
      // Procurar por emails de bounce na página atual
      const emailRows = document.querySelectorAll('tr.zA');
      
      for (const row of emailRows) {
        // Verificar se já processamos este email
        if (row.dataset.fuxicoBounceChecked) continue;
        row.dataset.fuxicoBounceChecked = 'true';
        
        const senderElement = row.querySelector('.yW .bA4 [email], .yW .yP [email]');
        const subjectElement = row.querySelector('.y6 .bog');
        
        if (!senderElement || !subjectElement) continue;
        
        const senderEmail = (senderElement.getAttribute('email') || '').toLowerCase();
        const senderName = (senderElement.textContent || '').toLowerCase();
        const subject = (subjectElement.textContent || '').toLowerCase();
        
        // Verificar se é um email de bounce
        const isBounce = BOUNCE_SENDERS.some(s => 
          senderEmail.includes(s) || senderName.includes(s)
        ) || BOUNCE_SUBJECTS.some(s => subject.includes(s));
        
        if (isBounce) {
          log('Email de bounce detectado:', subject);
          
          // Tentar extrair o email original que bounceou
          const bouncedEmail = extractBouncedEmailAddress(row);
          
          if (bouncedEmail) {
            await reportBounce(bouncedEmail, subject);
          }
        }
      }
    } catch (e) {
      error('Erro ao verificar emails de bounce:', e);
    }
  }

  function extractBouncedEmailAddress(row) {
    // Tentar extrair email do snippet ou preview
    const snippetElement = row.querySelector('.y2');
    if (snippetElement) {
      const snippet = snippetElement.textContent || '';
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const matches = snippet.match(emailRegex);
      if (matches && matches.length > 0) {
        // Filtrar emails de sistema
        const userEmails = matches.filter(email => 
          !BOUNCE_SENDERS.some(s => email.toLowerCase().includes(s))
        );
        if (userEmails.length > 0) {
          return userEmails[0];
        }
      }
    }
    return null;
  }

  async function reportBounce(recipientEmail, bounceSubject) {
    try {
      const bounceType = bounceSubject.includes('permanent') || bounceSubject.includes('failed') 
        ? 'hard' 
        : 'soft';
      
      log(`Reportando bounce para: ${recipientEmail} (${bounceType})`);
      
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.REPORT_BOUNCE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          bounce_type: bounceType,
          bounce_reason: bounceSubject
        }),
      });

      if (response.ok) {
        const data = await response.json();
        log('Bounce reportado:', data);
        showNotification('Bounce Detectado', `Email para ${recipientEmail} não foi entregue`);
      } else {
        log('Nenhum tracking encontrado para este bounce');
      }
    } catch (e) {
      error('Erro ao reportar bounce:', e);
    }
  }

  // Iniciar verificação periódica de bounces
  function startBounceDetection() {
    // Verificar imediatamente
    checkForBounceEmails();
    
    // Verificar periodicamente
    setInterval(checkForBounceEmails, CONFIG.BOUNCE_CHECK_INTERVAL);
    
    // Também verificar quando o DOM muda (navegação no Gmail)
    const observer = new MutationObserver(() => {
      setTimeout(checkForBounceEmails, 500);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    log('Detecção de bounce iniciada');
  }

  // ========== AUDITORIA DE EMAILS ==========
  
  // Registrar atividade de email no backend
  async function logEmailActivity(direction, recipientEmail, senderEmail, subject) {
    if (!authToken) {
      log('Token de autenticação não disponível, auditoria não registrada');
      return;
    }

    try {
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.LOG_EMAIL_ACTIVITY_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          direction,
          recipientEmail,
          senderEmail,
          subject,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'chrome-extension',
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        log(`Atividade registrada: ${direction}`, data.alertsCreated > 0 ? `(${data.alertsCreated} alertas)` : '');
      } else {
        error('Erro ao registrar atividade:', await response.text());
      }
    } catch (e) {
      error('Erro de rede ao registrar atividade:', e);
    }
  }

  // Extrair email do usuário atual
  function getCurrentUserEmail() {
    // Tentar obter do Gmail
    const accountButton = document.querySelector('a[aria-label*="Google Account"], [data-email]');
    if (accountButton) {
      const email = accountButton.getAttribute('data-email') || accountButton.getAttribute('aria-label');
      const match = email?.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (match) return match[0];
    }
    
    // Fallback: tentar no header
    const gbii = document.querySelector('.gb_C .gb_d');
    if (gbii) {
      const match = gbii.textContent?.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (match) return match[0];
    }
    
    return null;
  }

  // Detectar emails recebidos na inbox
  async function detectReceivedEmails() {
    if (!authToken) return;
    
    try {
      const emailRows = document.querySelectorAll('tr.zA');
      const currentUserEmail = getCurrentUserEmail();
      
      for (const row of emailRows) {
        // Gerar ID único para este email
        const rowId = row.getAttribute('data-legacy-thread-id') || row.querySelector('.a3s')?.id || '';
        if (!rowId || processedEmails.has(rowId)) continue;
        
        const senderElement = row.querySelector('.yW .bA4 [email], .yW .yP [email]');
        const subjectElement = row.querySelector('.y6 .bog');
        
        if (!senderElement) continue;
        
        const senderEmail = senderElement.getAttribute('email') || '';
        const subject = subjectElement?.textContent || '';
        
        // Verificar se não é um email enviado por nós
        if (senderEmail.toLowerCase() === currentUserEmail?.toLowerCase()) continue;
        
        // Verificar se não é email de sistema (bounce, etc)
        if (BOUNCE_SENDERS.some(s => senderEmail.toLowerCase().includes(s))) continue;
        
        // Marcar como processado e registrar
        processedEmails.add(rowId);
        
        // Limitar tamanho do set
        if (processedEmails.size > 500) {
          const firstKey = processedEmails.values().next().value;
          processedEmails.delete(firstKey);
        }
        
        await logEmailActivity('received', currentUserEmail, senderEmail, subject);
      }
    } catch (e) {
      error('Erro ao detectar emails recebidos:', e);
    }
  }

  // Modificar a função de envio para também logar auditoria
  const originalInjectPixelBeforeSend = injectPixelBeforeSend;
  
  async function injectPixelBeforeSendWithAudit(composeWindow) {
    const recipients = extractRecipients(composeWindow);
    const subject = extractSubject(composeWindow);
    const currentUserEmail = getCurrentUserEmail();
    
    // Chamar função original de pixel
    if (isTrackingEnabled) {
      await originalInjectPixelBeforeSend(composeWindow);
    }
    
    // Registrar auditoria para cada destinatário
    if (authToken && recipients.length > 0) {
      for (const recipient of recipients) {
        await logEmailActivity('sent', recipient, currentUserEmail, subject);
      }
    }
  }

  // Iniciar auditoria periódica
  function startEmailAudit() {
    // Verificar emails recebidos imediatamente
    detectReceivedEmails();
    
    // Verificar periodicamente
    setInterval(detectReceivedEmails, CONFIG.AUDIT_CHECK_INTERVAL);
    
    log('Auditoria de emails iniciada');
  }

  // Inicialização
  async function init() {
    log('Iniciando FUXICO Chrome Extension...');
    
    // Aguardar carregamento do Gmail
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });

    // Aguardar um pouco mais para Gmail carregar interface
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Carregar configurações
    await loadSettings();

    // Iniciar observação
    observeComposeWindows();
    addTrackingIndicatorsToSentFolder();
    startBounceDetection();
    startEmailAudit();

    log('FUXICO inicializado com sucesso!');
    
    // Mostrar notificação de inicialização
    showNotification('FUXICO Ativo', 'Seus emails agora serão rastreados');
  }

  // Iniciar
  init();

  // Escutar mensagens do popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleTracking') {
      isTrackingEnabled = request.enabled;
      log('Tracking alterado via popup:', isTrackingEnabled ? 'ON' : 'OFF');
      sendResponse({ success: true });
    }
    
    if (request.action === 'setAuthToken') {
      authToken = request.token;
      chrome.storage.sync.set({ authToken: request.token });
      log('Token de autenticação atualizado');
      sendResponse({ success: true });
    }
    
    if (request.action === 'getStatus') {
      sendResponse({ 
        trackingEnabled: isTrackingEnabled,
        composeWindowsCount: observedComposeWindows.size,
        hasAuthToken: !!authToken
      });
    }
    
    return true;
  });

})();

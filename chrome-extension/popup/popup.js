// FUXICO - Popup Script com Autenticação
// Versão 1.1.0 - Com suporte a OAuth e gestão de sessão

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  
  // Usar config.js se disponível, senão fallback
  const CONFIG = typeof FUXICO_CONFIG !== 'undefined' ? FUXICO_CONFIG : {
    SUPABASE_URL: 'https://npjfwzzapbtcguoupozd.supabase.co',
    SUPABASE_ANON_KEY: '',
    DASHBOARD_URL: 'https://fuxico.lovable.app',
    VERSION: '1.1.0',
    get API_URL() { return `${this.SUPABASE_URL}/functions/v1`; }
  };

  // ============================================
  // ELEMENTOS DOM
  // ============================================
  
  const elements = {
    // Estados
    loadingState: document.getElementById('loadingState'),
    loginState: document.getElementById('loginState'),
    dashboardState: document.getElementById('dashboardState'),
    
    // Login
    loginForm: document.getElementById('loginForm'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('loginBtn'),
    loginError: document.getElementById('loginError'),
    loginWithGoogleBtn: document.getElementById('loginWithGoogleBtn'),
    openSignup: document.getElementById('openSignup'),
    
    // Dashboard
    userInfo: document.getElementById('userInfo'),
    userAvatar: document.getElementById('userAvatar'),
    userEmail: document.getElementById('userEmail'),
    logoutBtn: document.getElementById('logoutBtn'),
    trackingToggle: document.getElementById('trackingToggle'),
    statusIndicator: document.getElementById('statusIndicator'),
    
    // Stats
    totalEmails: document.getElementById('totalEmails'),
    totalOpens: document.getElementById('totalOpens'),
    totalClicks: document.getElementById('totalClicks'),
    activityList: document.getElementById('activityList'),
    
    // Settings
    notificationsToggle: document.getElementById('notificationsToggle'),
    soundToggle: document.getElementById('soundToggle'),
    
    // Header
    openDashboard: document.getElementById('openDashboard'),
    versionText: document.getElementById('versionText'),
    helpLink: document.getElementById('helpLink'),
  };

  // ============================================
  // ESTADO
  // ============================================
  
  let currentUser = null;
  let accessToken = null;

  // ============================================
  // FUNÇÕES DE UI
  // ============================================
  
  function showState(state) {
    elements.loadingState.style.display = 'none';
    elements.loginState.style.display = 'none';
    elements.dashboardState.style.display = 'none';
    
    if (state === 'loading') {
      elements.loadingState.style.display = 'flex';
    } else if (state === 'login') {
      elements.loginState.style.display = 'block';
      elements.logoutBtn.style.display = 'none';
    } else if (state === 'dashboard') {
      elements.dashboardState.style.display = 'block';
      elements.logoutBtn.style.display = 'block';
    }
  }

  function showError(message) {
    elements.loginError.textContent = message;
    elements.loginError.style.display = 'block';
    setTimeout(() => {
      elements.loginError.style.display = 'none';
    }, 5000);
  }

  function setLoginLoading(loading) {
    const btnText = elements.loginBtn.querySelector('.btn-text');
    const btnLoading = elements.loginBtn.querySelector('.btn-loading');
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
      elements.loginBtn.disabled = true;
    } else {
      btnText.style.display = 'block';
      btnLoading.style.display = 'none';
      elements.loginBtn.disabled = false;
    }
  }

  function updateUserInfo(user) {
    if (user && user.email) {
      elements.userEmail.textContent = user.email;
      elements.userAvatar.textContent = user.email.charAt(0).toUpperCase();
    }
  }

  function updateStats(data) {
    if (!data || !data.emails) return;
    
    const emails = data.emails;
    const totalEmails = emails.length;
    const totalOpens = emails.reduce((sum, e) => sum + (e.opens || 0), 0);
    const totalClicks = emails.reduce((sum, e) => sum + (e.clicks || 0), 0);
    
    elements.totalEmails.textContent = totalEmails;
    elements.totalOpens.textContent = totalOpens;
    elements.totalClicks.textContent = totalClicks;
    
    // Atualizar lista de atividades recentes
    updateActivityList(emails.slice(0, 5));
  }

  function updateActivityList(emails) {
    if (!emails || emails.length === 0) {
      elements.activityList.innerHTML = `
        <div class="activity-empty">
          <span class="activity-empty-icon">📭</span>
          <span class="activity-empty-text">Nenhuma atividade ainda</span>
        </div>
      `;
      return;
    }

    elements.activityList.innerHTML = emails.map(email => {
      const opens = email.opens || 0;
      const clicks = email.clicks || 0;
      const status = opens > 0 ? '✓ Aberto' : '○ Pendente';
      const statusClass = opens > 0 ? 'opened' : 'pending';
      const timeAgo = getTimeAgo(new Date(email.created_at));
      
      return `
        <div class="activity-item">
          <div class="activity-icon ${statusClass}">
            ${opens > 0 ? '👁️' : '📧'}
          </div>
          <div class="activity-content">
            <div class="activity-recipient">${email.recipient_email}</div>
            <div class="activity-meta">
              <span class="activity-status ${statusClass}">${status}</span>
              <span class="activity-stats">${opens} aberturas, ${clicks} cliques</span>
            </div>
          </div>
          <div class="activity-time">${timeAgo}</div>
        </div>
      `;
    }).join('');
  }

  function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }

  function updateTrackingStatus(enabled) {
    const statusDot = elements.statusIndicator.querySelector('.status-dot');
    const statusText = elements.statusIndicator.querySelector('.status-text');
    
    if (enabled) {
      statusDot.classList.add('active');
      statusDot.classList.remove('inactive');
      statusText.textContent = 'Tracking Ativo';
    } else {
      statusDot.classList.remove('active');
      statusDot.classList.add('inactive');
      statusText.textContent = 'Tracking Pausado';
    }
  }

  // ============================================
  // FUNÇÕES DE AUTENTICAÇÃO
  // ============================================
  
  async function checkSession() {
    try {
      const result = await chrome.storage.sync.get(['authToken', 'user', 'tokenExpiry']);
      
      if (result.authToken && result.user) {
        // Verificar se token não expirou
        if (result.tokenExpiry && new Date(result.tokenExpiry) > new Date()) {
          accessToken = result.authToken;
          currentUser = result.user;
          
          // Notificar content script e service worker
          notifyAuthChange(true);
          
          return true;
        } else {
          // Token expirado, limpar
          await clearSession();
        }
      }
      
      return false;
    } catch (error) {
      // console.error('[FUXICO] Erro ao verificar sessão:', error);
      return false;
    }
  }

  async function login(email, password) {
    try {
      const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || error.message || 'Credenciais inválidas');
      }

      const data = await response.json();
      
      // Salvar sessão
      await saveSession(data);
      
      return { success: true, user: data.user };
    } catch (error) {
      // console.error('[FUXICO] Erro no login:', error);
      return { success: false, error: error.message };
    }
  }

  async function loginWithGoogle() {
    try {
      // Abrir popup de autenticação OAuth do Supabase
      const authUrl = `${CONFIG.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(CONFIG.DASHBOARD_URL + '/auth/callback')}`;
      
      // Abrir em nova aba (popup não funciona bem em extensões)
      chrome.tabs.create({ url: authUrl }, (tab) => {
        // Monitorar a aba para capturar o callback
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.url && info.url.includes('/auth/callback')) {
            // Extrair token da URL
            const url = new URL(info.url);
            const hashParams = new URLSearchParams(url.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            
            if (accessToken) {
              // Buscar dados do usuário e salvar sessão
              fetchUserAndSaveSession(accessToken);
            }
            
            // Fechar aba de auth
            chrome.tabs.remove(tabId);
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      });
    } catch (error) {
      // console.error('[FUXICO] Erro no login com Google:', error);
      showError('Erro ao conectar com Google');
    }
  }

  async function fetchUserAndSaveSession(token) {
    try {
      const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': CONFIG.SUPABASE_ANON_KEY,
        },
      });

      if (response.ok) {
        const user = await response.json();
        await saveSession({
          access_token: token,
          user: user,
          expires_in: 3600, // 1 hora default
        });
        
        // Recarregar popup
        window.location.reload();
      }
    } catch (error) {
      // console.error('[FUXICO] Erro ao buscar usuário:', error);
    }
  }

  async function saveSession(data) {
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + (data.expires_in || 3600));
    
    await chrome.storage.sync.set({
      authToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
      tokenExpiry: expiry.toISOString(),
    });
    
    accessToken = data.access_token;
    currentUser = data.user;
    
    // Notificar outros scripts
    notifyAuthChange(true);
  }

  async function logout() {
    try {
      // Revogar token no servidor (opcional)
      if (accessToken) {
        await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': CONFIG.SUPABASE_ANON_KEY,
          },
        }).catch(() => {}); // Ignorar erros
      }
    } catch (error) {
      // console.error('[FUXICO] Erro ao fazer logout:', error);
    }
    
    await clearSession();
    showState('login');
  }

  async function clearSession() {
    await chrome.storage.sync.remove(['authToken', 'refreshToken', 'user', 'tokenExpiry']);
    accessToken = null;
    currentUser = null;
    notifyAuthChange(false);
  }

  function notifyAuthChange(isAuthenticated) {
    // Notificar service worker
    chrome.runtime.sendMessage({
      action: 'authStateChanged',
      isAuthenticated,
      token: accessToken,
      user: currentUser,
    }).catch(() => {});
    
    // Notificar tabs do Gmail
    chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'setAuthToken',
          token: accessToken,
        }).catch(() => {});
      });
    });
  }

  // ============================================
  // FUNÇÕES DE DADOS
  // ============================================
  
  async function fetchStats() {
    if (!accessToken) return;
    
    try {
      const response = await fetch(`${CONFIG.API_URL}/get-tracking-stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        updateStats(data);
      } else if (response.status === 401) {
        // Token inválido, fazer logout
        await logout();
      }
    } catch (error) {
      // console.error('[FUXICO] Erro ao buscar stats:', error);
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  
  // Login form
  elements.loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (!email || !password) {
      showError('Preencha todos os campos');
      return;
    }
    
    setLoginLoading(true);
    
    const result = await login(email, password);
    
    setLoginLoading(false);
    
    if (result.success) {
      updateUserInfo(result.user);
      showState('dashboard');
      fetchStats();
    } else {
      showError(result.error);
    }
  });

  // Login com Google
  elements.loginWithGoogleBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    loginWithGoogle();
  });

  // Abrir signup
  elements.openSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${CONFIG.DASHBOARD_URL}/auth?mode=signup` });
  });

  // Logout
  elements.logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
  });

  // Toggle tracking
  elements.trackingToggle?.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    
    await chrome.storage.sync.set({ trackingEnabled: enabled });
    updateTrackingStatus(enabled);
    
    // Notificar content scripts
    chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleTracking',
          enabled,
        }).catch(() => {});
      });
    });
  });

  // Toggle notificações
  elements.notificationsToggle?.addEventListener('change', async (e) => {
    await chrome.storage.sync.set({ notificationsEnabled: e.target.checked });
  });

  // Toggle som
  elements.soundToggle?.addEventListener('change', async (e) => {
    await chrome.storage.sync.set({ soundEnabled: e.target.checked });
  });

  // Abrir dashboard
  elements.openDashboard?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: CONFIG.DASHBOARD_URL });
  });

  // Ajuda
  elements.helpLink?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${CONFIG.DASHBOARD_URL}/help` });
  });

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  async function init() {
    // console.log('[FUXICO] Inicializando popup...');
    
    // Atualizar versão
    if (elements.versionText) {
      elements.versionText.textContent = `v${CONFIG.VERSION}`;
    }
    
    // Carregar configurações salvas
    const settings = await chrome.storage.sync.get([
      'trackingEnabled',
      'notificationsEnabled',
      'soundEnabled',
    ]);
    
    elements.trackingToggle.checked = settings.trackingEnabled !== false;
    elements.notificationsToggle.checked = settings.notificationsEnabled !== false;
    elements.soundToggle.checked = settings.soundEnabled === true;
    
    updateTrackingStatus(elements.trackingToggle.checked);
    
    // Verificar sessão
    const isAuthenticated = await checkSession();
    
    if (isAuthenticated) {
      updateUserInfo(currentUser);
      showState('dashboard');
      fetchStats();
    } else {
      showState('login');
    }
  }

  // Iniciar
  init();

})();

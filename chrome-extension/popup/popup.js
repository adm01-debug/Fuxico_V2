// FUXICO Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Elementos DOM
  const trackingToggle = document.getElementById('trackingToggle');
  const notificationsToggle = document.getElementById('notificationsToggle');
  const soundToggle = document.getElementById('soundToggle');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusDot = statusIndicator.querySelector('.status-dot');
  const statusText = statusIndicator.querySelector('.status-text');
  const openDashboard = document.getElementById('openDashboard');
  
  const totalEmailsEl = document.getElementById('totalEmails');
  const totalOpensEl = document.getElementById('totalOpens');
  const totalClicksEl = document.getElementById('totalClicks');
  const activityList = document.getElementById('activityList');

  // URL do dashboard - ATUALIZE ISSO
  const DASHBOARD_URL = 'https://lovable.dev/projects/your-project-id'; // Atualize com sua URL

  // Carregar configurações
  async function loadSettings() {
    const settings = await chrome.storage.sync.get([
      'trackingEnabled',
      'notificationsEnabled',
      'soundEnabled'
    ]);

    trackingToggle.checked = settings.trackingEnabled !== false;
    notificationsToggle.checked = settings.notificationsEnabled !== false;
    soundToggle.checked = settings.soundEnabled === true;

    updateStatusIndicator(trackingToggle.checked);
  }

  // Atualizar indicador de status
  function updateStatusIndicator(isActive) {
    if (isActive) {
      statusDot.classList.add('active');
      statusText.textContent = 'Tracking Ativo';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'Tracking Inativo';
    }
  }

  // Salvar configuração
  async function saveSetting(key, value) {
    await chrome.storage.sync.set({ [key]: value });
  }

  // Carregar estatísticas
  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStats' });
      
      if (response && response.emails) {
        const emails = response.emails;
        const totalEmails = emails.length;
        const totalOpens = emails.reduce((sum, e) => sum + (e.opens || 0), 0);
        const totalClicks = emails.reduce((sum, e) => sum + (e.clicks || 0), 0);

        totalEmailsEl.textContent = totalEmails;
        totalOpensEl.textContent = totalOpens;
        totalClicksEl.textContent = totalClicks;

        // Atualizar lista de atividades
        updateActivityList(emails.slice(0, 5));
      }
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
      totalEmailsEl.textContent = '0';
      totalOpensEl.textContent = '0';
      totalClicksEl.textContent = '0';
    }
  }

  // Atualizar lista de atividades
  function updateActivityList(emails) {
    if (emails.length === 0) {
      activityList.innerHTML = `
        <div class="activity-empty">
          <span class="activity-empty-icon">📭</span>
          <span class="activity-empty-text">Nenhuma atividade ainda</span>
        </div>
      `;
      return;
    }

    activityList.innerHTML = emails.map(email => {
      const icon = email.opens > 0 ? '👁️' : '📧';
      const time = formatTimeAgo(new Date(email.created_at));
      
      return `
        <div class="activity-item">
          <span class="activity-icon">${icon}</span>
          <div class="activity-content">
            <div class="activity-email">${email.recipient_email}</div>
            <div class="activity-time">${time}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Formatar tempo relativo
  function formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  }

  // Event listeners
  trackingToggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await saveSetting('trackingEnabled', enabled);
    updateStatusIndicator(enabled);

    // Notificar content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('mail.google.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'toggleTracking', 
        enabled 
      });
    }
  });

  notificationsToggle.addEventListener('change', async (e) => {
    await saveSetting('notificationsEnabled', e.target.checked);
  });

  soundToggle.addEventListener('change', async (e) => {
    await saveSetting('soundEnabled', e.target.checked);
  });

  openDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: DASHBOARD_URL });
  });

  // Inicialização
  await loadSettings();
  await loadStats();

  // Atualizar stats periodicamente
  setInterval(loadStats, 30000);
});

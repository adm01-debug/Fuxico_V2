// Bitrix24 CRM Integration Service
// Currently using mock data - can be switched to real API later

export interface Bitrix24Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  lastActivity?: string;
  source?: string;
}

export interface Bitrix24Activity {
  id: string;
  type: 'email_open' | 'link_click' | 'document_view';
  subject: string;
  contactId: string;
  contactName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Bitrix24Deal {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  stage: string;
  value?: number;
  currency?: string;
  createdAt: string;
}

export interface Bitrix24Config {
  enabled: boolean;
  useMock: boolean;
  webhookUrl?: string;
  autoSyncContacts: boolean;
  autoRegisterActivities: boolean;
  autoCreateDeals: boolean;
  sendNotifications: boolean;
}

// Default config - starts with mock enabled
const defaultConfig: Bitrix24Config = {
  enabled: true,
  useMock: true,
  autoSyncContacts: true,
  autoRegisterActivities: true,
  autoCreateDeals: false,
  sendNotifications: true,
};

// Mock data
const mockContacts: Bitrix24Contact[] = [
  {
    id: 'mock-1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com.br',
    phone: '+55 11 99999-0001',
    company: 'Tech Solutions Ltda',
    lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    source: 'FUXICO',
  },
  {
    id: 'mock-2',
    name: 'Maria Santos',
    email: 'maria.santos@corporacao.com',
    phone: '+55 21 98888-0002',
    company: 'Corporação ABC',
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    source: 'FUXICO',
  },
  {
    id: 'mock-3',
    name: 'Pedro Oliveira',
    email: 'pedro@startup.io',
    phone: '+55 31 97777-0003',
    company: 'Startup Innovation',
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    source: 'FUXICO',
  },
];

const mockActivities: Bitrix24Activity[] = [
  {
    id: 'act-1',
    type: 'email_open',
    subject: 'Proposta Comercial - Q4 2024',
    contactId: 'mock-1',
    contactName: 'João Silva',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'act-2',
    type: 'link_click',
    subject: 'Link: Catálogo de Produtos',
    contactId: 'mock-1',
    contactName: 'João Silva',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    metadata: { url: 'https://exemplo.com/catalogo' },
  },
  {
    id: 'act-3',
    type: 'document_view',
    subject: 'Documento: Contrato de Serviços.pdf',
    contactId: 'mock-2',
    contactName: 'Maria Santos',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'act-4',
    type: 'email_open',
    subject: 'Follow-up Reunião',
    contactId: 'mock-3',
    contactName: 'Pedro Oliveira',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

const mockDeals: Bitrix24Deal[] = [
  {
    id: 'deal-1',
    title: 'Contrato Anual - Tech Solutions',
    contactId: 'mock-1',
    contactName: 'João Silva',
    stage: 'Negociação',
    value: 45000,
    currency: 'BRL',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'deal-2',
    title: 'Projeto Especial - Corporação ABC',
    contactId: 'mock-2',
    contactName: 'Maria Santos',
    stage: 'Proposta Enviada',
    value: 120000,
    currency: 'BRL',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

class Bitrix24Service {
  private config: Bitrix24Config;

  constructor() {
    const saved = localStorage.getItem('bitrix24_config');
    this.config = saved ? JSON.parse(saved) : defaultConfig;
  }

  getConfig(): Bitrix24Config {
    return { ...this.config };
  }

  updateConfig(updates: Partial<Bitrix24Config>): void {
    this.config = { ...this.config, ...updates };
    localStorage.setItem('bitrix24_config', JSON.stringify(this.config));
  }

  async getContacts(): Promise<Bitrix24Contact[]> {
    if (this.config.useMock) {
      await this.simulateDelay();
      return [...mockContacts];
    }
    // TODO: Real API call
    return [];
  }

  async getActivities(): Promise<Bitrix24Activity[]> {
    if (this.config.useMock) {
      await this.simulateDelay();
      return [...mockActivities];
    }
    // TODO: Real API call
    return [];
  }

  async getDeals(): Promise<Bitrix24Deal[]> {
    if (this.config.useMock) {
      await this.simulateDelay();
      return [...mockDeals];
    }
    // TODO: Real API call
    return [];
  }

  async syncContact(email: string, name?: string): Promise<Bitrix24Contact | null> {
    if (this.config.useMock) {
      await this.simulateDelay();
      const existing = mockContacts.find(c => c.email === email);
      if (existing) return existing;
      
      const newContact: Bitrix24Contact = {
        id: `mock-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        lastActivity: new Date().toISOString(),
        source: 'FUXICO',
      };
      mockContacts.push(newContact);
      return newContact;
    }
    // TODO: Real API call
    return null;
  }

  async registerActivity(
    type: Bitrix24Activity['type'],
    subject: string,
    contactEmail: string,
    metadata?: Record<string, unknown>
  ): Promise<Bitrix24Activity | null> {
    if (!this.config.autoRegisterActivities) return null;

    if (this.config.useMock) {
      await this.simulateDelay();
      const contact = mockContacts.find(c => c.email === contactEmail);
      const activity: Bitrix24Activity = {
        id: `act-${Date.now()}`,
        type,
        subject,
        contactId: contact?.id || 'unknown',
        contactName: contact?.name || contactEmail,
        timestamp: new Date().toISOString(),
        metadata,
      };
      mockActivities.unshift(activity);
      return activity;
    }
    // TODO: Real API call
    return null;
  }

  async createDeal(
    title: string,
    contactEmail: string,
    value?: number
  ): Promise<Bitrix24Deal | null> {
    if (!this.config.autoCreateDeals) return null;

    if (this.config.useMock) {
      await this.simulateDelay();
      const contact = mockContacts.find(c => c.email === contactEmail);
      const deal: Bitrix24Deal = {
        id: `deal-${Date.now()}`,
        title,
        contactId: contact?.id || 'unknown',
        contactName: contact?.name || contactEmail,
        stage: 'Novo',
        value,
        currency: 'BRL',
        createdAt: new Date().toISOString(),
      };
      mockDeals.unshift(deal);
      return deal;
    }
    // TODO: Real API call
    return null;
  }

  async sendNotification(message: string): Promise<boolean> {
    if (!this.config.sendNotifications) return false;

    if (this.config.useMock) {
      await this.simulateDelay();
      console.log('[Bitrix24 Mock] Notificação:', message);
      return true;
    }
    // TODO: Real API call
    return false;
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  }
}

export const bitrix24 = new Bitrix24Service();

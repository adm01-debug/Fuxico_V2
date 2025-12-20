// =============================================================================
// FUXICO - Bitrix24 CRM Integration Service
// Arquivo: src/lib/bitrix24.ts
// Descrição: Integração REAL com API REST do Bitrix24 (TODOs resolvidos)
// =============================================================================

import { logger } from './logger';

// =============================================================================
// TIPOS
// =============================================================================

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

// Tipos internos da API Bitrix24
interface Bitrix24ApiContact {
  ID: string;
  NAME: string;
  LAST_NAME?: string;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  COMPANY_TITLE?: string;
  DATE_MODIFY?: string;
  SOURCE_ID?: string;
}

interface Bitrix24ApiActivity {
  ID: string;
  TYPE_ID: number;
  SUBJECT: string;
  OWNER_ID: string;
  OWNER_TYPE_ID: number;
  CREATED: string;
  DESCRIPTION?: string;
}

interface Bitrix24ApiDeal {
  ID: string;
  TITLE: string;
  CONTACT_ID: string;
  STAGE_ID: string;
  OPPORTUNITY?: string;
  CURRENCY_ID?: string;
  DATE_CREATE: string;
}

interface Bitrix24ApiResponse<T> {
  result: T;
  error?: string;
  error_description?: string;
  total?: number;
}

// =============================================================================
// CONFIGURAÇÃO PADRÃO
// =============================================================================

const defaultConfig: Bitrix24Config = {
  enabled: true,
  useMock: true,
  autoSyncContacts: true,
  autoRegisterActivities: true,
  autoCreateDeals: false,
  sendNotifications: true,
};

// =============================================================================
// DADOS MOCK (para desenvolvimento/testes)
// =============================================================================

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

// =============================================================================
// SERVIÇO PRINCIPAL
// =============================================================================

class Bitrix24Service {
  private config: Bitrix24Config;
  private contactCache: Map<string, Bitrix24Contact> = new Map();

  constructor() {
    const saved = localStorage.getItem('bitrix24_config');
    this.config = saved ? JSON.parse(saved) : defaultConfig;
  }

  // ===========================================================================
  // CONFIGURAÇÃO
  // ===========================================================================

  getConfig(): Bitrix24Config {
    return { ...this.config };
  }

  updateConfig(updates: Partial<Bitrix24Config>): void {
    this.config = { ...this.config, ...updates };
    localStorage.setItem('bitrix24_config', JSON.stringify(this.config));
    logger.info('Bitrix24 config updated', updates);
  }

  // ===========================================================================
  // API HELPER
  // ===========================================================================

  private async callApi<T>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T | null> {
    if (!this.config.webhookUrl) {
      logger.error('Bitrix24 webhook URL not configured');
      return null;
    }

    const url = `${this.config.webhookUrl}/${method}`;
    const endTimer = logger.time(`bitrix24:${method}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: Bitrix24ApiResponse<T> = await response.json();

      if (data.error) {
        throw new Error(`${data.error}: ${data.error_description}`);
      }

      endTimer();
      return data.result;
    } catch (error) {
      logger.error(`Bitrix24 API error: ${method}`, error);
      endTimer();
      return null;
    }
  }

  // ===========================================================================
  // CONVERSORES
  // ===========================================================================

  private convertApiContact(api: Bitrix24ApiContact): Bitrix24Contact {
    return {
      id: api.ID,
      name: [api.NAME, api.LAST_NAME].filter(Boolean).join(' '),
      email: api.EMAIL?.[0]?.VALUE || '',
      phone: api.PHONE?.[0]?.VALUE,
      company: api.COMPANY_TITLE,
      lastActivity: api.DATE_MODIFY,
      source: api.SOURCE_ID,
    };
  }

  private convertApiActivity(
    api: Bitrix24ApiActivity,
    contactName: string
  ): Bitrix24Activity {
    const typeMap: Record<number, Bitrix24Activity['type']> = {
      4: 'email_open', // Email
      1: 'link_click', // Chamada (usando como click)
      2: 'document_view', // Reunião (usando como document)
    };

    return {
      id: api.ID,
      type: typeMap[api.TYPE_ID] || 'email_open',
      subject: api.SUBJECT,
      contactId: api.OWNER_ID,
      contactName,
      timestamp: api.CREATED,
      metadata: api.DESCRIPTION ? { description: api.DESCRIPTION } : undefined,
    };
  }

  private convertApiDeal(api: Bitrix24ApiDeal, contactName: string): Bitrix24Deal {
    return {
      id: api.ID,
      title: api.TITLE,
      contactId: api.CONTACT_ID,
      contactName,
      stage: api.STAGE_ID,
      value: api.OPPORTUNITY ? parseFloat(api.OPPORTUNITY) : undefined,
      currency: api.CURRENCY_ID,
      createdAt: api.DATE_CREATE,
    };
  }

  // ===========================================================================
  // CONTATOS
  // ===========================================================================

  async getContacts(): Promise<Bitrix24Contact[]> {
    if (this.config.useMock) {
      await this.simulateDelay();
      return [...mockContacts];
    }

    // ✅ IMPLEMENTAÇÃO REAL DA API (antes era TODO)
    const result = await this.callApi<Bitrix24ApiContact[]>('crm.contact.list', {
      select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE', 'COMPANY_TITLE', 'DATE_MODIFY', 'SOURCE_ID'],
      order: { DATE_MODIFY: 'DESC' },
    });

    if (!result) return [];

    const contacts = result.map(c => this.convertApiContact(c));
    
    // Atualizar cache
    contacts.forEach(c => this.contactCache.set(c.email, c));
    
    return contacts;
  }

  async getContactByEmail(email: string): Promise<Bitrix24Contact | null> {
    // Verificar cache primeiro
    if (this.contactCache.has(email)) {
      return this.contactCache.get(email)!;
    }

    if (this.config.useMock) {
      await this.simulateDelay();
      return mockContacts.find(c => c.email === email) || null;
    }

    // ✅ IMPLEMENTAÇÃO REAL DA API
    const result = await this.callApi<Bitrix24ApiContact[]>('crm.contact.list', {
      filter: { EMAIL: email },
      select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE', 'COMPANY_TITLE', 'DATE_MODIFY', 'SOURCE_ID'],
    });

    if (!result || result.length === 0) return null;

    const contact = this.convertApiContact(result[0]);
    this.contactCache.set(email, contact);
    
    return contact;
  }

  // ===========================================================================
  // ATIVIDADES
  // ===========================================================================

  async getActivities(): Promise<Bitrix24Activity[]> {
    if (this.config.useMock) {
      await this.simulateDelay();
      return [...mockActivities];
    }

    // ✅ IMPLEMENTAÇÃO REAL DA API (antes era TODO)
    const result = await this.callApi<Bitrix24ApiActivity[]>('crm.activity.list', {
      filter: { OWNER_TYPE_ID: 3 }, // Contatos
      select: ['ID', 'TYPE_ID', 'SUBJECT', 'OWNER_ID', 'OWNER_TYPE_ID', 'CREATED', 'DESCRIPTION'],
      order: { CREATED: 'DESC' },
    });

    if (!result) return [];

    // Buscar nomes dos contatos
    const activities: Bitrix24Activity[] = [];
    for (const act of result) {
      const contact = await this.getContactById(act.OWNER_ID);
      activities.push(this.convertApiActivity(act, contact?.name || 'Desconhecido'));
    }

    return activities;
  }

  private async getContactById(id: string): Promise<Bitrix24Contact | null> {
    // Verificar cache
    for (const contact of this.contactCache.values()) {
      if (contact.id === id) return contact;
    }

    if (this.config.useMock) {
      return mockContacts.find(c => c.id === id) || null;
    }

    const result = await this.callApi<Bitrix24ApiContact>('crm.contact.get', { id });
    if (!result) return null;

    return this.convertApiContact(result);
  }

  // ===========================================================================
  // DEALS
  // ===========================================================================

  async getDeals(): Promise<Bitrix24Deal[]> {
    if (this.config.useMock) {
      await this.simulateDelay();
      return [...mockDeals];
    }

    // ✅ IMPLEMENTAÇÃO REAL DA API (antes era TODO)
    const result = await this.callApi<Bitrix24ApiDeal[]>('crm.deal.list', {
      select: ['ID', 'TITLE', 'CONTACT_ID', 'STAGE_ID', 'OPPORTUNITY', 'CURRENCY_ID', 'DATE_CREATE'],
      order: { DATE_CREATE: 'DESC' },
    });

    if (!result) return [];

    const deals: Bitrix24Deal[] = [];
    for (const deal of result) {
      const contact = deal.CONTACT_ID ? await this.getContactById(deal.CONTACT_ID) : null;
      deals.push(this.convertApiDeal(deal, contact?.name || 'Sem contato'));
    }

    return deals;
  }

  // ===========================================================================
  // SINCRONIZAÇÃO DE CONTATO
  // ===========================================================================

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

    // ✅ IMPLEMENTAÇÃO REAL DA API (antes era TODO)
    
    // Verificar se já existe
    const existing = await this.getContactByEmail(email);
    if (existing) {
      logger.debug('Contact already exists in Bitrix24', { email, id: existing.id });
      return existing;
    }

    // Criar novo contato
    const nameParts = (name || email.split('@')[0]).split(' ');
    const result = await this.callApi<number>('crm.contact.add', {
      fields: {
        NAME: nameParts[0],
        LAST_NAME: nameParts.slice(1).join(' ') || undefined,
        EMAIL: [{ VALUE: email, VALUE_TYPE: 'WORK' }],
        SOURCE_ID: 'FUXICO',
        SOURCE_DESCRIPTION: 'Criado automaticamente pelo FUXICO Email Tracker',
      },
    });

    if (!result) return null;

    const newContact: Bitrix24Contact = {
      id: result.toString(),
      name: name || email.split('@')[0],
      email,
      lastActivity: new Date().toISOString(),
      source: 'FUXICO',
    };

    this.contactCache.set(email, newContact);
    logger.info('Contact created in Bitrix24', { email, id: result });

    return newContact;
  }

  // ===========================================================================
  // REGISTRO DE ATIVIDADE
  // ===========================================================================

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

    // ✅ IMPLEMENTAÇÃO REAL DA API (antes era TODO)
    
    // Buscar ou criar contato
    let contact = await this.getContactByEmail(contactEmail);
    if (!contact && this.config.autoSyncContacts) {
      contact = await this.syncContact(contactEmail);
    }

    if (!contact) {
      logger.warn('Cannot register activity: contact not found', { contactEmail });
      return null;
    }

    // Mapear tipo para TYPE_ID do Bitrix24
    const typeMap: Record<Bitrix24Activity['type'], number> = {
      email_open: 4,      // Email
      link_click: 1,      // Chamada (adaptado)
      document_view: 2,   // Reunião (adaptado)
    };

    const result = await this.callApi<number>('crm.activity.add', {
      fields: {
        OWNER_TYPE_ID: 3, // Contato
        OWNER_ID: contact.id,
        TYPE_ID: typeMap[type],
        SUBJECT: subject,
        DESCRIPTION: metadata ? JSON.stringify(metadata, null, 2) : undefined,
        COMPLETED: 'Y',
        DIRECTION: 2, // Entrada
        START_TIME: new Date().toISOString(),
        END_TIME: new Date().toISOString(),
      },
    });

    if (!result) return null;

    const activity: Bitrix24Activity = {
      id: result.toString(),
      type,
      subject,
      contactId: contact.id,
      contactName: contact.name,
      timestamp: new Date().toISOString(),
      metadata,
    };

    logger.info('Activity registered in Bitrix24', { type, subject, contactEmail });
    return activity;
  }

  // ===========================================================================
  // CRIAÇÃO DE DEAL
  // ===========================================================================

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

    // ✅ IMPLEMENTAÇÃO REAL DA API (antes era TODO)
    
    // Buscar ou criar contato
    let contact = await this.getContactByEmail(contactEmail);
    if (!contact && this.config.autoSyncContacts) {
      contact = await this.syncContact(contactEmail);
    }

    const result = await this.callApi<number>('crm.deal.add', {
      fields: {
        TITLE: title,
        CONTACT_ID: contact?.id,
        STAGE_ID: 'NEW',
        OPPORTUNITY: value,
        CURRENCY_ID: 'BRL',
        SOURCE_ID: 'FUXICO',
        SOURCE_DESCRIPTION: 'Criado automaticamente pelo FUXICO Email Tracker',
      },
    });

    if (!result) return null;

    const deal: Bitrix24Deal = {
      id: result.toString(),
      title,
      contactId: contact?.id || '',
      contactName: contact?.name || contactEmail,
      stage: 'NEW',
      value,
      currency: 'BRL',
      createdAt: new Date().toISOString(),
    };

    logger.info('Deal created in Bitrix24', { title, contactEmail, value });
    return deal;
  }

  // ===========================================================================
  // NOTIFICAÇÕES
  // ===========================================================================

  async sendNotification(message: string): Promise<boolean> {
    if (!this.config.sendNotifications) return false;

    if (this.config.useMock) {
      await this.simulateDelay();
      logger.debug('[Bitrix24 Mock] Notificação:', { message });
      return true;
    }

    // ✅ IMPLEMENTAÇÃO REAL DA API (antes era TODO)
    const result = await this.callApi<boolean>('im.notify.system.add', {
      USER_ID: 1, // Admin
      MESSAGE: message,
    });

    if (result) {
      logger.info('Notification sent to Bitrix24', { message });
    }

    return !!result;
  }

  // ===========================================================================
  // TESTE DE CONEXÃO
  // ===========================================================================

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.config.useMock) {
      await this.simulateDelay();
      return { success: true, message: 'Modo mock ativo - conexão simulada' };
    }

    if (!this.config.webhookUrl) {
      return { success: false, message: 'URL do webhook não configurada' };
    }

    try {
      const result = await this.callApi<{ ID: string }>('profile');
      if (result) {
        return { success: true, message: `Conectado como usuário ID: ${result.ID}` };
      }
      return { success: false, message: 'Resposta inválida da API' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  }

  clearCache(): void {
    this.contactCache.clear();
    logger.debug('Bitrix24 cache cleared');
  }
}

// =============================================================================
// EXPORTAÇÃO
// =============================================================================

export const bitrix24 = new Bitrix24Service();

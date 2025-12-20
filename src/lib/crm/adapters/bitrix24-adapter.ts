// =============================================================================
// FUXICO - Bitrix24 CRM Adapter
// Arquivo: src/lib/crm/adapters/bitrix24-adapter.ts
// Descrição: Implementação do adapter para Bitrix24
// =============================================================================

import { logger } from '@/lib/logger';
import { BaseCRMAdapter } from './base-adapter';
import type {
  CRMProviderType,
  CRMConfig,
  CRMContact,
  CRMActivity,
  CRMDeal,
  CRMOperationResult,
  CRMSyncResult,
} from '../types';

// =============================================================================
// TIPOS ESPECÍFICOS BITRIX24
// =============================================================================

interface Bitrix24Config extends CRMConfig {
  providerConfig?: {
    webhookUrl?: string;
    defaultDealStage?: string;
    defaultDealCategory?: string;
  };
}

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
// ADAPTER
// =============================================================================

export class Bitrix24Adapter extends BaseCRMAdapter {
  readonly providerType: CRMProviderType = 'bitrix24';
  readonly providerName = 'Bitrix24';
  
  constructor(initialConfig?: Partial<Bitrix24Config>) {
    super(initialConfig);
    this.loadConfig();
  }
  
  // ===========================================================================
  // CONFIGURAÇÃO
  // ===========================================================================
  
  private get webhookUrl(): string | undefined {
    return (this.config as Bitrix24Config).providerConfig?.webhookUrl;
  }
  
  isConfigured(): boolean {
    return !!this.webhookUrl;
  }
  
  async testConnection(): Promise<CRMOperationResult<{ connected: boolean }>> {
    if (!this.webhookUrl) {
      return { success: false, error: 'Webhook URL não configurada', data: { connected: false } };
    }
    
    try {
      const result = await this.callApi<{ ID: string }>('profile');
      return { 
        success: !!result, 
        data: { connected: !!result },
        message: result ? 'Conectado com sucesso' : 'Falha na conexão',
      };
    } catch (error) {
      return { success: false, error: String(error), data: { connected: false } };
    }
  }
  
  // ===========================================================================
  // API HELPER
  // ===========================================================================
  
  private async callApi<T>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T | null> {
    if (!this.webhookUrl) {
      logger.error('Bitrix24 webhook URL not configured');
      return null;
    }

    const url = `${this.webhookUrl}/${method}`;
    const endTimer = logger.time(`bitrix24:${method}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  
  private convertContact(api: Bitrix24ApiContact): CRMContact {
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
  
  private convertActivity(api: Bitrix24ApiActivity, contactName: string): CRMActivity {
    const typeMap: Record<number, CRMActivity['type']> = {
      4: 'email_open',
      1: 'link_click',
      2: 'document_view',
    };

    return {
      id: api.ID,
      type: typeMap[api.TYPE_ID] || 'custom',
      subject: api.SUBJECT,
      contactId: api.OWNER_ID,
      contactName,
      timestamp: api.CREATED,
      metadata: api.DESCRIPTION ? { description: api.DESCRIPTION } : undefined,
    };
  }
  
  private convertDeal(api: Bitrix24ApiDeal, contactName: string): CRMDeal {
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
  // IMPLEMENTAÇÕES ABSTRATAS
  // ===========================================================================
  
  protected async fetchContacts(limit = 50): Promise<CRMContact[]> {
    const result = await this.callApi<Bitrix24ApiContact[]>('crm.contact.list', {
      select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE', 'COMPANY_TITLE', 'DATE_MODIFY', 'SOURCE_ID'],
      order: { DATE_MODIFY: 'DESC' },
      start: 0,
    });

    if (!result) return [];
    return result.slice(0, limit).map(c => this.convertContact(c));
  }
  
  protected async fetchContactByEmail(email: string): Promise<CRMContact | null> {
    const result = await this.callApi<Bitrix24ApiContact[]>('crm.contact.list', {
      filter: { EMAIL: email },
      select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE', 'COMPANY_TITLE', 'DATE_MODIFY', 'SOURCE_ID'],
    });

    if (!result || result.length === 0) return null;
    return this.convertContact(result[0]);
  }
  
  protected async createContact(
    email: string, 
    name?: string, 
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const nameParts = (name || email.split('@')[0]).split(' ');
    
    const result = await this.callApi<number>('crm.contact.add', {
      fields: {
        NAME: nameParts[0],
        LAST_NAME: nameParts.slice(1).join(' ') || undefined,
        EMAIL: [{ VALUE: email, VALUE_TYPE: 'WORK' }],
        PHONE: metadata?.phone ? [{ VALUE: metadata.phone, VALUE_TYPE: 'WORK' }] : undefined,
        COMPANY_TITLE: metadata?.company,
        SOURCE_ID: 'FUXICO',
        SOURCE_DESCRIPTION: 'Criado automaticamente pelo FUXICO Email Tracker',
      },
    });

    if (!result) {
      return { success: false, error: 'Failed to create contact' };
    }

    logger.info('Bitrix24: Contact created', { email, id: result });
    return { success: true, contactId: result.toString(), isNew: true };
  }
  
  protected async fetchActivities(limit = 50): Promise<CRMActivity[]> {
    const result = await this.callApi<Bitrix24ApiActivity[]>('crm.activity.list', {
      filter: { OWNER_TYPE_ID: 3 },
      select: ['ID', 'TYPE_ID', 'SUBJECT', 'OWNER_ID', 'OWNER_TYPE_ID', 'CREATED', 'DESCRIPTION'],
      order: { CREATED: 'DESC' },
    });

    if (!result) return [];

    const activities: CRMActivity[] = [];
    for (const act of result.slice(0, limit)) {
      const contact = this.contactCache.get(act.OWNER_ID) || 
        await this.fetchContactById(act.OWNER_ID);
      activities.push(this.convertActivity(act, contact?.name || 'Desconhecido'));
    }

    return activities;
  }
  
  private async fetchContactById(id: string): Promise<CRMContact | null> {
    const result = await this.callApi<Bitrix24ApiContact>('crm.contact.get', { id });
    if (!result) return null;
    return this.convertContact(result);
  }
  
  protected async createActivity(
    type: CRMActivity['type'],
    subject: string,
    contactId: string,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const typeMap: Record<CRMActivity['type'], number> = {
      email_open: 4,
      link_click: 1,
      document_view: 2,
      custom: 6,
    };

    const result = await this.callApi<number>('crm.activity.add', {
      fields: {
        OWNER_TYPE_ID: 3,
        OWNER_ID: contactId,
        TYPE_ID: typeMap[type],
        SUBJECT: subject,
        DESCRIPTION: metadata?.description || `FUXICO: ${type} - ${subject}`,
        DIRECTION: 1,
        COMPLETED: 'Y',
        RESPONSIBLE_ID: 1,
      },
    });

    if (!result) {
      return { success: false, error: 'Failed to create activity' };
    }

    logger.info('Bitrix24: Activity registered', { type, subject, activityId: result });
    return { success: true, activityId: result.toString() };
  }
  
  protected async fetchDeals(limit = 50): Promise<CRMDeal[]> {
    const result = await this.callApi<Bitrix24ApiDeal[]>('crm.deal.list', {
      select: ['ID', 'TITLE', 'CONTACT_ID', 'STAGE_ID', 'OPPORTUNITY', 'CURRENCY_ID', 'DATE_CREATE'],
      order: { DATE_CREATE: 'DESC' },
    });

    if (!result) return [];

    const deals: CRMDeal[] = [];
    for (const deal of result.slice(0, limit)) {
      const contact = deal.CONTACT_ID ? 
        (this.contactCache.get(deal.CONTACT_ID) || await this.fetchContactById(deal.CONTACT_ID)) : 
        null;
      deals.push(this.convertDeal(deal, contact?.name || 'Sem contato'));
    }

    return deals;
  }
  
  protected async createDealInternal(
    title: string,
    contactId: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const config = this.config as Bitrix24Config;
    
    const result = await this.callApi<number>('crm.deal.add', {
      fields: {
        TITLE: title,
        CONTACT_ID: contactId,
        STAGE_ID: config.providerConfig?.defaultDealStage || 'NEW',
        CATEGORY_ID: config.providerConfig?.defaultDealCategory || '0',
        OPPORTUNITY: value,
        CURRENCY_ID: 'BRL',
        SOURCE_ID: 'FUXICO',
        SOURCE_DESCRIPTION: 'Criado automaticamente pelo FUXICO Email Tracker',
        ...(metadata || {}),
      },
    });

    if (!result) {
      return { success: false, error: 'Failed to create deal' };
    }

    logger.info('Bitrix24: Deal created', { title, dealId: result });
    return { success: true, dealId: result.toString(), isNew: true };
  }
  
  protected async sendNotificationInternal(message: string, userId?: string): Promise<CRMOperationResult> {
    const result = await this.callApi<boolean>('im.notify.system.add', {
      USER_ID: userId || 1,
      MESSAGE: message,
    });

    return { success: !!result };
  }
}

// =============================================================================
// FUXICO - HubSpot CRM Adapter
// Arquivo: src/lib/crm/adapters/hubspot-adapter.ts
// Descrição: Implementação do adapter para HubSpot (estrutura base)
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
// TIPOS ESPECÍFICOS HUBSPOT
// =============================================================================

interface HubSpotConfig extends CRMConfig {
  providerConfig?: {
    apiKey?: string;
    portalId?: string;
  };
}

// =============================================================================
// ADAPTER
// =============================================================================

export class HubSpotAdapter extends BaseCRMAdapter {
  readonly providerType: CRMProviderType = 'hubspot';
  readonly providerName = 'HubSpot';
  
  private readonly baseUrl = 'https://api.hubapi.com';
  
  constructor(initialConfig?: Partial<HubSpotConfig>) {
    super(initialConfig);
    this.loadConfig();
  }
  
  // ===========================================================================
  // CONFIGURAÇÃO
  // ===========================================================================
  
  private get apiKey(): string | undefined {
    return (this.config as HubSpotConfig).providerConfig?.apiKey;
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  async testConnection(): Promise<CRMOperationResult<{ connected: boolean }>> {
    if (!this.apiKey) {
      return { success: false, error: 'API Key não configurada', data: { connected: false } };
    }
    
    try {
      const response = await this.callApi('/crm/v3/objects/contacts?limit=1');
      return { 
        success: !!response, 
        data: { connected: !!response },
        message: response ? 'Conectado com sucesso' : 'Falha na conexão',
      };
    } catch (error) {
      return { success: false, error: String(error), data: { connected: false } };
    }
  }
  
  // ===========================================================================
  // API HELPER
  // ===========================================================================
  
  private async callApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    if (!this.apiKey) {
      logger.error('HubSpot API Key not configured');
      return null;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const endTimer = logger.time(`hubspot:${endpoint}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${error.message || response.statusText}`);
      }

      endTimer();
      return await response.json();
    } catch (error) {
      logger.error(`HubSpot API error: ${endpoint}`, error);
      endTimer();
      return null;
    }
  }
  
  // ===========================================================================
  // IMPLEMENTAÇÕES ABSTRATAS
  // ===========================================================================
  
  protected async fetchContacts(limit = 50): Promise<CRMContact[]> {
    const result = await this.callApi<{
      results: Array<{
        id: string;
        properties: {
          firstname?: string;
          lastname?: string;
          email?: string;
          phone?: string;
          company?: string;
          hs_lead_status?: string;
        };
      }>;
    }>(`/crm/v3/objects/contacts?limit=${limit}&properties=firstname,lastname,email,phone,company,hs_lead_status`);

    if (!result?.results) return [];

    return result.results.map(c => ({
      id: c.id,
      name: [c.properties.firstname, c.properties.lastname].filter(Boolean).join(' ') || c.properties.email || '',
      email: c.properties.email || '',
      phone: c.properties.phone,
      company: c.properties.company,
      source: c.properties.hs_lead_status,
    }));
  }
  
  protected async fetchContactByEmail(email: string): Promise<CRMContact | null> {
    const result = await this.callApi<{
      results: Array<{
        id: string;
        properties: {
          firstname?: string;
          lastname?: string;
          email?: string;
          phone?: string;
          company?: string;
        };
      }>;
    }>(`/crm/v3/objects/contacts/search`, {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email,
          }],
        }],
        properties: ['firstname', 'lastname', 'email', 'phone', 'company'],
      }),
    });

    if (!result?.results?.[0]) return null;

    const c = result.results[0];
    return {
      id: c.id,
      name: [c.properties.firstname, c.properties.lastname].filter(Boolean).join(' '),
      email: c.properties.email || '',
      phone: c.properties.phone,
      company: c.properties.company,
    };
  }
  
  protected async createContact(
    email: string, 
    name?: string, 
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const nameParts = (name || email.split('@')[0]).split(' ');
    
    const result = await this.callApi<{ id: string }>('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          email,
          firstname: nameParts[0],
          lastname: nameParts.slice(1).join(' ') || undefined,
          phone: metadata?.phone,
          company: metadata?.company,
          hs_lead_status: 'NEW',
        },
      }),
    });

    if (!result) {
      return { success: false, error: 'Failed to create contact' };
    }

    logger.info('HubSpot: Contact created', { email, id: result.id });
    return { success: true, contactId: result.id, isNew: true };
  }
  
  protected async fetchActivities(limit = 50): Promise<CRMActivity[]> {
    const result = await this.callApi<{
      results: Array<{
        id: string;
        properties: {
          hs_activity_type?: string;
          hs_email_subject?: string;
          hs_timestamp?: string;
        };
        associations?: {
          contacts?: { results: Array<{ id: string }> };
        };
      }>;
    }>(`/crm/v3/objects/emails?limit=${limit}&properties=hs_activity_type,hs_email_subject,hs_timestamp`);

    if (!result?.results) return [];

    return result.results.map(a => ({
      id: a.id,
      type: 'email_open' as const,
      subject: a.properties.hs_email_subject || 'Sem assunto',
      contactId: a.associations?.contacts?.results?.[0]?.id || '',
      contactName: 'Contato',
      timestamp: a.properties.hs_timestamp || new Date().toISOString(),
    }));
  }
  
  protected async createActivity(
    type: CRMActivity['type'],
    subject: string,
    contactId: string,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const result = await this.callApi<{ id: string }>('/crm/v3/objects/emails', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          hs_email_subject: subject,
          hs_email_status: 'SENT',
          hs_email_direction: 'EMAIL',
          hs_timestamp: new Date().toISOString(),
          hs_email_text: metadata?.description || `FUXICO: ${type}`,
        },
        associations: [{
          to: { id: contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 9 }],
        }],
      }),
    });

    if (!result) {
      return { success: false, error: 'Failed to create activity' };
    }

    return { success: true, activityId: result.id };
  }
  
  protected async fetchDeals(limit = 50): Promise<CRMDeal[]> {
    const result = await this.callApi<{
      results: Array<{
        id: string;
        properties: {
          dealname?: string;
          dealstage?: string;
          amount?: string;
          createdate?: string;
        };
        associations?: {
          contacts?: { results: Array<{ id: string }> };
        };
      }>;
    }>(`/crm/v3/objects/deals?limit=${limit}&properties=dealname,dealstage,amount,createdate`);

    if (!result?.results) return [];

    return result.results.map(d => ({
      id: d.id,
      title: d.properties.dealname || 'Sem título',
      contactId: d.associations?.contacts?.results?.[0]?.id || '',
      contactName: 'Contato',
      stage: d.properties.dealstage || 'unknown',
      value: d.properties.amount ? parseFloat(d.properties.amount) : undefined,
      currency: 'BRL',
      createdAt: d.properties.createdate || new Date().toISOString(),
    }));
  }
  
  protected async createDealInternal(
    title: string,
    contactId: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const result = await this.callApi<{ id: string }>('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          dealname: title,
          amount: value?.toString(),
          dealstage: 'appointmentscheduled',
          ...(metadata || {}),
        },
        associations: [{
          to: { id: contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
        }],
      }),
    });

    if (!result) {
      return { success: false, error: 'Failed to create deal' };
    }

    return { success: true, dealId: result.id, isNew: true };
  }
  
  protected async sendNotificationInternal(message: string): Promise<CRMOperationResult> {
    // HubSpot doesn't have direct notification API like Bitrix24
    logger.info('HubSpot: Notification requested (not supported)', { message });
    return { success: true, message: 'Notifications not supported by HubSpot API' };
  }
}

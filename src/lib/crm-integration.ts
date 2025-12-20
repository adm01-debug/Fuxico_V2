// =============================================================================
// FUXICO - Abstração para Múltiplos CRMs
// Arquivo: src/lib/crm-integration.ts
// Descrição: Interface unificada para integração com diversos CRMs
// =============================================================================

import { logger } from './logger'

// =============================================================================
// TIPOS BASE
// =============================================================================

/**
 * Tipos de CRM suportados
 */
export type CRMProvider = 'bitrix24' | 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho'

/**
 * Contato unificado
 */
export interface CRMContact {
  id: string
  externalId?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  source?: string
  tags?: string[]
  customFields?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/**
 * Deal/Oportunidade unificado
 */
export interface CRMDeal {
  id: string
  externalId?: string
  title: string
  value: number
  currency: string
  stage: string
  probability?: number
  contactId?: string
  companyId?: string
  expectedCloseDate?: Date
  customFields?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/**
 * Atividade unificada
 */
export interface CRMActivity {
  id: string
  externalId?: string
  type: 'email' | 'call' | 'meeting' | 'task' | 'note'
  subject: string
  description?: string
  contactId?: string
  dealId?: string
  dueDate?: Date
  completedAt?: Date
  metadata?: Record<string, unknown>
  createdAt: Date
}

/**
 * Resultado de sincronização
 */
export interface SyncResult {
  success: boolean
  created: number
  updated: number
  failed: number
  errors?: Array<{ id: string; error: string }>
}

/**
 * Configuração de conexão
 */
export interface CRMConfig {
  provider: CRMProvider
  apiUrl?: string
  apiKey?: string
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  webhookUrl?: string
  customConfig?: Record<string, unknown>
}

// =============================================================================
// INTERFACE DO ADAPTER
// =============================================================================

/**
 * Interface que todos os adapters de CRM devem implementar
 */
export interface ICRMAdapter {
  // Informações do provider
  readonly provider: CRMProvider
  readonly isConnected: boolean
  
  // Conexão
  connect(): Promise<void>
  disconnect(): Promise<void>
  testConnection(): Promise<boolean>
  
  // Contatos
  getContacts(params?: { limit?: number; offset?: number; search?: string }): Promise<CRMContact[]>
  getContactById(id: string): Promise<CRMContact | null>
  getContactByEmail(email: string): Promise<CRMContact | null>
  createContact(contact: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMContact>
  updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact>
  deleteContact(id: string): Promise<void>
  
  // Deals
  getDeals(params?: { limit?: number; offset?: number; stage?: string }): Promise<CRMDeal[]>
  getDealById(id: string): Promise<CRMDeal | null>
  createDeal(deal: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMDeal>
  updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal>
  deleteDeal(id: string): Promise<void>
  
  // Atividades
  getActivities(params?: { contactId?: string; dealId?: string }): Promise<CRMActivity[]>
  createActivity(activity: Omit<CRMActivity, 'id' | 'createdAt'>): Promise<CRMActivity>
  
  // Sincronização de emails
  syncEmailOpen(trackingId: string, contactEmail: string): Promise<void>
  syncEmailClick(trackingId: string, contactEmail: string, linkUrl: string): Promise<void>
  
  // Webhooks
  registerWebhook?(eventType: string, url: string): Promise<string>
  unregisterWebhook?(webhookId: string): Promise<void>
}

// =============================================================================
// ADAPTER BASE (Template Method Pattern)
// =============================================================================

/**
 * Classe base abstrata que implementa lógica comum
 */
export abstract class BaseCRMAdapter implements ICRMAdapter {
  abstract readonly provider: CRMProvider
  protected config: CRMConfig
  protected _isConnected = false
  
  constructor(config: CRMConfig) {
    this.config = config
  }
  
  get isConnected(): boolean {
    return this._isConnected
  }
  
  // Métodos que devem ser implementados pelos adapters específicos
  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract testConnection(): Promise<boolean>
  
  abstract getContacts(params?: { limit?: number; offset?: number; search?: string }): Promise<CRMContact[]>
  abstract getContactById(id: string): Promise<CRMContact | null>
  abstract getContactByEmail(email: string): Promise<CRMContact | null>
  abstract createContact(contact: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMContact>
  abstract updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact>
  abstract deleteContact(id: string): Promise<void>
  
  abstract getDeals(params?: { limit?: number; offset?: number; stage?: string }): Promise<CRMDeal[]>
  abstract getDealById(id: string): Promise<CRMDeal | null>
  abstract createDeal(deal: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMDeal>
  abstract updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal>
  abstract deleteDeal(id: string): Promise<void>
  
  abstract getActivities(params?: { contactId?: string; dealId?: string }): Promise<CRMActivity[]>
  abstract createActivity(activity: Omit<CRMActivity, 'id' | 'createdAt'>): Promise<CRMActivity>
  
  // Implementação padrão para sincronização de emails
  async syncEmailOpen(trackingId: string, contactEmail: string): Promise<void> {
    const contact = await this.getContactByEmail(contactEmail)
    if (!contact) {
      logger.warn('Contact not found for email sync', { trackingId, contactEmail })
      return
    }
    
    await this.createActivity({
      type: 'email',
      subject: `Email aberto - ${trackingId}`,
      description: `O contato abriu o email rastreado (ID: ${trackingId})`,
      contactId: contact.id,
      metadata: { trackingId, eventType: 'open' },
    })
    
    logger.info('Email open synced to CRM', { provider: this.provider, trackingId })
  }
  
  async syncEmailClick(trackingId: string, contactEmail: string, linkUrl: string): Promise<void> {
    const contact = await this.getContactByEmail(contactEmail)
    if (!contact) {
      logger.warn('Contact not found for click sync', { trackingId, contactEmail })
      return
    }
    
    await this.createActivity({
      type: 'email',
      subject: `Link clicado - ${trackingId}`,
      description: `O contato clicou no link: ${linkUrl}`,
      contactId: contact.id,
      metadata: { trackingId, eventType: 'click', linkUrl },
    })
    
    logger.info('Email click synced to CRM', { provider: this.provider, trackingId })
  }
  
  // Métodos de webhook (opcional)
  async registerWebhook?(eventType: string, url: string): Promise<string> {
    throw new Error(`Webhooks not supported by ${this.provider}`)
  }
  
  async unregisterWebhook?(webhookId: string): Promise<void> {
    throw new Error(`Webhooks not supported by ${this.provider}`)
  }
}

// =============================================================================
// ADAPTER BITRIX24
// =============================================================================

export class Bitrix24Adapter extends BaseCRMAdapter {
  readonly provider: CRMProvider = 'bitrix24'
  private apiUrl: string
  
  constructor(config: CRMConfig) {
    super(config)
    this.apiUrl = config.apiUrl || ''
  }
  
  async connect(): Promise<void> {
    if (!this.config.accessToken) {
      throw new Error('Bitrix24 access token is required')
    }
    
    const isValid = await this.testConnection()
    if (!isValid) {
      throw new Error('Failed to connect to Bitrix24')
    }
    
    this._isConnected = true
    logger.info('Connected to Bitrix24')
  }
  
  async disconnect(): Promise<void> {
    this._isConnected = false
    logger.info('Disconnected from Bitrix24')
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/rest/profile`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  async getContacts(params?: { limit?: number; offset?: number; search?: string }): Promise<CRMContact[]> {
    const response = await this.makeRequest('crm.contact.list', {
      start: params?.offset || 0,
      filter: params?.search ? { '%NAME': params.search } : undefined,
    })
    
    return (response.result || []).map(this.mapContact)
  }
  
  async getContactById(id: string): Promise<CRMContact | null> {
    const response = await this.makeRequest('crm.contact.get', { id })
    return response.result ? this.mapContact(response.result) : null
  }
  
  async getContactByEmail(email: string): Promise<CRMContact | null> {
    const response = await this.makeRequest('crm.contact.list', {
      filter: { EMAIL: email },
    })
    
    const contacts = response.result || []
    return contacts.length > 0 ? this.mapContact(contacts[0]) : null
  }
  
  async createContact(contact: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMContact> {
    const response = await this.makeRequest('crm.contact.add', {
      fields: {
        NAME: contact.firstName,
        LAST_NAME: contact.lastName,
        EMAIL: [{ VALUE: contact.email, VALUE_TYPE: 'WORK' }],
        PHONE: contact.phone ? [{ VALUE: contact.phone, VALUE_TYPE: 'WORK' }] : undefined,
        COMPANY_TITLE: contact.company,
        POST: contact.position,
      },
    })
    
    return this.getContactById(response.result) as Promise<CRMContact>
  }
  
  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    await this.makeRequest('crm.contact.update', {
      id,
      fields: {
        NAME: contact.firstName,
        LAST_NAME: contact.lastName,
        COMPANY_TITLE: contact.company,
        POST: contact.position,
      },
    })
    
    return this.getContactById(id) as Promise<CRMContact>
  }
  
  async deleteContact(id: string): Promise<void> {
    await this.makeRequest('crm.contact.delete', { id })
  }
  
  async getDeals(params?: { limit?: number; offset?: number; stage?: string }): Promise<CRMDeal[]> {
    const response = await this.makeRequest('crm.deal.list', {
      start: params?.offset || 0,
      filter: params?.stage ? { STAGE_ID: params.stage } : undefined,
    })
    
    return (response.result || []).map(this.mapDeal)
  }
  
  async getDealById(id: string): Promise<CRMDeal | null> {
    const response = await this.makeRequest('crm.deal.get', { id })
    return response.result ? this.mapDeal(response.result) : null
  }
  
  async createDeal(deal: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMDeal> {
    const response = await this.makeRequest('crm.deal.add', {
      fields: {
        TITLE: deal.title,
        OPPORTUNITY: deal.value,
        CURRENCY_ID: deal.currency,
        STAGE_ID: deal.stage,
        CONTACT_ID: deal.contactId,
      },
    })
    
    return this.getDealById(response.result) as Promise<CRMDeal>
  }
  
  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    await this.makeRequest('crm.deal.update', {
      id,
      fields: {
        TITLE: deal.title,
        OPPORTUNITY: deal.value,
        STAGE_ID: deal.stage,
      },
    })
    
    return this.getDealById(id) as Promise<CRMDeal>
  }
  
  async deleteDeal(id: string): Promise<void> {
    await this.makeRequest('crm.deal.delete', { id })
  }
  
  async getActivities(params?: { contactId?: string; dealId?: string }): Promise<CRMActivity[]> {
    const response = await this.makeRequest('crm.activity.list', {
      filter: {
        OWNER_TYPE_ID: params?.contactId ? 3 : params?.dealId ? 2 : undefined,
        OWNER_ID: params?.contactId || params?.dealId,
      },
    })
    
    return (response.result || []).map(this.mapActivity)
  }
  
  async createActivity(activity: Omit<CRMActivity, 'id' | 'createdAt'>): Promise<CRMActivity> {
    const response = await this.makeRequest('crm.activity.add', {
      fields: {
        SUBJECT: activity.subject,
        DESCRIPTION: activity.description,
        TYPE_ID: this.getActivityTypeId(activity.type),
        OWNER_TYPE_ID: activity.contactId ? 3 : 2,
        OWNER_ID: activity.contactId || activity.dealId,
        COMPLETED: activity.completedAt ? 'Y' : 'N',
      },
    })
    
    return {
      id: response.result,
      ...activity,
      createdAt: new Date(),
    }
  }
  
  // Helpers privados
  private async makeRequest(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.apiUrl}/rest/${method}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    
    if (!response.ok) {
      throw new Error(`Bitrix24 API error: ${response.status}`)
    }
    
    return response.json()
  }
  
  private mapContact(data: Record<string, unknown>): CRMContact {
    const emails = data.EMAIL as Array<{ VALUE: string }> || []
    const phones = data.PHONE as Array<{ VALUE: string }> || []
    
    return {
      id: String(data.ID),
      externalId: String(data.ID),
      firstName: String(data.NAME || ''),
      lastName: String(data.LAST_NAME || ''),
      email: emails[0]?.VALUE || '',
      phone: phones[0]?.VALUE,
      company: data.COMPANY_TITLE as string,
      position: data.POST as string,
      createdAt: new Date(data.DATE_CREATE as string),
      updatedAt: new Date(data.DATE_MODIFY as string),
    }
  }
  
  private mapDeal(data: Record<string, unknown>): CRMDeal {
    return {
      id: String(data.ID),
      externalId: String(data.ID),
      title: String(data.TITLE || ''),
      value: Number(data.OPPORTUNITY || 0),
      currency: String(data.CURRENCY_ID || 'BRL'),
      stage: String(data.STAGE_ID || ''),
      contactId: data.CONTACT_ID ? String(data.CONTACT_ID) : undefined,
      createdAt: new Date(data.DATE_CREATE as string),
      updatedAt: new Date(data.DATE_MODIFY as string),
    }
  }
  
  private mapActivity(data: Record<string, unknown>): CRMActivity {
    return {
      id: String(data.ID),
      externalId: String(data.ID),
      type: this.getActivityType(data.TYPE_ID as number),
      subject: String(data.SUBJECT || ''),
      description: data.DESCRIPTION as string,
      contactId: data.OWNER_TYPE_ID === 3 ? String(data.OWNER_ID) : undefined,
      dealId: data.OWNER_TYPE_ID === 2 ? String(data.OWNER_ID) : undefined,
      completedAt: data.COMPLETED === 'Y' ? new Date() : undefined,
      createdAt: new Date(data.CREATED as string),
    }
  }
  
  private getActivityTypeId(type: CRMActivity['type']): number {
    const types: Record<CRMActivity['type'], number> = {
      email: 4,
      call: 1,
      meeting: 2,
      task: 3,
      note: 6,
    }
    return types[type] || 6
  }
  
  private getActivityType(typeId: number): CRMActivity['type'] {
    const types: Record<number, CRMActivity['type']> = {
      1: 'call',
      2: 'meeting',
      3: 'task',
      4: 'email',
      6: 'note',
    }
    return types[typeId] || 'note'
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Factory para criar adapters de CRM
 */
export function createCRMAdapter(config: CRMConfig): ICRMAdapter {
  switch (config.provider) {
    case 'bitrix24':
      return new Bitrix24Adapter(config)
    // Adicionar outros adapters conforme implementados:
    // case 'hubspot':
    //   return new HubSpotAdapter(config)
    // case 'salesforce':
    //   return new SalesforceAdapter(config)
    // case 'pipedrive':
    //   return new PipedriveAdapter(config)
    default:
      throw new Error(`CRM provider not supported: ${config.provider}`)
  }
}

/**
 * Singleton para gerenciar conexões CRM ativas
 */
class CRMManager {
  private adapters: Map<string, ICRMAdapter> = new Map()
  
  async connect(userId: string, config: CRMConfig): Promise<ICRMAdapter> {
    const key = `${userId}-${config.provider}`
    
    if (this.adapters.has(key)) {
      return this.adapters.get(key)!
    }
    
    const adapter = createCRMAdapter(config)
    await adapter.connect()
    
    this.adapters.set(key, adapter)
    return adapter
  }
  
  async disconnect(userId: string, provider: CRMProvider): Promise<void> {
    const key = `${userId}-${provider}`
    const adapter = this.adapters.get(key)
    
    if (adapter) {
      await adapter.disconnect()
      this.adapters.delete(key)
    }
  }
  
  getAdapter(userId: string, provider: CRMProvider): ICRMAdapter | undefined {
    return this.adapters.get(`${userId}-${provider}`)
  }
}

export const crmManager = new CRMManager()

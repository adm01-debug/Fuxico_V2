// =============================================================================
// FUXICO - Base CRM Adapter
// Arquivo: src/lib/crm/adapters/base-adapter.ts
// Descrição: Classe base abstrata para adapters de CRM
// =============================================================================

import { logger } from '@/lib/logger';
import type {
  ICRMAdapter,
  CRMConfig,
  CRMProviderType,
  CRMContact,
  CRMActivity,
  CRMDeal,
  CRMOperationResult,
  CRMSyncResult,
} from '../types';

// =============================================================================
// MOCK DATA (para desenvolvimento/fallback)
// =============================================================================

export const MOCK_CONTACTS: CRMContact[] = [
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

export const MOCK_ACTIVITIES: CRMActivity[] = [
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
];

export const MOCK_DEALS: CRMDeal[] = [
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
// CONFIGURAÇÃO PADRÃO
// =============================================================================

export const DEFAULT_CRM_CONFIG: CRMConfig = {
  enabled: true,
  useMock: true,
  autoSyncContacts: true,
  autoRegisterActivities: true,
  autoCreateDeals: false,
  sendNotifications: true,
};

// =============================================================================
// CLASSE BASE ABSTRATA
// =============================================================================

export abstract class BaseCRMAdapter implements ICRMAdapter {
  protected config: CRMConfig;
  protected contactCache: Map<string, CRMContact> = new Map();
  
  abstract readonly providerType: CRMProviderType;
  abstract readonly providerName: string;
  
  constructor(initialConfig?: Partial<CRMConfig>) {
    this.config = { ...DEFAULT_CRM_CONFIG, ...initialConfig };
  }
  
  // ===========================================================================
  // MÉTODOS ABSTRATOS (devem ser implementados)
  // ===========================================================================
  
  abstract isConfigured(): boolean;
  abstract testConnection(): Promise<CRMOperationResult<{ connected: boolean }>>;
  
  // API calls específicos do provider
  protected abstract fetchContacts(limit?: number): Promise<CRMContact[]>;
  protected abstract fetchContactByEmail(email: string): Promise<CRMContact | null>;
  protected abstract createContact(email: string, name?: string, metadata?: Record<string, unknown>): Promise<CRMSyncResult>;
  protected abstract fetchActivities(limit?: number): Promise<CRMActivity[]>;
  protected abstract createActivity(type: CRMActivity['type'], subject: string, contactId: string, metadata?: Record<string, unknown>): Promise<CRMSyncResult>;
  protected abstract fetchDeals(limit?: number): Promise<CRMDeal[]>;
  protected abstract createDealInternal(title: string, contactId: string, value?: number, metadata?: Record<string, unknown>): Promise<CRMSyncResult>;
  protected abstract sendNotificationInternal(message: string, userId?: string): Promise<CRMOperationResult>;
  
  // ===========================================================================
  // CONFIGURAÇÃO
  // ===========================================================================
  
  getConfig(): CRMConfig {
    return { ...this.config };
  }
  
  async updateConfig(updates: Partial<CRMConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    logger.info(`${this.providerName} config updated`, updates);
  }
  
  protected getStorageKey(): string {
    return `crm_config_${this.providerType}`;
  }
  
  protected loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.getStorageKey());
      if (saved) {
        this.config = { ...DEFAULT_CRM_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      logger.error(`Failed to load ${this.providerName} config`, error);
    }
  }
  
  protected saveConfig(): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.config));
    } catch (error) {
      logger.error(`Failed to save ${this.providerName} config`, error);
    }
  }
  
  // ===========================================================================
  // CONTATOS
  // ===========================================================================
  
  async getContacts(limit?: number): Promise<CRMContact[]> {
    if (this.config.useMock || !this.isConfigured()) {
      await this.simulateDelay();
      return [...MOCK_CONTACTS].slice(0, limit);
    }
    
    try {
      const contacts = await this.fetchContacts(limit);
      contacts.forEach(c => this.contactCache.set(c.email, c));
      return contacts;
    } catch (error) {
      logger.error(`${this.providerName}: Failed to fetch contacts`, error);
      return [...MOCK_CONTACTS].slice(0, limit);
    }
  }
  
  async getContactByEmail(email: string): Promise<CRMContact | null> {
    // Check cache first
    if (this.contactCache.has(email)) {
      return this.contactCache.get(email)!;
    }
    
    if (this.config.useMock || !this.isConfigured()) {
      await this.simulateDelay();
      return MOCK_CONTACTS.find(c => c.email === email) || null;
    }
    
    try {
      const contact = await this.fetchContactByEmail(email);
      if (contact) {
        this.contactCache.set(email, contact);
      }
      return contact;
    } catch (error) {
      logger.error(`${this.providerName}: Failed to fetch contact`, error);
      return null;
    }
  }
  
  async syncContact(
    email: string, 
    name?: string, 
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    if (this.config.useMock || !this.isConfigured()) {
      await this.simulateDelay();
      const existing = MOCK_CONTACTS.find(c => c.email === email);
      if (existing) {
        return { success: true, contactId: existing.id, isNew: false, useMock: true };
      }
      
      const newId = `mock-${Date.now()}`;
      MOCK_CONTACTS.push({
        id: newId,
        name: name || email.split('@')[0],
        email,
        lastActivity: new Date().toISOString(),
        source: 'FUXICO',
        ...metadata,
      });
      return { success: true, contactId: newId, isNew: true, useMock: true };
    }
    
    try {
      // Check if exists
      const existing = await this.getContactByEmail(email);
      if (existing) {
        return { success: true, contactId: existing.id, isNew: false };
      }
      
      // Create new
      return await this.createContact(email, name, metadata);
    } catch (error) {
      logger.error(`${this.providerName}: Failed to sync contact`, error);
      return { success: false, error: String(error) };
    }
  }
  
  // ===========================================================================
  // ATIVIDADES
  // ===========================================================================
  
  async getActivities(limit?: number): Promise<CRMActivity[]> {
    if (this.config.useMock || !this.isConfigured()) {
      await this.simulateDelay();
      return [...MOCK_ACTIVITIES].slice(0, limit);
    }
    
    try {
      return await this.fetchActivities(limit);
    } catch (error) {
      logger.error(`${this.providerName}: Failed to fetch activities`, error);
      return [...MOCK_ACTIVITIES].slice(0, limit);
    }
  }
  
  async registerActivity(
    type: CRMActivity['type'],
    subject: string,
    contactEmail: string,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    if (this.config.useMock || !this.isConfigured()) {
      await this.simulateDelay();
      const newId = `act-${Date.now()}`;
      const contact = MOCK_CONTACTS.find(c => c.email === contactEmail);
      
      MOCK_ACTIVITIES.unshift({
        id: newId,
        type,
        subject,
        contactId: contact?.id || 'unknown',
        contactName: contact?.name || contactEmail,
        timestamp: new Date().toISOString(),
        metadata,
      });
      
      return { success: true, activityId: newId, useMock: true };
    }
    
    try {
      const contact = await this.getContactByEmail(contactEmail);
      if (!contact) {
        // Auto-sync contact if needed
        if (this.config.autoSyncContacts) {
          const syncResult = await this.syncContact(contactEmail);
          if (!syncResult.success) {
            return { success: false, error: 'Contact not found and sync failed' };
          }
          return await this.createActivity(type, subject, syncResult.contactId!, metadata);
        }
        return { success: false, error: 'Contact not found' };
      }
      
      return await this.createActivity(type, subject, contact.id, metadata);
    } catch (error) {
      logger.error(`${this.providerName}: Failed to register activity`, error);
      return { success: false, error: String(error) };
    }
  }
  
  // ===========================================================================
  // DEALS
  // ===========================================================================
  
  async getDeals(limit?: number): Promise<CRMDeal[]> {
    if (this.config.useMock || !this.isConfigured()) {
      await this.simulateDelay();
      return [...MOCK_DEALS].slice(0, limit);
    }
    
    try {
      return await this.fetchDeals(limit);
    } catch (error) {
      logger.error(`${this.providerName}: Failed to fetch deals`, error);
      return [...MOCK_DEALS].slice(0, limit);
    }
  }
  
  async createDeal(
    title: string,
    contactEmail: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    if (this.config.useMock || !this.isConfigured()) {
      await this.simulateDelay();
      const newId = `deal-${Date.now()}`;
      const contact = MOCK_CONTACTS.find(c => c.email === contactEmail);
      
      MOCK_DEALS.unshift({
        id: newId,
        title,
        contactId: contact?.id || 'unknown',
        contactName: contact?.name || contactEmail,
        stage: 'Novo',
        value,
        currency: 'BRL',
        createdAt: new Date().toISOString(),
        metadata,
      });
      
      return { success: true, dealId: newId, isNew: true, useMock: true };
    }
    
    try {
      const contact = await this.getContactByEmail(contactEmail);
      if (!contact) {
        if (this.config.autoSyncContacts) {
          const syncResult = await this.syncContact(contactEmail);
          if (!syncResult.success) {
            return { success: false, error: 'Contact not found and sync failed' };
          }
          return await this.createDealInternal(title, syncResult.contactId!, value, metadata);
        }
        return { success: false, error: 'Contact not found' };
      }
      
      return await this.createDealInternal(title, contact.id, value, metadata);
    } catch (error) {
      logger.error(`${this.providerName}: Failed to create deal`, error);
      return { success: false, error: String(error) };
    }
  }
  
  // ===========================================================================
  // NOTIFICAÇÕES
  // ===========================================================================
  
  async sendNotification(message: string, userId?: string): Promise<CRMOperationResult> {
    if (this.config.useMock || !this.isConfigured()) {
      await this.simulateDelay();
      return { success: true, useMock: true };
    }
    
    try {
      return await this.sendNotificationInternal(message, userId);
    } catch (error) {
      logger.error(`${this.providerName}: Failed to send notification`, error);
      return { success: false, error: String(error) };
    }
  }
  
  // ===========================================================================
  // HELPERS
  // ===========================================================================
  
  protected async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  }
  
  clearCache(): void {
    this.contactCache.clear();
  }
}

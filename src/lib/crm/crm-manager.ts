// =============================================================================
// FUXICO - CRM Manager
// Arquivo: src/lib/crm/crm-manager.ts
// Descrição: Gerenciador central para múltiplos adapters de CRM
// =============================================================================

import { logger } from '@/lib/logger';
import type { 
  ICRMAdapter, 
  CRMProviderType, 
  CRMConfig,
  CRMContact,
  CRMActivity,
  CRMDeal,
  CRMOperationResult,
  CRMSyncResult,
} from './types';
import { Bitrix24Adapter } from './adapters/bitrix24-adapter';
import { HubSpotAdapter } from './adapters/hubspot-adapter';

// =============================================================================
// GERENCIADOR DE CRM
// =============================================================================

export class CRMManager {
  private adapters: Map<CRMProviderType, ICRMAdapter> = new Map();
  private activeProvider: CRMProviderType | null = null;
  
  constructor() {
    this.loadActiveProvider();
  }
  
  // ===========================================================================
  // REGISTRO DE ADAPTERS
  // ===========================================================================
  
  registerAdapter(adapter: ICRMAdapter): void {
    this.adapters.set(adapter.providerType, adapter);
    logger.info(`CRM Adapter registered: ${adapter.providerName}`);
  }
  
  unregisterAdapter(type: CRMProviderType): void {
    this.adapters.delete(type);
    if (this.activeProvider === type) {
      this.activeProvider = null;
      this.saveActiveProvider();
    }
  }
  
  getAdapter(type: CRMProviderType): ICRMAdapter | undefined {
    return this.adapters.get(type);
  }
  
  getRegisteredProviders(): CRMProviderType[] {
    return Array.from(this.adapters.keys());
  }
  
  // ===========================================================================
  // PROVIDER ATIVO
  // ===========================================================================
  
  setActiveProvider(type: CRMProviderType | null): void {
    if (type && !this.adapters.has(type)) {
      throw new Error(`CRM Provider '${type}' is not registered`);
    }
    this.activeProvider = type;
    this.saveActiveProvider();
    logger.info(`Active CRM Provider set to: ${type || 'none'}`);
  }
  
  getActiveProvider(): CRMProviderType | null {
    return this.activeProvider;
  }
  
  getActiveAdapter(): ICRMAdapter | null {
    if (!this.activeProvider) return null;
    return this.adapters.get(this.activeProvider) || null;
  }
  
  private loadActiveProvider(): void {
    try {
      const saved = localStorage.getItem('crm_active_provider');
      if (saved) {
        this.activeProvider = saved as CRMProviderType;
      }
    } catch (error) {
      logger.error('Failed to load active CRM provider', error);
    }
  }
  
  private saveActiveProvider(): void {
    try {
      if (this.activeProvider) {
        localStorage.setItem('crm_active_provider', this.activeProvider);
      } else {
        localStorage.removeItem('crm_active_provider');
      }
    } catch (error) {
      logger.error('Failed to save active CRM provider', error);
    }
  }
  
  // ===========================================================================
  // PROXY METHODS (usa adapter ativo)
  // ===========================================================================
  
  async getContacts(limit?: number): Promise<CRMContact[]> {
    const adapter = this.getActiveAdapter();
    if (!adapter) {
      logger.warn('No active CRM adapter');
      return [];
    }
    return adapter.getContacts(limit);
  }
  
  async getContactByEmail(email: string): Promise<CRMContact | null> {
    const adapter = this.getActiveAdapter();
    if (!adapter) return null;
    return adapter.getContactByEmail(email);
  }
  
  async syncContact(
    email: string, 
    name?: string, 
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const adapter = this.getActiveAdapter();
    if (!adapter) {
      return { success: false, error: 'No active CRM provider' };
    }
    return adapter.syncContact(email, name, metadata);
  }
  
  async getActivities(limit?: number): Promise<CRMActivity[]> {
    const adapter = this.getActiveAdapter();
    if (!adapter) return [];
    return adapter.getActivities(limit);
  }
  
  async registerActivity(
    type: CRMActivity['type'],
    subject: string,
    contactEmail: string,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const adapter = this.getActiveAdapter();
    if (!adapter) {
      return { success: false, error: 'No active CRM provider' };
    }
    return adapter.registerActivity(type, subject, contactEmail, metadata);
  }
  
  async getDeals(limit?: number): Promise<CRMDeal[]> {
    const adapter = this.getActiveAdapter();
    if (!adapter) return [];
    return adapter.getDeals(limit);
  }
  
  async createDeal(
    title: string,
    contactEmail: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult> {
    const adapter = this.getActiveAdapter();
    if (!adapter) {
      return { success: false, error: 'No active CRM provider' };
    }
    return adapter.createDeal(title, contactEmail, value, metadata);
  }
  
  async sendNotification(message: string, userId?: string): Promise<CRMOperationResult> {
    const adapter = this.getActiveAdapter();
    if (!adapter) {
      return { success: false, error: 'No active CRM provider' };
    }
    return adapter.sendNotification(message, userId);
  }
  
  async testConnection(): Promise<CRMOperationResult<{ connected: boolean }>> {
    const adapter = this.getActiveAdapter();
    if (!adapter) {
      return { success: false, error: 'No active CRM provider', data: { connected: false } };
    }
    return adapter.testConnection();
  }
  
  getConfig(): CRMConfig | null {
    const adapter = this.getActiveAdapter();
    if (!adapter) return null;
    return adapter.getConfig();
  }
  
  async updateConfig(updates: Partial<CRMConfig>): Promise<void> {
    const adapter = this.getActiveAdapter();
    if (!adapter) {
      throw new Error('No active CRM provider');
    }
    return adapter.updateConfig(updates);
  }
  
  // ===========================================================================
  // STATUS
  // ===========================================================================
  
  getStatus(): {
    hasActiveProvider: boolean;
    activeProvider: CRMProviderType | null;
    activeProviderName: string | null;
    isConfigured: boolean;
    registeredProviders: CRMProviderType[];
  } {
    const adapter = this.getActiveAdapter();
    return {
      hasActiveProvider: !!adapter,
      activeProvider: this.activeProvider,
      activeProviderName: adapter?.providerName || null,
      isConfigured: adapter?.isConfigured() || false,
      registeredProviders: this.getRegisteredProviders(),
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const crmManager = new CRMManager();

// Registrar adapters padrão
crmManager.registerAdapter(new Bitrix24Adapter());
crmManager.registerAdapter(new HubSpotAdapter());

// Definir Bitrix24 como padrão se nenhum estiver ativo
if (!crmManager.getActiveProvider()) {
  crmManager.setActiveProvider('bitrix24');
}

// =============================================================================
// FUXICO - Generic CRM Abstraction Types
// Arquivo: src/lib/crm/types.ts
// Descrição: Tipos e interfaces genéricos para múltiplos CRMs
// =============================================================================

// =============================================================================
// ENTIDADES BASE
// =============================================================================

export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  lastActivity?: string;
  metadata?: Record<string, unknown>;
}

export interface CRMActivity {
  id: string;
  type: 'email_open' | 'link_click' | 'document_view' | 'custom';
  subject: string;
  contactId: string;
  contactName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CRMDeal {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  stage: string;
  value?: number;
  currency?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

export interface CRMConfig {
  enabled: boolean;
  useMock: boolean;
  autoSyncContacts: boolean;
  autoRegisterActivities: boolean;
  autoCreateDeals: boolean;
  sendNotifications: boolean;
  // Provider-specific config
  providerConfig?: Record<string, unknown>;
}

// =============================================================================
// PROVEDORES SUPORTADOS
// =============================================================================

export type CRMProviderType = 
  | 'bitrix24' 
  | 'hubspot' 
  | 'salesforce' 
  | 'pipedrive' 
  | 'zoho'
  | 'custom';

export interface CRMProviderInfo {
  type: CRMProviderType;
  name: string;
  description: string;
  icon: string;
  configFields: CRMConfigField[];
  features: CRMFeature[];
}

export interface CRMConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export type CRMFeature = 
  | 'contacts'
  | 'activities'
  | 'deals'
  | 'notifications'
  | 'webhooks';

// =============================================================================
// RESULTADOS DE OPERAÇÕES
// =============================================================================

export interface CRMOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  isNew?: boolean;
  message?: string;
  error?: string;
  useMock?: boolean;
}

export interface CRMSyncResult extends CRMOperationResult {
  contactId?: string;
  activityId?: string;
  dealId?: string;
}

// =============================================================================
// INTERFACE DO ADAPTER
// =============================================================================

export interface ICRMAdapter {
  // Info
  readonly providerType: CRMProviderType;
  readonly providerName: string;
  
  // Status
  isConfigured(): boolean;
  testConnection(): Promise<CRMOperationResult<{ connected: boolean }>>;
  
  // Configuração
  getConfig(): CRMConfig;
  updateConfig(updates: Partial<CRMConfig>): Promise<void>;
  
  // Contatos
  getContacts(limit?: number): Promise<CRMContact[]>;
  getContactByEmail(email: string): Promise<CRMContact | null>;
  syncContact(email: string, name?: string, metadata?: Record<string, unknown>): Promise<CRMSyncResult>;
  
  // Atividades
  getActivities(limit?: number): Promise<CRMActivity[]>;
  registerActivity(
    type: CRMActivity['type'],
    subject: string,
    contactEmail: string,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult>;
  
  // Deals
  getDeals(limit?: number): Promise<CRMDeal[]>;
  createDeal(
    title: string,
    contactEmail: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): Promise<CRMSyncResult>;
  
  // Notificações
  sendNotification(message: string, userId?: string): Promise<CRMOperationResult>;
}

// =============================================================================
// FACTORY TYPE
// =============================================================================

export type CRMAdapterFactory = (config?: Partial<CRMConfig>) => ICRMAdapter;

// =============================================================================
// FUXICO - CRM Module Index
// Arquivo: src/lib/crm/index.ts
// Descrição: Exports centralizados do módulo CRM
// =============================================================================

// Types
export * from './types';

// Providers
export * from './providers';

// Adapters
export { BaseCRMAdapter, MOCK_CONTACTS, MOCK_ACTIVITIES, MOCK_DEALS, DEFAULT_CRM_CONFIG } from './adapters/base-adapter';
export { Bitrix24Adapter } from './adapters/bitrix24-adapter';
export { HubSpotAdapter } from './adapters/hubspot-adapter';

// Manager
export { crmManager, CRMManager } from './crm-manager';

// Helper function
export function getSupportedProviders() {
  return ['bitrix24', 'hubspot'] as const;
}

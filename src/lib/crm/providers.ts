// =============================================================================
// FUXICO - CRM Providers Registry
// Registro centralizado de todos os adaptadores CRM suportados
// =============================================================================

import { BaseCRMAdapter } from './adapters/base-adapter';
import { CRMConfig } from './types';
import { Bitrix24Adapter } from './adapters/bitrix24-adapter';
import { HubSpotAdapter } from './adapters/hubspot-adapter';

// =============================================================================
// TIPOS
// =============================================================================

export type CRMProvider = 'bitrix24' | 'hubspot';

export interface CRMProviderDetails {
  id: CRMProvider;
  name: string;
  description: string;
  logo: string;
  features: string[];
  configFields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
}

// =============================================================================
// REGISTRO DE PROVIDERS
// =============================================================================

export const CRM_PROVIDERS: Record<CRMProvider, CRMProviderDetails> = {
  bitrix24: {
    id: 'bitrix24',
    name: 'Bitrix24',
    description: 'CRM completo com automação de marketing e vendas',
    logo: '/icons/bitrix24.svg',
    features: ['Contatos', 'Negócios', 'Atividades', 'Automação'],
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true, placeholder: 'https://seu-portal.bitrix24.com.br/rest/...' },
      { key: 'userId', label: 'User ID', type: 'text', required: true },
    ],
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Plataforma de CRM, marketing e vendas',
    logo: '/icons/hubspot.svg',
    features: ['Contatos', 'Empresas', 'Negócios', 'Timeline'],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'pat-na1-...' },
    ],
  },
};

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createCRMAdapter(
  provider: CRMProvider,
  config: CRMConfig
): BaseCRMAdapter {
  switch (provider) {
    case 'bitrix24':
      return new Bitrix24Adapter(config);
    case 'hubspot':
      return new HubSpotAdapter(config);
    default:
      throw new Error(`Unknown CRM provider: ${provider}`);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

export function getProviderInfo(provider: CRMProvider): CRMProviderDetails {
  return CRM_PROVIDERS[provider];
}

export function getAllProviders(): CRMProviderDetails[] {
  return Object.values(CRM_PROVIDERS);
}

export function isValidProvider(provider: string): provider is CRMProvider {
  return provider in CRM_PROVIDERS;
}

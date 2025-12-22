// =============================================================================
// FUXICO - CRM Providers Registry
// Registro centralizado de todos os adaptadores CRM suportados
// =============================================================================

import { BaseCRMAdapter, CRMConfig } from './adapters/base-adapter';
import { Bitrix24Adapter, Bitrix24Config } from './adapters/bitrix24-adapter';
import { HubSpotAdapter, HubSpotConfig } from './adapters/hubspot-adapter';
import { SalesforceAdapter, SalesforceConfig } from './adapters/salesforce-adapter';
import { PipedriveAdapter, PipedriveConfig } from './adapters/pipedrive-adapter';

// =============================================================================
// TIPOS
// =============================================================================

export type CRMProvider = 'bitrix24' | 'hubspot' | 'salesforce' | 'pipedrive';

export interface CRMProviderInfo {
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

export const CRM_PROVIDERS: Record<CRMProvider, CRMProviderInfo> = {
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
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Líder mundial em CRM empresarial',
    logo: '/icons/salesforce.svg',
    features: ['Leads', 'Contatos', 'Oportunidades', 'Tarefas'],
    configFields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://sua-empresa.my.salesforce.com' },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
  },
  pipedrive: {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'CRM focado em pipeline de vendas',
    logo: '/icons/pipedrive.svg',
    features: ['Pessoas', 'Organizações', 'Negócios', 'Atividades'],
    configFields: [
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
      { key: 'companyDomain', label: 'Company Domain', type: 'text', required: true, placeholder: 'sua-empresa' },
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
      return new Bitrix24Adapter(config as Bitrix24Config);
    case 'hubspot':
      return new HubSpotAdapter(config as HubSpotConfig);
    case 'salesforce':
      return new SalesforceAdapter(config as SalesforceConfig);
    case 'pipedrive':
      return new PipedriveAdapter(config as PipedriveConfig);
    default:
      throw new Error(`Unknown CRM provider: ${provider}`);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

export function getProviderInfo(provider: CRMProvider): CRMProviderInfo {
  return CRM_PROVIDERS[provider];
}

export function getAllProviders(): CRMProviderInfo[] {
  return Object.values(CRM_PROVIDERS);
}

export function isValidProvider(provider: string): provider is CRMProvider {
  return provider in CRM_PROVIDERS;
}

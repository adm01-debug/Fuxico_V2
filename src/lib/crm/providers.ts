import { BaseCRMAdapter } from './adapters/base-adapter';
import { CRMConfig } from './types';
import { Bitrix24Adapter } from './adapters/bitrix24-adapter';
import { HubSpotAdapter } from './adapters/hubspot-adapter';
import { SalesforceAdapter } from './adapters/salesforce-adapter';
import { PipedriveAdapter } from './adapters/pipedrive-adapter';

export type CRMProvider = 'bitrix24' | 'hubspot' | 'salesforce' | 'pipedrive';

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
    features: ['Contatos', 'Empresas', 'Negócios', 'Tickets'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'pat-na1-...' },
    ],
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM empresarial líder mundial',
    logo: '/icons/salesforce.svg',
    features: ['Leads', 'Oportunidades', 'Contas', 'Tarefas'],
    configFields: [
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
      { key: 'apiKey', label: 'API Token', type: 'password', required: true, placeholder: 'Seu API token do Pipedrive' },
    ],
  },
};

export function createCRMAdapter(provider: CRMProvider, config: CRMConfig): BaseCRMAdapter {
  switch (provider) {
    case 'bitrix24':
      return new Bitrix24Adapter(config);
    case 'hubspot':
      return new HubSpotAdapter(config);
    case 'salesforce':
      return new SalesforceAdapter(config);
    case 'pipedrive':
      return new PipedriveAdapter(config);
    default:
      throw new Error(`CRM provider ${provider} not supported`);
  }
}

export function getCRMProviderDetails(provider: CRMProvider): CRMProviderDetails {
  return CRM_PROVIDERS[provider];
}

export function getAllCRMProviders(): CRMProviderDetails[] {
  return Object.values(CRM_PROVIDERS);
}

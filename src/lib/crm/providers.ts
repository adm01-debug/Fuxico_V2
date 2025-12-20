// =============================================================================
// FUXICO - CRM Providers Registry
// Arquivo: src/lib/crm/providers.ts
// Descrição: Registro de provedores CRM disponíveis
// =============================================================================

import type { CRMProviderInfo, CRMProviderType } from './types';

// =============================================================================
// INFORMAÇÕES DOS PROVEDORES
// =============================================================================

export const CRM_PROVIDERS: Record<CRMProviderType, CRMProviderInfo> = {
  bitrix24: {
    type: 'bitrix24',
    name: 'Bitrix24',
    description: 'CRM completo com automação de vendas e marketing',
    icon: '🔷',
    features: ['contacts', 'activities', 'deals', 'notifications', 'webhooks'],
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://seu-dominio.bitrix24.com.br/rest/...',
      },
      {
        key: 'defaultDealStage',
        label: 'Estágio Padrão de Deal',
        type: 'text',
        required: false,
        placeholder: 'NEW',
      },
    ],
  },
  
  hubspot: {
    type: 'hubspot',
    name: 'HubSpot',
    description: 'Plataforma de CRM, marketing e vendas',
    icon: '🟠',
    features: ['contacts', 'activities', 'deals', 'notifications'],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      },
      {
        key: 'portalId',
        label: 'Portal ID',
        type: 'text',
        required: false,
        placeholder: '12345678',
      },
    ],
  },
  
  salesforce: {
    type: 'salesforce',
    name: 'Salesforce',
    description: 'Líder mundial em CRM empresarial',
    icon: '☁️',
    features: ['contacts', 'activities', 'deals', 'notifications'],
    configFields: [
      {
        key: 'instanceUrl',
        label: 'Instance URL',
        type: 'url',
        required: true,
        placeholder: 'https://seu-dominio.my.salesforce.com',
      },
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Connected App Client ID',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        placeholder: 'Connected App Client Secret',
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
        placeholder: 'OAuth Refresh Token',
      },
    ],
  },
  
  pipedrive: {
    type: 'pipedrive',
    name: 'Pipedrive',
    description: 'CRM focado em pipeline de vendas',
    icon: '🟢',
    features: ['contacts', 'activities', 'deals'],
    configFields: [
      {
        key: 'apiToken',
        label: 'API Token',
        type: 'password',
        required: true,
        placeholder: 'Seu API Token do Pipedrive',
      },
      {
        key: 'companyDomain',
        label: 'Domínio da Empresa',
        type: 'text',
        required: true,
        placeholder: 'sua-empresa',
      },
    ],
  },
  
  zoho: {
    type: 'zoho',
    name: 'Zoho CRM',
    description: 'CRM com suite completa de ferramentas',
    icon: '🔴',
    features: ['contacts', 'activities', 'deals', 'notifications'],
    configFields: [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Zoho Client ID',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        placeholder: 'Zoho Client Secret',
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        type: 'password',
        required: true,
        placeholder: 'OAuth Refresh Token',
      },
      {
        key: 'datacenter',
        label: 'Datacenter',
        type: 'select',
        required: true,
        options: [
          { value: 'com', label: 'US (zoho.com)' },
          { value: 'eu', label: 'EU (zoho.eu)' },
          { value: 'in', label: 'IN (zoho.in)' },
          { value: 'com.au', label: 'AU (zoho.com.au)' },
        ],
      },
    ],
  },
  
  custom: {
    type: 'custom',
    name: 'CRM Personalizado',
    description: 'Integração via webhook personalizado',
    icon: '⚙️',
    features: ['contacts', 'activities', 'deals'],
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://seu-servidor.com/api/crm',
      },
      {
        key: 'apiKey',
        label: 'API Key (opcional)',
        type: 'password',
        required: false,
        placeholder: 'Chave de autenticação',
      },
    ],
  },
};

// =============================================================================
// HELPERS
// =============================================================================

export function getProviderInfo(type: CRMProviderType): CRMProviderInfo {
  return CRM_PROVIDERS[type];
}

export function getSupportedProviders(): CRMProviderInfo[] {
  return Object.values(CRM_PROVIDERS);
}

export function hasFeature(type: CRMProviderType, feature: CRMProviderInfo['features'][number]): boolean {
  return CRM_PROVIDERS[type]?.features.includes(feature) ?? false;
}

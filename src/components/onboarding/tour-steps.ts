/**
 * @fileoverview Tours de onboarding específicos por módulo
 * @description Configurações de tours para cada funcionalidade do FUXICO
 */

import { Step } from 'react-joyride';

// =============================================================================
// TOUR DO DASHBOARD (Principal)
// =============================================================================

export const dashboardSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '🎉 Bem-vindo ao FUXICO!',
    content: 'O sistema completo de rastreamento de emails. Vamos fazer um tour rápido pelas principais funcionalidades!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Começar!', back: 'Voltar', close: 'Fechar' },
  },
  {
    target: '[data-tour="stats-cards"]',
    placement: 'bottom',
    title: '📊 Métricas em Tempo Real',
    content: 'Aqui você vê um resumo completo: total de emails, aberturas, cliques e taxa de bounce. Todas as métricas são atualizadas em tempo real.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="realtime-metrics"]',
    placement: 'top',
    title: '⚡ Métricas ao Vivo',
    content: 'Acompanhe aberturas, cliques e bounces no momento em que acontecem! Os contadores animam quando há novos eventos.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="trend-chart"]',
    placement: 'top',
    title: '📈 Gráfico de Tendências',
    content: 'Visualize a evolução das aberturas e cliques ao longo da semana. Identifique padrões e melhore suas campanhas.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="tabs"]',
    placement: 'bottom',
    title: '📑 Navegação por Abas',
    content: 'Explore todas as funcionalidades: Emails, Links, Documentos, Relatórios, Analytics, Lead Scoring, e muito mais!',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '🚀 Pronto para Começar!',
    content: 'Agora você conhece o básico. Clique nas abas para ver tours específicos de cada módulo!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Concluir', back: 'Voltar', close: 'Fechar' },
  },
];

// =============================================================================
// TOUR DE LINKS
// =============================================================================

export const linksSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '🔗 Links Rastreáveis',
    content: 'Crie links curtos com tracking para usar em qualquer lugar - redes sociais, WhatsApp, emails externos ou sites.',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Começar!', back: 'Voltar', close: 'Fechar' },
  },
  {
    target: '[data-tour="links-create-btn"]',
    placement: 'bottom',
    title: '➕ Criar Novo Link',
    content: 'Clique aqui para criar um novo link rastreável. Você pode adicionar título e descrição para identificar facilmente.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="links-table"]',
    placement: 'top',
    title: '📋 Lista de Links',
    content: 'Veja todos os seus links, quantos cliques cada um recebeu, e quando foi o último clique.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="links-copy-btn"]',
    placement: 'left',
    title: '📋 Copiar Link',
    content: 'Clique para copiar o link rastreável para a área de transferência. Cole em qualquer lugar!',
    disableBeacon: true,
  },
  {
    target: '[data-tour="links-events-btn"]',
    placement: 'left',
    title: '👁️ Ver Detalhes',
    content: 'Clique para ver o histórico completo de cliques: localização, dispositivo, navegador e horário.',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '✅ Links Configurados!',
    content: 'Agora você sabe como criar e gerenciar links rastreáveis. Use-os para medir engajamento em qualquer canal!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Concluir', back: 'Voltar', close: 'Fechar' },
  },
];

// =============================================================================
// TOUR DE DOCUMENTOS
// =============================================================================

export const documentsSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '📄 Documentos Rastreados',
    content: 'Envie PDFs e rastreie quando são visualizados e baixados. Perfeito para propostas comerciais, contratos e apresentações.',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Começar!', back: 'Voltar', close: 'Fechar' },
  },
  {
    target: '[data-tour="docs-upload-btn"]',
    placement: 'bottom',
    title: '📤 Enviar Documento',
    content: 'Clique aqui para fazer upload de um PDF. Você pode adicionar informações do destinatário para melhor organização.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="docs-table"]',
    placement: 'top',
    title: '📋 Lista de Documentos',
    content: 'Veja todos os seus documentos, quantas visualizações e downloads cada um teve.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="docs-views-badge"]',
    placement: 'left',
    title: '👁️ Contagem de Visualizações',
    content: 'O badge mostra quantas vezes o documento foi visualizado. Monitore o engajamento em tempo real!',
    disableBeacon: true,
  },
  {
    target: '[data-tour="docs-copy-btn"]',
    placement: 'left',
    title: '📋 Copiar Link',
    content: 'Copie o link do documento para enviar por email, WhatsApp ou qualquer outro canal.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="docs-events-btn"]',
    placement: 'left',
    title: '📊 Ver Histórico',
    content: 'Veja o histórico completo de visualizações e downloads com dados de localização e dispositivo.',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '✅ Documentos Configurados!',
    content: 'Agora você pode rastrear PDFs e saber exatamente quando seus destinatários visualizam seus documentos!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Concluir', back: 'Voltar', close: 'Fechar' },
  },
];

// =============================================================================
// TOUR DE ANALYTICS
// =============================================================================

export const analyticsSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '📊 Analytics Avançado',
    content: 'Análises detalhadas do desempenho dos seus emails com gráficos interativos e métricas avançadas.',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Começar!', back: 'Voltar', close: 'Fechar' },
  },
  {
    target: '[data-tour="analytics-date-filter"]',
    placement: 'bottom',
    title: '📅 Filtro por Data',
    content: 'Selecione um período personalizado para analisar. Compare diferentes períodos e identifique tendências.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="analytics-stats"]',
    placement: 'bottom',
    title: '📈 Estatísticas Gerais',
    content: 'Veja as métricas principais: emails enviados, taxa de abertura, taxa de cliques e tempo médio para abertura.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="analytics-chart"]',
    placement: 'top',
    title: '📉 Gráfico de Tendências',
    content: 'Visualize a evolução diária dos seus emails. Identifique os melhores dias para envio.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="analytics-devices"]',
    placement: 'left',
    title: '📱 Dispositivos',
    content: 'Descubra se seus destinatários preferem mobile ou desktop. Otimize seus emails para o dispositivo mais usado.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="analytics-domains"]',
    placement: 'left',
    title: '🏢 Top Domínios',
    content: 'Veja quais domínios/empresas mais interagem com seus emails. Identifique seus melhores prospects.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="analytics-export"]',
    placement: 'left',
    title: '📥 Exportar Dados',
    content: 'Exporte os dados de analytics para CSV, Excel ou PDF. Perfeito para relatórios e apresentações.',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '✅ Analytics Configurado!',
    content: 'Use esses insights para otimizar suas campanhas de email e aumentar o engajamento!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Concluir', back: 'Voltar', close: 'Fechar' },
  },
];

// =============================================================================
// TOUR DE LEAD SCORING
// =============================================================================

export const leadScoringSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '🔥 Lead Scoring',
    content: 'Identifique automaticamente seus contatos mais engajados. O sistema calcula um score baseado em aberturas e cliques.',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Começar!', back: 'Voltar', close: 'Fechar' },
  },
  {
    target: '[data-tour="leads-stats"]',
    placement: 'bottom',
    title: '📊 Visão Geral',
    content: 'Veja a distribuição dos seus contatos por nível de engajamento: Hot, Warm, Cold e Inactive.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="leads-filter"]',
    placement: 'bottom',
    title: '🔍 Filtros',
    content: 'Filtre por nível de engajamento para encontrar rapidamente os contatos mais importantes.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="leads-table"]',
    placement: 'top',
    title: '📋 Lista de Leads',
    content: 'Veja todos os contatos com seus scores, total de aberturas, cliques e último engajamento.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="leads-score-badge"]',
    placement: 'left',
    title: '🔢 Score de Engajamento',
    content: 'O score é calculado automaticamente baseado em aberturas (1pt), cliques (3pts) e recência do engajamento.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="leads-recalculate"]',
    placement: 'left',
    title: '🔄 Recalcular Scores',
    content: 'Clique para atualizar todos os scores com base nos dados mais recentes.',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '✅ Lead Scoring Ativo!',
    content: 'Agora você pode priorizar seus contatos mais engajados e focar suas vendas nos leads mais quentes!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Concluir', back: 'Voltar', close: 'Fechar' },
  },
];

// =============================================================================
// TOUR DE EMAILS
// =============================================================================

export const emailsSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '📧 Emails Rastreados',
    content: 'Aqui você gerencia todos os emails que está rastreando. Veja aberturas, cliques e status de entrega.',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Começar!', back: 'Voltar', close: 'Fechar' },
  },
  {
    target: '[data-tour="emails-create-btn"]',
    placement: 'bottom',
    title: '➕ Criar Tracking',
    content: 'Crie um novo tracking de email. Você receberá um pixel invisível para inserir no corpo do email.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="emails-search"]',
    placement: 'bottom',
    title: '🔍 Buscar Emails',
    content: 'Busque por destinatário, assunto ou remetente. A busca é feita em tempo real.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="emails-filters"]',
    placement: 'bottom',
    title: '🔧 Filtros Avançados',
    content: 'Filtre por status de entrega, período, ou use a busca avançada para encontrar emails específicos.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="emails-table"]',
    placement: 'top',
    title: '📋 Lista de Emails',
    content: 'Cada linha mostra um email com destinatário, assunto, aberturas, cliques e status de entrega.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="emails-detail-btn"]',
    placement: 'left',
    title: '👁️ Ver Detalhes',
    content: 'Clique para ver todos os eventos: cada abertura, clique, localização e dispositivo usado.',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '✅ Emails Configurados!',
    content: 'Agora você pode monitorar todos os seus emails e saber exatamente quando são lidos!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Concluir', back: 'Voltar', close: 'Fechar' },
  },
];

// =============================================================================
// TOUR DE GEO ANALYTICS
// =============================================================================

export const geoAnalyticsSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '🌍 Geo Analytics',
    content: 'Visualize de onde seus destinatários estão abrindo e clicando em seus emails ao redor do mundo.',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Começar!', back: 'Voltar', close: 'Fechar' },
  },
  {
    target: '[data-tour="geo-map"]',
    placement: 'top',
    title: '🗺️ Mapa de Engajamento',
    content: 'Veja no mapa os países com mais aberturas e cliques. Quanto maior o círculo, mais engajamento.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="geo-stats"]',
    placement: 'bottom',
    title: '📊 Top Países',
    content: 'Lista dos países com mais aberturas e cliques, ordenados por engajamento.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="geo-cities"]',
    placement: 'left',
    title: '🏙️ Top Cidades',
    content: 'Descubra as cidades específicas de onde vem seu engajamento. Útil para segmentação regional.',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '✅ Geo Analytics Configurado!',
    content: 'Use esses insights geográficos para otimizar horários de envio e personalizar conteúdo por região!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Concluir', back: 'Voltar', close: 'Fechar' },
  },
];

// =============================================================================
// MAPA DE TOURS
// =============================================================================

export const tourStepsMap: Record<string, Step[]> = {
  dashboard: dashboardSteps,
  links: linksSteps,
  documents: documentsSteps,
  analytics: analyticsSteps,
  leads: leadScoringSteps,
  emails: emailsSteps,
  geo: geoAnalyticsSteps,
};

export const tourLabels: Record<string, string> = {
  dashboard: 'Tour Principal',
  links: 'Tour de Links',
  documents: 'Tour de Documentos',
  analytics: 'Tour de Analytics',
  leads: 'Tour de Lead Scoring',
  emails: 'Tour de Emails',
  geo: 'Tour de Geo Analytics',
};

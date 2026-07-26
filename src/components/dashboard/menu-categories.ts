/** Estrutura de menu usada pela sidebar e pelos breadcrumbs. */
import { Activity, BarChart3, Brain, Clock, FileText, Globe, Home, LayoutDashboard, Link as LinkIcon, Mail, PieChart, TrendingUp } from 'lucide-react';

export const MENU_CATEGORIES = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, items: [{ id: 'home', label: 'Início', icon: Home }] },
  { id: 'tracking', label: 'Rastreamento', icon: Mail, items: [
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'scheduling', label: 'Agendamento', icon: Clock },
    { id: 'tracking_history', label: 'Histórico', icon: Activity },
  ]},
  { id: 'analytics', label: 'Analytics', icon: PieChart, items: [
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics Avançado', icon: TrendingUp },
    { id: 'geo', label: 'Geo Analytics', icon: Globe },
    { id: 'insights', label: 'Insights IA', icon: Brain },
  ]},
];

import { useState, useCallback } from 'react';
import { subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

/** Estado de filtros aplicado à listagem de e-mails rastreados. */
export interface EmailFilters {
  search: string;
  status: 'all' | 'opened' | 'not-opened' | 'clicked';
  period: 'all' | 'today' | '7days' | '30days' | 'custom';
  dateRange: { from: Date | undefined; to: Date | undefined };
  minOpens: number;
  sortBy: 'date' | 'opens' | 'clicks' | 'recipient';
  sortOrder: 'asc' | 'desc';
}

export const defaultFilters: EmailFilters = {
  search: '',
  status: 'all',
  period: 'all',
  dateRange: { from: undefined, to: undefined },
  minOpens: 0,
  sortBy: 'date',
  sortOrder: 'desc',
};

/** Estado controlado dos filtros com reset e flag de filtros ativos. */
export function useEmailFilters() {
  const [filters, setFilters] = useState<EmailFilters>(defaultFilters);
  
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);
  
  const hasActiveFilters = 
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.period !== 'all' ||
    filters.minOpens > 0;
  
  return { filters, setFilters, resetFilters, hasActiveFilters };
}

/** Aplica busca, status, período, mínimo de aberturas e ordenação. */
export function filterEmails<T extends {
  recipient_email: string;
  subject: string | null;
  created_at: string;
  opens?: number;
  clicks?: number;
}>(emails: T[], filters: EmailFilters): T[] {
  let result = [...emails];
  
  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(email => 
      email.recipient_email.toLowerCase().includes(searchLower) ||
      (email.subject?.toLowerCase() || '').includes(searchLower)
    );
  }
  
  // Status filter
  if (filters.status !== 'all') {
    switch (filters.status) {
      case 'opened':
        result = result.filter(email => (email.opens || 0) > 0);
        break;
      case 'not-opened':
        result = result.filter(email => (email.opens || 0) === 0);
        break;
      case 'clicked':
        result = result.filter(email => (email.clicks || 0) > 0);
        break;
    }
  }
  
  // Period filter
  if (filters.period !== 'all') {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date = endOfDay(now);
    
    switch (filters.period) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case '7days':
        startDate = startOfDay(subDays(now, 7));
        break;
      case '30days':
        startDate = startOfDay(subDays(now, 30));
        break;
      case 'custom':
        startDate = filters.dateRange.from;
        endDate = filters.dateRange.to ? endOfDay(filters.dateRange.to) : endDate;
        break;
    }
    
    if (startDate) {
      const intervalStart = startDate;
      result = result.filter(email => {
        const emailDate = new Date(email.created_at);
        return isWithinInterval(emailDate, { start: intervalStart, end: endDate });
      });
    }
  }
  
  // Min opens filter
  if (filters.minOpens > 0) {
    result = result.filter(email => (email.opens || 0) >= filters.minOpens);
  }
  
  // Sorting
  result.sort((a, b) => {
    let comparison = 0;
    
    switch (filters.sortBy) {
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'opens':
        comparison = (a.opens || 0) - (b.opens || 0);
        break;
      case 'clicks':
        comparison = (a.clicks || 0) - (b.clicks || 0);
        break;
      case 'recipient':
        comparison = a.recipient_email.localeCompare(b.recipient_email);
        break;
    }
    
    return filters.sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return result;
}

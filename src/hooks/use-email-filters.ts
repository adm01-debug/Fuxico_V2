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
export function filterEmails<
  T extends {
    recipient_email: string;
    subject: string | null;
    created_at: string;
    opens?: number;
    clicks?: number;
  },
>(emails: T[], filters: EmailFilters): T[] {
  let result = [...emails];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (email) =>
        email.recipient_email.toLowerCase().includes(searchLower) ||
        (email.subject?.toLowerCase() || '').includes(searchLower)
    );
  }

  // Status filter
  if (filters.status !== 'all') {
    switch (filters.status) {
      case 'opened':
        result = result.filter((email) => (email.opens || 0) > 0);
        break;
      case 'not-opened':
        result = result.filter((email) => (email.opens || 0) === 0);
        break;
      case 'clicked':
        result = result.filter((email) => (email.clicks || 0) > 0);
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
      result = result.filter((email) => {
        const emailDate = new Date(email.created_at);
        return isWithinInterval(emailDate, { start: intervalStart, end: endDate });
      });
    }
  }

  // Min opens filter
  if (filters.minOpens > 0) {
    result = result.filter((email) => (email.opens || 0) >= filters.minOpens);
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

const EMAIL_STATUS_VALUES = ['all', 'opened', 'not-opened', 'clicked'] as const;
const EMAIL_PERIOD_VALUES = ['all', 'today', '7days', '30days', 'custom'] as const;
const EMAIL_SORT_BY_VALUES = ['date', 'opens', 'clicks', 'recipient'] as const;
const EMAIL_SORT_ORDER_VALUES = ['asc', 'desc'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickOption<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== 'string') return fallback;
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function parseDateValue(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/** Converte o estado de filtros em JSON persistível (datas em ISO). */
export function serializeEmailFilters(filters: EmailFilters): Record<string, unknown> {
  return {
    search: filters.search,
    status: filters.status,
    period: filters.period,
    dateRange: {
      from: filters.dateRange.from ? filters.dateRange.from.toISOString() : null,
      to: filters.dateRange.to ? filters.dateRange.to.toISOString() : null,
    },
    minOpens: filters.minOpens,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

/** Reconstrói o estado a partir do JSON salvo, ignorando valores inválidos. */
export function deserializeEmailFilters(raw: unknown): EmailFilters {
  if (!isRecord(raw)) return { ...defaultFilters, dateRange: { from: undefined, to: undefined } };

  const dateRange = isRecord(raw.dateRange) ? raw.dateRange : {};
  const minOpens =
    typeof raw.minOpens === 'number' && Number.isFinite(raw.minOpens) && raw.minOpens > 0
      ? Math.floor(raw.minOpens)
      : 0;

  return {
    search: typeof raw.search === 'string' ? raw.search : '',
    status: pickOption(raw.status, EMAIL_STATUS_VALUES, 'all'),
    period: pickOption(raw.period, EMAIL_PERIOD_VALUES, 'all'),
    dateRange: { from: parseDateValue(dateRange.from), to: parseDateValue(dateRange.to) },
    minOpens,
    sortBy: pickOption(raw.sortBy, EMAIL_SORT_BY_VALUES, 'date'),
    sortOrder: pickOption(raw.sortOrder, EMAIL_SORT_ORDER_VALUES, 'desc'),
  };
}

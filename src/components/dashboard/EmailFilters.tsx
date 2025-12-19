import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Calendar, Eye, MousePointerClick, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface EmailFilters {
  search: string;
  status: 'all' | 'opened' | 'not-opened' | 'clicked';
  period: 'all' | 'today' | '7days' | '30days' | 'custom';
  dateRange: { from: Date | undefined; to: Date | undefined };
  minOpens: number;
  sortBy: 'date' | 'opens' | 'clicks' | 'recipient';
  sortOrder: 'asc' | 'desc';
}

interface EmailFiltersProps {
  filters: EmailFilters;
  onFiltersChange: (filters: EmailFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const defaultFilters: EmailFilters = {
  search: '',
  status: 'all',
  period: 'all',
  dateRange: { from: undefined, to: undefined },
  minOpens: 0,
  sortBy: 'date',
  sortOrder: 'desc',
};

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
      result = result.filter(email => {
        const emailDate = new Date(email.created_at);
        return isWithinInterval(emailDate, { start: startDate!, end: endDate });
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

export function EmailFiltersComponent({ 
  filters, 
  onFiltersChange, 
  totalCount, 
  filteredCount 
}: EmailFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchValue]);

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.period !== 'all' ||
    filters.minOpens > 0;

  const clearAllFilters = () => {
    setSearchValue('');
    onFiltersChange(defaultFilters);
  };

  const statusOptions = [
    { value: 'all', label: 'Todos', icon: null },
    { value: 'opened', label: 'Abertos', icon: <Eye className="h-3 w-3 text-green-500" /> },
    { value: 'not-opened', label: 'Não abertos', icon: <Eye className="h-3 w-3 text-muted-foreground" /> },
    { value: 'clicked', label: 'Com cliques', icon: <MousePointerClick className="h-3 w-3 text-primary" /> },
  ];

  const periodOptions = [
    { value: 'all', label: 'Todo período' },
    { value: 'today', label: 'Hoje' },
    { value: '7days', label: 'Últimos 7 dias' },
    { value: '30days', label: 'Últimos 30 dias' },
    { value: 'custom', label: 'Personalizado' },
  ];

  const sortOptions = [
    { value: 'date', label: 'Data' },
    { value: 'opens', label: 'Aberturas' },
    { value: 'clicks', label: 'Cliques' },
    { value: 'recipient', label: 'Destinatário' },
  ];

  return (
    <div className="space-y-4">
      {/* Search and main filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por destinatário ou assunto..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue('');
                onFiltersChange({ ...filters, search: '' });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as EmailFilters['status'] })}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[180px] justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {filters.period === 'custom' && filters.dateRange.from
                    ? `${format(filters.dateRange.from, 'dd/MM', { locale: ptBR })} - ${filters.dateRange.to ? format(filters.dateRange.to, 'dd/MM', { locale: ptBR }) : '...'}`
                    : periodOptions.find(o => o.value === filters.period)?.label
                  }
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-2 space-y-1">
              {periodOptions.map(option => (
                <Button
                  key={option.value}
                  variant={filters.period === option.value ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    if (option.value !== 'custom') {
                      onFiltersChange({ 
                        ...filters, 
                        period: option.value as EmailFilters['period'],
                        dateRange: { from: undefined, to: undefined }
                      });
                    } else {
                      onFiltersChange({ ...filters, period: 'custom' });
                    }
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {filters.period === 'custom' && (
              <>
                <div className="border-t" />
                <CalendarComponent
                  mode="range"
                  selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                  onSelect={(range) => onFiltersChange({ 
                    ...filters, 
                    dateRange: { from: range?.from, to: range?.to }
                  })}
                  locale={ptBR}
                  numberOfMonths={2}
                  className="p-3"
                />
              </>
            )}
          </PopoverContent>
        </Popover>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Ordenar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortOptions.map(option => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  sortBy: option.value as EmailFilters['sortBy'],
                  sortOrder: filters.sortBy === option.value 
                    ? (filters.sortOrder === 'desc' ? 'asc' : 'desc')
                    : 'desc'
                })}
              >
                <span className="flex-1">{option.label}</span>
                {filters.sortBy === option.value && (
                  <span className="text-xs text-muted-foreground">
                    {filters.sortOrder === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters and results count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <>
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Busca: "{filters.search}"
                  <button onClick={() => {
                    setSearchValue('');
                    onFiltersChange({ ...filters, search: '' });
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {statusOptions.find(o => o.value === filters.status)?.label}
                  <button onClick={() => onFiltersChange({ ...filters, status: 'all' })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.period !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {periodOptions.find(o => o.value === filters.period)?.label}
                  <button onClick={() => onFiltersChange({ 
                    ...filters, 
                    period: 'all',
                    dateRange: { from: undefined, to: undefined }
                  })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.minOpens > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Min. {filters.minOpens} aberturas
                  <button onClick={() => onFiltersChange({ ...filters, minOpens: 0 })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Limpar todos
              </Button>
            </>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <span>
              Mostrando <strong>{filteredCount}</strong> de <strong>{totalCount}</strong> emails
            </span>
          ) : (
            <span>
              <strong>{totalCount}</strong> email{totalCount !== 1 ? 's' : ''} rastreado{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

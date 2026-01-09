// FUXICO - Component: FilterToolbar
import { useState } from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SavedFiltersDropdown } from './SavedFiltersDropdown';
import { DateRangeFilter } from './DateRangeFilter';
import { ExportMenu } from './ExportMenu';

interface FilterToolbarProps<T> {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
  entityType: string;
  data: T[];
  showDateFilter?: boolean;
  showExport?: boolean;
  showSavedFilters?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  placeholder?: string;
}

export function FilterToolbar<T extends Record<string, unknown>>({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  entityType,
  data,
  showDateFilter = true,
  showExport = true,
  showSavedFilters = true,
  isLoading = false,
  onRefresh,
  placeholder = 'Buscar...',
}: FilterToolbarProps<T>) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const handleDateChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    onFiltersChange({
      ...filters,
      dateFrom: range.from?.toISOString(),
      dateTo: range.to?.toISOString(),
    });
  };

  const handleClearAll = () => {
    onSearchChange('');
    setDateRange({});
    onFiltersChange({});
  };

  const hasActiveFilters = searchTerm || activeFilterCount > 0;

  return (
    <div role="region" aria-label="FilterToolbar" className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border">
      {/* Main toolbar row */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Search input - full width on mobile */}
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 sm:h-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 flex-wrap">
          {showDateFilter && (
            <DateRangeFilter
              value={dateRange}
              onChange={handleDateChange}
            />
          )}

          {showSavedFilters && (
            <SavedFiltersDropdown
              entityType={entityType}
              currentFilters={filters}
              onApplyFilter={onFiltersChange}
            />
          )}

          {showExport && data.length > 0 && (
            <ExportMenu data={data} filename={entityType} />
          )}

          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Active filters chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground mr-1">Filtros:</span>
          {searchTerm && (
            <Badge 
              variant="secondary" 
              className="gap-1 text-xs sm:text-sm px-2 py-0.5 animate-scale-in"
            >
              <span className="hidden sm:inline">Busca:</span> {searchTerm.length > 15 ? searchTerm.slice(0, 15) + '...' : searchTerm}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => onSearchChange('')} 
              />
            </Badge>
          )}
          {dateRange.from && (
            <Badge 
              variant="secondary" 
              className="gap-1 text-xs sm:text-sm px-2 py-0.5 animate-scale-in"
            >
              Período
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => handleDateChange({})} 
              />
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            className="h-6 sm:h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}

export default FilterToolbar;

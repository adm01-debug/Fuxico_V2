import { memo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Calendar,
  Eye,
  MousePointerClick,
  ArrowUpDown,
  ChevronDown,
  Bookmark,
  Save,
  Star,
  Trash2,
  Loader2,
} from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  defaultFilters,
  deserializeEmailFilters,
  serializeEmailFilters,
  type EmailFilters as EmailFiltersState,
} from '@/hooks/use-email-filters';
import { useSavedFilters, type SavedFilter } from '@/hooks/use-saved-filters';

export type { EmailFiltersState };

/** Rótulo compacto do intervalo customizado ("dd/MM - dd/MM"). */
function formatCustomRangeLabel(range: EmailFiltersState['dateRange']): string {
  if (!range.from) return '';
  const from = format(range.from, 'dd/MM', { locale: ptBR });
  const to = range.to ? format(range.to, 'dd/MM', { locale: ptBR }) : '...';
  return `${from} - ${to}`;
}

/** Alterna a direção quando a mesma coluna é reordenada; caso contrário, inicia em 'desc'. */
function nextSortOrder(
  filters: EmailFiltersState,
  nextSortBy: string
): EmailFiltersState['sortOrder'] {
  if (filters.sortBy !== nextSortBy) return 'desc';
  return filters.sortOrder === 'desc' ? 'asc' : 'desc';
}

interface EmailFiltersProps {
  filters: EmailFiltersState;
  onFiltersChange: (filters: EmailFiltersState) => void;
  totalCount: number;
  filteredCount: number;
}

function EmailFiltersBaseComponent({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
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
    // `filters`/`onFiltersChange` são intencionalmente omitidos: o efeito deve
    // disparar apenas quando o texto digitado muda (debounce de busca).
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ----- Filtros salvos (tabela public.saved_filters) -----
  const {
    filters: savedFilters,
    defaultFilter,
    isLoading: isLoadingSaved,
    saveFilter,
    deleteFilter,
    setDefault,
    isSaving,
    isDeleting,
  } = useSavedFilters('emails');

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const appliedDefaultRef = useRef(false);

  const applyFilterState = useCallback(
    (next: EmailFiltersState) => {
      setSearchValue(next.search);
      onFiltersChange(next);
    },
    [onFiltersChange]
  );

  const applySavedFilter = (saved: SavedFilter) => {
    applyFilterState(deserializeEmailFilters(saved.filters));
  };

  // Aplica o filtro padrão do usuário uma única vez, se nenhum filtro estiver ativo.
  useEffect(() => {
    if (appliedDefaultRef.current || !defaultFilter) return;
    appliedDefaultRef.current = true;
    if (!hasActiveFilters) {
      applyFilterState(deserializeEmailFilters(defaultFilter.filters));
    }
  }, [defaultFilter, hasActiveFilters, applyFilterState]);

  const handleSaveCurrentFilter = async () => {
    const created = await saveFilter({
      name: filterName,
      filters: serializeEmailFilters(filters),
    });
    if (created) {
      setFilterName('');
      setIsSaveDialogOpen(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Todos', icon: null },
    { value: 'opened', label: 'Abertos', icon: <Eye className="h-3 w-3 text-green-500" /> },
    {
      value: 'not-opened',
      label: 'Não abertos',
      icon: <Eye className="h-3 w-3 text-muted-foreground" />,
    },
    {
      value: 'clicked',
      label: 'Com cliques',
      icon: <MousePointerClick className="h-3 w-3 text-primary" />,
    },
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
    <div role="search" aria-label="Filtros de email" className="space-y-3 sm:space-y-4">
      {/* Search and main filters row - Stack on mobile, row on desktop */}
      <div className="flex flex-col gap-3">
        {/* Search input - Full width */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por destinatário ou assunto..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-11 pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue('');
                onFiltersChange({ ...filters, search: '' });
              }}
              className="absolute right-3 top-1/2 -mr-1 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter row - Horizontal scroll on mobile */}
        <div className="scrollbar-thin -mb-1 flex gap-2 overflow-x-auto pb-1">
          {/* Status filter */}
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value as EmailFiltersState['status'] })
            }
          >
            <SelectTrigger className="h-10 min-w-[130px] shrink-0 sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
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
              <Button
                aria-label="Selecionar período"
                variant="outline"
                className="h-10 min-w-[140px] shrink-0 justify-between sm:w-[180px]"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm">
                    {filters.period === 'custom' && filters.dateRange.from
                      ? formatCustomRangeLabel(filters.dateRange)
                      : periodOptions.find((o) => o.value === filters.period)?.label}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="space-y-1 p-2">
                {periodOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.period === option.value ? 'secondary' : 'ghost'}
                    className="min-h-[44px] w-full justify-start"
                    onClick={() => {
                      if (option.value !== 'custom') {
                        onFiltersChange({
                          ...filters,
                          period: option.value as EmailFiltersState['period'],
                          dateRange: { from: undefined, to: undefined },
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
                    onSelect={(range) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: { from: range?.from, to: range?.to },
                      })
                    }
                    locale={ptBR}
                    numberOfMonths={1}
                    className="p-3"
                  />
                </>
              )}
            </PopoverContent>
          </Popover>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Ordenar resultados"
                variant="outline"
                className="h-10 shrink-0 px-3"
              >
                <ArrowUpDown className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ordenar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      sortBy: option.value as EmailFiltersState['sortBy'],
                      sortOrder: nextSortOrder(filters, option.value),
                    })
                  }
                  className="min-h-[44px]"
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

          {/* Filtros salvos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Filtros salvos"
                variant="outline"
                className="h-10 shrink-0 px-3"
                disabled={isLoadingSaved}
              >
                {isLoadingSaved ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Bookmark className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Filtros salvos</span>
                {savedFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {savedFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Filtros salvos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedFilters.length === 0 && (
                <div className="px-2 py-3 text-xs text-muted-foreground">
                  Nenhum filtro salvo. Ajuste os filtros e use &quot;Salvar filtro atual&quot;.
                </div>
              )}
              {savedFilters.map((saved) => (
                <div
                  key={saved.id}
                  className="flex items-center gap-1 rounded-sm px-2 hover:bg-accent"
                >
                  <button
                    type="button"
                    onClick={() => applySavedFilter(saved)}
                    aria-label={`Aplicar filtro ${saved.name}`}
                    className="flex min-h-[36px] flex-1 items-center gap-2 truncate text-left text-sm"
                  >
                    <span className="truncate">{saved.name}</span>
                    {saved.is_default && (
                      <Star
                        className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-500"
                        aria-label="Filtro padrão"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Definir ${saved.name} como padrão`}
                    disabled={isSaving}
                    onClick={() => void setDefault(saved.id)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir filtro ${saved.name}`}
                    disabled={isDeleting}
                    onClick={() => void deleteFilter(saved.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-[44px]"
                disabled={isSaving}
                onClick={() => setIsSaveDialogOpen(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar filtro atual
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active filters and results count - Stack on mobile */}
      <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row sm:items-center">
        {/* Active filter badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {hasActiveFilters && (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline sm:text-sm">
                Filtros:
              </span>

              {filters.search && (
                <Badge variant="secondary" className="max-w-[150px] gap-1 text-xs">
                  <span className="truncate">"{filters.search}"</span>
                  <button
                    onClick={() => {
                      setSearchValue('');
                      onFiltersChange({ ...filters, search: '' });
                    }}
                    className="rounded p-0.5 hover:bg-background/50"
                    aria-label="Remover filtro de busca"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {statusOptions.find((o) => o.value === filters.status)?.label}
                  <button
                    onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                    className="rounded p-0.5 hover:bg-background/50"
                    aria-label="Remover filtro de status"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.period !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {periodOptions.find((o) => o.value === filters.period)?.label}
                  <button
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        period: 'all',
                        dateRange: { from: undefined, to: undefined },
                      })
                    }
                    className="rounded p-0.5 hover:bg-background/50"
                    aria-label="Remover filtro de período"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.minOpens > 0 && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Min. {filters.minOpens}
                  <button
                    onClick={() => onFiltersChange({ ...filters, minOpens: 0 })}
                    className="rounded p-0.5 hover:bg-background/50"
                    aria-label="Remover filtro de aberturas mínimas"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar
              </Button>
            </>
          )}
        </div>

        {/* Results count */}
        <div className="shrink-0 text-xs text-muted-foreground sm:text-sm">
          {hasActiveFilters ? (
            <span>
              <strong>{filteredCount}</strong>/<strong>{totalCount}</strong> emails
            </span>
          ) : (
            <span>
              <strong>{totalCount}</strong> email{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar filtro atual</DialogTitle>
            <DialogDescription>
              O filtro fica disponível na sua conta em qualquer dispositivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="saved-filter-name">Nome do filtro</Label>
            <Input
              id="saved-filter-name"
              value={filterName}
              onChange={(event) => setFilterName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && filterName.trim() && !isSaving) {
                  event.preventDefault();
                  void handleSaveCurrentFilter();
                }
              }}
              placeholder="Ex.: Clientes sem abertura"
              maxLength={60}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSaveCurrentFilter()}
              disabled={isSaving || !filterName.trim()}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export const EmailFilters = memo(EmailFiltersBaseComponent);
export const EmailFiltersComponent = EmailFilters;
export default EmailFilters;

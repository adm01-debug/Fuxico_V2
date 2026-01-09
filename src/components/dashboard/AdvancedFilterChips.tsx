// =============================================================================
// FUXICO - Component: AdvancedFilterChips
// Visual filter chips with quick actions and animations
// =============================================================================

import { useState } , memo } from 'react';
import { X, Plus, Star, Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSavedFilters, type SavedFilter } from '@/hooks/use-saved-filters';
import { cn } from '@/lib/utils';

export interface FilterChip {
  id: string;
  label: string;
  value: string;
  type: 'status' | 'date' | 'search' | 'custom';
  color?: 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

interface AdvancedFilterChipsProps {
  entityType: string;
  chips: FilterChip[];
  onRemoveChip: (id: string) => void;
  onClearAll: () => void;
  onAddFilter?: (filter: FilterChip) => void;
  onApplySavedFilter?: (filters: Record<string, unknown>) => void;
  className?: string;
}

const colorClasses: Record<NonNullable<FilterChip['color']>, string> = {
  default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

function AdvancedFilterChipsBase({
  entityType,
  chips,
  onRemoveChip,
  onClearAll,
  onAddFilter,
  onApplySavedFilter,
  className,
}: AdvancedFilterChipsProps) {
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilterType, setNewFilterType] = useState<string>('');
  const [newFilterValue, setNewFilterValue] = useState('');
  
  const { 
    filters: savedFilters, 
    saveFilter, 
    deleteFilter, 
    setDefault,
    defaultFilter,
  } = useSavedFilters(entityType);

  const handleAddFilter = () => {
    if (!newFilterType || !newFilterValue.trim()) return;
    
    const newChip: FilterChip = {
      id: crypto.randomUUID(),
      label: newFilterType,
      value: newFilterValue.trim(),
      type: 'custom',
      color: 'blue',
    };
    
    onAddFilter?.(newChip);
    setNewFilterType('');
    setNewFilterValue('');
    setShowAddFilter(false);
  };

  const handleSaveCurrentFilters = () => {
    const filterObj = chips.reduce((acc, chip) => {
      acc[chip.id] = { label: chip.label, value: chip.value };
      return acc;
    }, {} as Record<string, unknown>);
    
    const name = prompt('Nome do filtro:');
    if (name?.trim()) {
      saveFilter({ name: name.trim(), filters: filterObj });
    }
  };

  const hasChips = chips.length > 0;

  if (!hasChips && savedFilters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2 py-2', className)}>
      {/* Active Filter Chips */}
      {chips.map((chip, index) => (
        <Badge
          key={chip.id}
          variant="secondary"
          className={cn(
            'gap-1.5 pl-3 pr-1 py-1.5 text-sm font-medium transition-all duration-200',
            'animate-scale-in cursor-default',
            colorClasses[chip.color || 'default']
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <span className="text-xs opacity-70">{chip.label}:</span>
          <span className="font-semibold">{chip.value}</span>
          <button
            onClick={() => onRemoveChip(chip.id)}
            className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label={`Remover filtro ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Add Filter Button */}
      {onAddFilter && (
        <Popover open={showAddFilter} onOpenChange={setShowAddFilter}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs border-dashed"
            >
              <Plus className="h-3 w-3" />
              Adicionar Filtro
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tipo</label>
                <Select value={newFilterType} onValueChange={setNewFilterType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="assunto">Assunto</SelectItem>
                    <SelectItem value="campanha">Campanha</SelectItem>
                    <SelectItem value="dominio">Domínio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Valor</label>
                <Input
                  placeholder="Digite o valor..."
                  className="h-8 text-sm"
                  value={newFilterValue}
                  onChange={(e) => setNewFilterValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFilter()}
                />
              </div>
              <Button 
                size="sm" 
                className="w-full h-8"
                onClick={handleAddFilter}
                disabled={!newFilterType || !newFilterValue.trim()}
              >
                Adicionar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Saved Filters Dropdown */}
      {savedFilters.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
            >
              <Star className="h-3 w-3" />
              Salvos ({savedFilters.length})
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1" align="start">
            {savedFilters.map((filter) => (
              <button
                key={filter.id}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm',
                  'hover:bg-accent text-left transition-colors group'
                )}
                onClick={() => onApplySavedFilter?.(filter.filters)}
              >
                {filter.is_default && (
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                )}
                <span className="truncate flex-1">{filter.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFilter(filter.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/10 rounded transition-opacity"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {/* Actions */}
      {hasChips && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleSaveCurrentFilters}
          >
            <Save className="h-3 w-3" />
            Salvar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={onClearAll}
          >
            Limpar tudo
          </Button>
        </>
      )}

      {/* Quick Apply Default Filter */}
      {!hasChips && defaultFilter && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs border-dashed"
          onClick={() => onApplySavedFilter?.(defaultFilter.filters)}
        >
          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          Aplicar: {defaultFilter.name}
        </Button>
      )}
    </div>
  );
}

export default AdvancedFilterChips;


export const AdvancedFilterChips = memo(AdvancedFilterChipsBase);

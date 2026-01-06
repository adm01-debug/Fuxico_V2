// =============================================================================
// FUXICO - Component: SavedFiltersDropdown
// Dropdown para gerenciar filtros salvos pelo usuário
// =============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Filter, Star, Trash2, Plus, Loader2 } from 'lucide-react';
import { useSavedFilters, SaveFilterInput } from '@/hooks/use-saved-filters';

interface SavedFiltersDropdownProps {
  entityType: string;
  currentFilters: Record<string, unknown>;
  onApplyFilter: (filters: Record<string, unknown>) => void;
}

export function SavedFiltersDropdown({
  entityType,
  currentFilters,
  onApplyFilter,
}: SavedFiltersDropdownProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const {
    filters,
    isLoading,
    saveFilter,
    deleteFilter,
    setDefault,
    isSaving,
  } = useSavedFilters(entityType);

  const handleSave = () => {
    if (!filterName.trim()) return;

    const input: SaveFilterInput = {
      name: filterName.trim(),
      filters: currentFilters,
      is_default: isDefault,
    };

    saveFilter(input);
    setShowSaveDialog(false);
    setFilterName('');
    setIsDefault(false);
  };

  const hasActiveFilters = Object.values(currentFilters).some(
    v => v !== undefined && v !== null && v !== ''
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Salvos
            {filters.length > 0 && (
              <span className="ml-1 bg-primary/20 px-1.5 py-0.5 rounded text-xs">
                {filters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            onClick={() => setShowSaveDialog(true)}
            disabled={!hasActiveFilters}
          >
            <Plus className="h-4 w-4 mr-2" />
            Salvar Filtro Atual
          </DropdownMenuItem>

          {filters.length > 0 && <DropdownMenuSeparator />}

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            filters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between group"
              >
                <div
                  className="flex-1 cursor-pointer flex items-center gap-2"
                  onClick={() => onApplyFilter(filter.filters)}
                >
                  {filter.is_default && (
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  )}
                  <span className="truncate">{filter.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefault(filter.id);
                    }}
                    title="Definir como padrão"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFilter(filter.id);
                    }}
                    title="Remover filtro"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}

          {!isLoading && filters.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Nenhum filtro salvo
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
            <DialogDescription>
              Dê um nome para este filtro para reutilizá-lo depois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Input
              placeholder="Nome do filtro"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              Definir como filtro padrão
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!filterName.trim() || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

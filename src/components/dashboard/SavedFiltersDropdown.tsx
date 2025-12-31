// =============================================================================
// FUXICO - Component: SavedFiltersDropdown
// Dropdown para gerenciar filtros salvos
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Filter, Star, Trash2, Save, Loader2 } from 'lucide-react';
import { useSavedFilters } from '@/hooks/use-saved-filters';

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
  const [setAsDefault, setSetAsDefault] = useState(false);

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
    
    saveFilter({
      name: filterName.trim(),
      filters: currentFilters,
      is_default: setAsDefault,
    });
    
    setShowSaveDialog(false);
    setFilterName('');
    setSetAsDefault(false);
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros Salvos
            {filters.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {filters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {hasActiveFilters && (
            <>
              <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Filtro Atual
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : filters.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Nenhum filtro salvo
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
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do filtro</label>
              <Input
                placeholder="Ex: Emails da última semana"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="setDefault"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="setDefault" className="text-sm">
                Definir como filtro padrão
              </label>
            </div>
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

export default SavedFiltersDropdown;

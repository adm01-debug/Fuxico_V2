// =============================================================================
// FUXICO - Component: AdvancedSearch
// Componente de busca fulltext com preview
// =============================================================================

import { useState, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AdvancedSearchProps<T> {
  placeholder?: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  results: T[];
  isSearching: boolean;
  onSelect?: (item: T) => void;
  renderItem?: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  minChars?: number;
}

export function AdvancedSearch<T>({
  placeholder = 'Buscar...',
  searchTerm,
  onSearchChange,
  results,
  isSearching,
  onSelect,
  renderItem,
  getItemKey,
  minChars = 2,
}: AdvancedSearchProps<T>) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback((item: T) => {
    onSelect?.(item);
    setOpen(false);
    onSearchChange('');
  }, [onSelect, onSearchChange]);

  const handleClear = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const showResults = searchTerm.length >= minChars;

  return (
    <Popover open={open && showResults} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isSearching && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            {isSearching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente termos diferentes
                  </p>
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup heading={`${results.length} resultado${results.length > 1 ? 's' : ''}`}>
                {results.slice(0, 10).map((item) => (
                  <CommandItem
                    key={getItemKey(item)}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    {renderItem ? renderItem(item) : String(item)}
                  </CommandItem>
                ))}
                {results.length > 10 && (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    +{results.length - 10} mais resultados
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Versão simplificada apenas com input
export function SimpleSearch({
  placeholder = 'Buscar...',
  value,
  onChange,
  isSearching,
}: {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {isSearching && (
        <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
}

export default AdvancedSearch;

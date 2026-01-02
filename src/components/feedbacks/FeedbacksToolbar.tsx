import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, MessageSquare, Archive } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { SavedFiltersDropdown } from '@/components/SavedFiltersDropdown';
import { AdvancedFilters, FilterValue, FilterConfig } from '@/components/AdvancedFilters';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { fuxicoFilterConfigs } from '@/lib/fuxicoSchemas';
import { exportToExcel } from '@/lib/excelImporter';
import { toast } from 'sonner';

interface FeedbacksToolbarProps {
  onSearch: (term: string) => void;
  onFiltersChange: (filters: FilterValue[]) => void;
  onRefresh: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkResponder: () => void;
  onBulkArquivar: () => void;
  currentFilters: Record<string, unknown>;
  data?: unknown[];
}

export const FeedbacksToolbar = memo(function FeedbacksToolbar({ onSearch, onFiltersChange, onRefresh, selectedCount, onClearSelection, onBulkResponder, onBulkArquivar, currentFilters, data = [] }: FeedbacksToolbarProps) {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);

  const handleExport = () => {
    if (data.length === 0) { toast.warning('Nenhum dado'); return; }
    exportToExcel(data as Record<string, unknown>[], [
      { key: 'titulo' as const, label: 'Título' },
      { key: 'categoria' as const, label: 'Categoria' },
      { key: 'status' as const, label: 'Status' },
      { key: 'created_at' as const, label: 'Data' },
    ], 'feedbacks', 'Feedbacks');
    toast.success('Exportado!');
  };

  const bulkActions = [
    { key: 'responder', label: 'Responder', icon: <MessageSquare className="h-4 w-4" />, onClick: onBulkResponder },
    { key: 'arquivar', label: 'Arquivar', icon: <Archive className="h-4 w-4" />, onClick: onBulkArquivar },
  ];

  return (
    <div className="space-y-3">
      {selectedCount > 0 && <BulkActionsBar selectedCount={selectedCount} onClearSelection={onClearSelection} actions={bulkActions} />}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <SearchInput onSearch={onSearch} placeholder="Buscar feedback..." className="w-64" />
          <AdvancedFilters filters={fuxicoFilterConfigs.feedbacks as FilterConfig[]} values={filterValues} onChange={(v) => { setFilterValues(v); onFiltersChange(v); }} />
          <SavedFiltersDropdown entityType="feedbacks" currentFilters={currentFilters} onApplyFilter={(f) => { const values = Object.entries(f).map(([k,v]) => ({ key: k, operator: 'eq' as const, value: v })); setFilterValues(values); onFiltersChange(values); }} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
});
export default FeedbacksToolbar;

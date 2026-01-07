// FUXICO - Component: SelectableTable
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BulkActionsBar } from './BulkActionsBar';
import { useBulkActions, BulkAction } from '@/hooks/use-bulk-actions';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
  /** Hide column on mobile screens */
  hideOnMobile?: boolean;
  /** Priority column - always visible */
  priority?: boolean;
}

interface SelectableTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  table: string;
  queryKey: string[];
  availableActions?: BulkAction[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

export function SelectableTable<T extends { id: string }>({
  data,
  columns,
  table,
  queryKey,
  availableActions = ['delete', 'export'],
  onRowClick,
  isLoading = false,
}: SelectableTableProps<T>) {
  const bulk = useBulkActions({ table, queryKey });
  
  const allIds = data.map(row => row.id);
  const allSelected = allIds.length > 0 && allIds.every(id => bulk.isSelected(id));
  const someSelected = allIds.some(id => bulk.isSelected(id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      bulk.clearSelection();
    } else {
      bulk.selectAll(allIds);
    }
  };

  const getValue = (row: T, key: string): unknown => {
    const keys = key.split('.');
    let value: unknown = row;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile: horizontal scroll container */}
      <div className="rounded-md border overflow-x-auto -mx-1 px-1">
        <Table className="min-w-[400px]">
          <TableHeader>
            <TableRow>
              {/* Checkbox column - fixed width, always visible */}
              <TableHead className="w-11 min-w-11 p-2 sm:p-4 sticky left-0 bg-background z-10">
                <div className="flex items-center justify-center h-11 w-11">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) (el as HTMLButtonElement).dataset.state = someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked';
                    }}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                    className="h-5 w-5"
                  />
                </div>
              </TableHead>
              {columns.map((col) => (
                <TableHead 
                  key={String(col.key)} 
                  className={cn(
                    "text-xs sm:text-sm whitespace-nowrap p-2 sm:p-4",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.className
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + 1} 
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "transition-colors",
                    bulk.isSelected(row.id) && "bg-muted/50",
                    onRowClick && "cursor-pointer active:bg-muted/70"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Checkbox cell - 44px touch target */}
                  <TableCell 
                    className="p-2 sm:p-4 sticky left-0 bg-background z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center h-11 w-11">
                      <Checkbox
                        checked={bulk.isSelected(row.id)}
                        onCheckedChange={() => bulk.toggleSelection(row.id)}
                        aria-label={`Selecionar linha ${row.id}`}
                        className="h-5 w-5"
                      />
                    </div>
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell 
                      key={String(col.key)} 
                      className={cn(
                        "text-xs sm:text-sm p-2 sm:p-4",
                        col.hideOnMobile && "hidden sm:table-cell",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(getValue(row, String(col.key)), row)
                        : String(getValue(row, String(col.key)) ?? '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onAction={bulk.executeAction}
        onClear={bulk.clearSelection}
        isProcessing={bulk.isProcessing}
        availableActions={availableActions}
      />
    </>
  );
}

export default SelectableTable;

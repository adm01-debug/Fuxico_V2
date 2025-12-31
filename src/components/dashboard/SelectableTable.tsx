// FUXICO - Component: SelectableTable
import { useState } from 'react';
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

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) (el as HTMLButtonElement).dataset.state = someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked';
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead key={String(col.key)} className={col.className}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  className={`${bulk.isSelected(row.id) ? 'bg-muted/50' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={bulk.isSelected(row.id)}
                      onCheckedChange={() => bulk.toggleSelection(row.id)}
                      aria-label={`Selecionar linha ${row.id}`}
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className={col.className}>
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

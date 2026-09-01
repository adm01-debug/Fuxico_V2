import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

function toCssSize(width: number | string): string {
  return typeof width === "number" ? `${width}px` : width;
}

export interface VirtualTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  width?: string | number;
  className?: string;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  overscan?: number;
  height?: number | string;
  emptyMessage?: ReactNode;
  className?: string;
  getRowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
}

/**
 * Tabela virtualizada para listas longas (>1000 linhas).
 * Renderiza apenas as linhas visíveis + overscan, mantendo 60fps.
 */
export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 44,
  overscan = 8,
  height = 480,
  emptyMessage = "Nenhum registro encontrado.",
  className,
  getRowKey,
  onRowClick,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  if (data.length === 0) {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center justify-center rounded-md border border-border bg-card p-8 text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-md border border-border bg-card", className)}
    >
      <div
        role="table"
        aria-rowcount={data.length}
        className="relative"
      >
        <div
          role="row"
          className="flex items-center border-b border-border bg-muted/40 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          style={{ height: rowHeight }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              role="columnheader"
              className={cn("flex-1 truncate px-2", col.className)}
              style={col.width ? { flex: `0 0 ${toCssSize(col.width)}` } : undefined}
            >
              {col.header}
            </div>
          ))}
        </div>
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height, contain: "strict" }}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index];
              const key = getRowKey ? getRowKey(row, virtualRow.index) : virtualRow.index;
              return (
                <div
                  key={key}
                  role="row"
                  aria-rowindex={virtualRow.index + 1}
                  onClick={onRowClick ? () => onRowClick(row, virtualRow.index) : undefined}
                  className={cn(
                    "absolute left-0 right-0 flex items-center border-b border-border/60 px-4 text-sm transition-colors hover:bg-muted/40",
                    onRowClick && "cursor-pointer",
                  )}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      role="cell"
                      className={cn("flex-1 truncate px-2", col.className)}
                      style={col.width ? { flex: `0 0 ${toCssSize(col.width)}` } : undefined}
                    >
                      {col.cell(row, virtualRow.index)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VirtualTable;

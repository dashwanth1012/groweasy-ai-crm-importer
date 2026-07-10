"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowLeft, ArrowRight, ArrowUpDown, Check, Clipboard, Columns3, Download, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  headers?: string[];
  maxHeight?: number;
  emptyText?: string;
  className?: string;
  enableToolbar?: boolean;
  enableCellCopy?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  headers,
  maxHeight = 360,
  emptyText = "No rows to display",
  className,
  enableToolbar = true,
  enableCellCopy = true,
  enablePagination = true,
  enableRowSelection = true
}: DataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const copyTimerRef = useRef<number | null>(null);
  const resolvedHeaders = useMemo(() => headers ?? (data[0] ? Object.keys(data[0]) : []), [data, headers]);
  const filteredData = useMemo(() => {
    const normalized = filter.trim().toLowerCase();

    if (!normalized) {
      return data;
    }

    return data.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(normalized)));
  }, [data, filter]);

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [filter, data.length]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setColumnVisibility((current) => {
      const next: VisibilityState = {};
      for (const header of resolvedHeaders) {
        next[header] = current[header] ?? true;
      }
      return next;
    });
  }, [resolvedHeaders]);

  const columns = useMemo<ColumnDef<T>[]>(
    () => {
      const dataColumns = resolvedHeaders.map<ColumnDef<T>>((header) => ({
        accessorKey: header,
        header,
        size: 180,
        minSize: 120,
        maxSize: 420,
        cell: ({ getValue }) => {
          const value = getValue();
          return <span title={String(value ?? "")}>{String(value ?? "") || "-"}</span>;
        }
      }));

      if (!enableRowSelection) {
        return dataColumns;
      }

      return [
        {
          id: "__select",
          size: 52,
          minSize: 52,
          maxSize: 52,
          header: ({ table }) => (
            <input
              type="checkbox"
              aria-label="Select all visible rows"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="h-4 w-4 accent-foreground"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              aria-label="Select row"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="h-4 w-4 accent-foreground"
            />
          )
        },
        ...dataColumns
      ];
    },
    [enableRowSelection, resolvedHeaders]
  );
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableRowSelection,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });
  const rows = table.getRowModel().rows;
  const visibleColumnCount = Math.max(1, table.getVisibleLeafColumns().length);
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

  if (data.length === 0) {
    return (
      <div className={cn("flex h-44 items-center justify-center rounded-[8px] border border-dashed border-border text-sm text-muted-foreground", className)}>
        {emptyText}
      </div>
    );
  }

  async function copyCell(value: unknown, cellId: string) {
    if (!enableCellCopy) {
      return;
    }

    const text = String(value ?? "");

    if (!text) {
      return;
    }

    await navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopiedCell(cellId);

    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }

    copyTimerRef.current = window.setTimeout(() => setCopiedCell((current) => (current === cellId ? null : current)), 900);
  }

  function exportSelectedRows() {
    const rowsToExport = selectedRows.length > 0 ? selectedRows : filteredData;
    const csv = toCsv(rowsToExport, resolvedHeaders);
    downloadTextFile("groweasy-selected-rows.csv", csv, "text/csv");
  }

  return (
    <div className={cn("rounded-[8px] border border-border bg-card", className)}>
      {enableToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-muted-foreground">
            <Columns3 className="h-4 w-4" />
            {filteredData.length} rows
          </div>
          {enableRowSelection && (
            <button
              type="button"
              className="focus-ring flex h-9 items-center gap-2 rounded-[8px] border border-border px-3 text-xs font-black"
              onClick={exportSelectedRows}
              aria-label="Export selected rows"
            >
              <Download className="h-3.5 w-3.5" />
              Export {selectedRows.length > 0 ? selectedRows.length : "All"}
            </button>
          )}
          <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <span className="sr-only">Filter table rows</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter table..."
              className="focus-ring h-9 w-full rounded-[8px] border border-border bg-background pl-9 pr-3 text-xs font-bold outline-none placeholder:text-muted-foreground"
            />
          </label>
          <details className="relative">
            <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 rounded-[8px] border border-border px-3 py-2 text-xs font-black">
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </summary>
            <div className="absolute right-0 z-20 mt-2 max-h-72 w-56 overflow-auto rounded-[8px] border border-border bg-card p-2 shadow-soft">
              {table.getAllLeafColumns().map((column) => (
                <label key={column.id} className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-2 text-xs font-bold hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="h-4 w-4 accent-foreground"
                  />
                  <span className="truncate">{column.id}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
      )}
      <div ref={parentRef} className="scrollbar-soft overflow-auto" style={{ maxHeight }}>
      <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
        <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="relative whitespace-nowrap px-3 py-2 text-[10px] font-black uppercase text-foreground"
                  style={{ width: header.getSize() }}
                >
                  {header.column.id === "__select" ? (
                    <div className="flex min-h-8 items-center px-1">{flexRender(header.column.columnDef.header, header.getContext())}</div>
                  ) : (
                    <button
                      type="button"
                      className="focus-ring flex min-h-8 items-center gap-2 rounded-[6px] px-1 text-left"
                      onClick={header.column.getToggleSortingHandler()}
                      aria-label={`Sort by ${header.column.id}`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      <span className="sr-only">{header.column.getIsSorted() || "unsorted"}</span>
                    </button>
                  )}
                  {header.column.id !== "__select" && (
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none"
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      aria-label={`Resize ${header.column.id}`}
                    />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: paddingTop }} colSpan={visibleColumnCount} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];

            return (
              <tr key={row.id} className="border-b border-border">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="max-w-[240px] border-b border-border px-3 py-2 align-middle text-muted-foreground"
                    style={{ width: cell.column.getSize() }}
                  >
                    {cell.column.id === "__select" ? (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    ) : (
                      <button
                        type="button"
                        className="focus-ring group flex min-h-8 w-full items-center justify-between gap-3 rounded-[6px] px-1 text-left"
                        onClick={() => copyCell(cell.getValue(), cell.id)}
                        title={String(cell.getValue() ?? "")}
                        aria-label={`Copy ${cell.column.id} cell`}
                      >
                        <span className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                        {copiedCell === cell.id ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-accent-foreground" />
                        ) : (
                          <Clipboard className="h-3.5 w-3.5 shrink-0 opacity-0 editorial-transition group-hover:opacity-60" />
                        )}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: paddingBottom }} colSpan={visibleColumnCount} />
            </tr>
          )}
        </tbody>
      </table>
      </div>
      {enablePagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs font-bold">
          <div className="text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
              className="focus-ring h-9 rounded-[8px] border border-border bg-background px-2"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
            <button
              type="button"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-[8px] border border-border disabled:opacity-40"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-[8px] border border-border disabled:opacity-40"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function toCsv(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const safeHeaders = headers.filter((header) => header !== "__select");
  const escape = (value: unknown) => {
    const text = String(value ?? "").replace(/\r?\n/g, "\\n");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [safeHeaders.join(","), ...rows.map((row) => safeHeaders.map((header) => escape(row[header])).join(","))].join("\n");
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

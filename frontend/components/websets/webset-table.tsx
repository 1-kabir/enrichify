"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  SortingState,
  RowSelectionState,
} from "@tanstack/react-table";
import type {
  WebsetCell as WebsetCellType,
  ColumnDefinition,
} from "@/types/webset";
import { WebsetCellComponent } from "./webset-cell";
import { CellEditor } from "./cell-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WebsetTableProps {
  columns: ColumnDefinition[];
  cells: WebsetCellType[];
  rowCount: number;
  visibleColumns: string[];
  onCellUpdate: (
    row: number,
    column: string,
    value: string,
    confidenceScore?: number,
  ) => void;
  onRowSelect?: (rows: number[]) => void;
}

export function WebsetTable({
  columns,
  cells,
  rowCount,
  visibleColumns,
  onCellUpdate,
  onRowSelect,
}: WebsetTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<WebsetCellType | null>(null);

  // Create a map of cells by row and column for quick lookup
  const cellMap = useMemo(() => {
    const map = new Map<string, WebsetCellType>();
    cells.forEach((cell) => {
      map.set(`${cell.row}-${cell.column}`, cell);
    });
    return map;
  }, [cells]);

  // Generate row data
  const data = useMemo(() => {
    return Array.from({ length: rowCount }, (_, i) => {
      const row: any = { _rowId: i };
      columns.forEach((col) => {
        const cell = cellMap.get(`${i}-${col.id}`);
        row[col.id] = cell;
      });
      return row;
    });
  }, [rowCount, columns, cellMap]);

  // Create table columns
  const tableColumns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
      {
        id: "row",
        header: "#",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground font-mono">
            {row.original._rowId}
          </div>
        ),
        enableSorting: false,
        size: 60,
      },
    ];

    columns.forEach((col) => {
      if (visibleColumns.includes(col.id)) {
        cols.push({
          id: col.id,
          accessorKey: col.id,
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-8 px-2"
              >
                {col.name}
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const cell = row.original[col.id] as WebsetCellType | undefined;
            return (
              <WebsetCellComponent
                cell={cell || null}
                onEdit={() => {
                  const cellData = cell || {
                    id: crypto.randomUUID(),
                    websetId: "",
                    row: row.original._rowId,
                    column: col.id,
                    value: "",
                    confidenceScore: 1.0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  setEditingCell(cellData);
                }}
                isEditing={
                  editingCell?.row === row.original._rowId &&
                  editingCell?.column === col.id
                }
              />
            );
          },
          enableSorting: true,
          minSize: 200,
        });
      }
    });

    return cols;
  }, [columns, visibleColumns, editingCell]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      if (onRowSelect) {
        const newSelection =
          typeof updater === "function" ? updater(rowSelection) : updater;
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => parseInt(key));
        onRowSelect(selectedRows);
      }
    },
    state: {
      sorting,
      rowSelection,
    },
  });

  const handleCellSave = (value: string, confidenceScore?: number) => {
    if (editingCell) {
      onCellUpdate(editingCell.row, editingCell.column, value, confidenceScore);
      setEditingCell(null);
    }
  };

  return (
    <>
      <div className="rounded-md border bg-background overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b bg-muted/50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    row.getIsSelected() && "bg-accent/50",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2 align-top">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableColumns.length} className="h-24 text-center">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CellEditor
        cell={editingCell}
        isOpen={!!editingCell}
        onClose={() => setEditingCell(null)}
        onSave={handleCellSave}
      />
    </>
  );
}

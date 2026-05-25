import type { ReactNode, TableHTMLAttributes } from 'react';
import type { TableInstance } from '../core/types.js';
import { flexRender } from './flex-render.js';

export interface TableXProps<TData>
  extends Omit<TableHTMLAttributes<HTMLTableElement>, 'children'> {
  table: TableInstance<TData>;
  emptyState?: ReactNode;
}

export function TableX<TData>({
  table,
  emptyState = null,
  ...tableProps
}: TableXProps<TData>) {
  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleColumns();

  return (
    <table {...tableProps}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {flexRender(
                  header.column.columnDef.header ?? header.column.id,
                  table.getHeaderContext(header)
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.length > 0
          ? rows.map((row) => (
              <tr key={row.id}>
                {table.getVisibleCells(row).map((cell) => (
                  <td key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell ?? cell.renderValue(),
                      table.getCellContext(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))
          : emptyState && (
              <tr>
                <td colSpan={visibleColumns.length}>{emptyState}</td>
              </tr>
            )}
      </tbody>
    </table>
  );
}

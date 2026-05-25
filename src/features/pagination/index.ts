import { createRowModelFromRows } from '../../core/row-model.js';
import type { PaginationState, RowModel } from '../../core/types.js';

export function createPaginationRowModel<TData>(
  rowModel: RowModel<TData>,
  pagination: PaginationState
): RowModel<TData> {
  const pageSize = Math.max(1, pagination.pageSize);
  const pageIndex = Math.max(0, pagination.pageIndex);
  const start = pageIndex * pageSize;

  return createRowModelFromRows(
    rowModel.rows.slice(start, start + pageSize),
    rowModel.rowsById
  );
}

import { createRowModelFromRows } from '../../core/row-model.js';
import type { Column, ColumnFiltersState, RowModel } from '../../core/types.js';

export function createFilteredRowModel<TData>(
  rowModel: RowModel<TData>,
  columns: readonly Column<TData>[],
  columnFilters: ColumnFiltersState
): RowModel<TData> {
  const activeFilters = columnFilters.filter(
    (filter) => filter.value !== undefined && filter.value !== null && filter.value !== ''
  );

  if (activeFilters.length === 0) {
    return rowModel;
  }

  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const rows = rowModel.rows.filter((row) =>
    activeFilters.every((filter) => {
      const column = columnsById.get(filter.id);
      const filterFn = column?.columnDef.filterFn;

      if (filterFn) {
        return filterFn(row, filter.id, filter.value);
      }

      const value = row.getValue(filter.id);
      return String(value ?? '')
        .toLowerCase()
        .includes(String(filter.value).toLowerCase());
    })
  );

  return createRowModelFromRows(rows, rowModel.rowsById);
}

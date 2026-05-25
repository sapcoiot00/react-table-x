import type { Cell, Column, Row, RowId, RowModel } from './types.js';

export function createCoreRowModel<TData>(
  data: readonly TData[],
  columns: readonly Column<TData>[],
  getVisibleColumns: () => readonly Column<TData>[],
  getRowId: (row: TData, index: number) => RowId
): RowModel<TData> {
  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const rowsById = new Map<RowId, Row<TData>>();
  const rows = data.map<Row<TData>>((original, index) => {
    const valueCache = new Map<string, unknown>();
    const cellCache = new WeakMap<readonly Column<TData>[], Cell<TData>[]>();

    const getCells = (nextColumns: readonly Column<TData>[]) => {
      const cachedCells = cellCache.get(nextColumns);

      if (cachedCells) {
        return cachedCells;
      }

      const cells = createCells(row, nextColumns);
      cellCache.set(nextColumns, cells);
      return cells;
    };

    const row: Row<TData> = {
      id: getRowId(original, index),
      index,
      original,
      getValue: (columnId) => {
        if (valueCache.has(columnId)) {
          return valueCache.get(columnId) as never;
        }

        const column = columnsById.get(columnId);
        const value = column?.getValue(original, index);
        valueCache.set(columnId, value);
        return value as never;
      },
      getAllCells: () => getCells(columns),
      getVisibleCells: () => getCells(getVisibleColumns())
    };

    rowsById.set(row.id, row);
    return row;
  });

  return {
    rows,
    flatRows: rows,
    rowsById
  };
}

export function createRowModelFromRows<TData>(
  rows: Row<TData>[],
  rowsById?: Map<RowId, Row<TData>>
): RowModel<TData> {
  return {
    rows,
    flatRows: rows,
    rowsById: rowsById ?? new Map(rows.map((row) => [row.id, row]))
  };
}

export function createCells<TData>(
  row: Row<TData>,
  columns: readonly Column<TData>[]
): Cell<TData>[] {
  return columns.map((column) => ({
    id: `${row.id}_${column.id}`,
    row,
    column,
    getValue: () => row.getValue(column.id),
    renderValue: () => row.getValue(column.id)
  }));
}

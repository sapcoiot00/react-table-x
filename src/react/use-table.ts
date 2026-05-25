import { useRef, useSyncExternalStore } from 'react';
import { createTableX } from '../core/table.js';
import type { TableInstance, TableOptions } from '../core/types.js';

export function useTableX<TData>(options: TableOptions<TData>): TableInstance<TData> {
  const tableRef = useRef<TableInstance<TData>>();

  if (!tableRef.current) {
    tableRef.current = createTableX(options);
  }

  tableRef.current.setOptions(options);

  useSyncExternalStore(
    tableRef.current.subscribe,
    tableRef.current.getState,
    tableRef.current.getState
  );

  return tableRef.current;
}

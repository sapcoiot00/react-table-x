import { createColumns } from './column.js';
import { memo } from './memo.js';
import { createCoreRowModel } from './row-model.js';
import {
  createTableStore,
  defaultTableState,
  mergeTableState,
  resolveUpdater
} from './store.js';
import type {
  Cell,
  CellContext,
  Header,
  HeaderContext,
  HeaderGroup,
  RowId,
  RowModel,
  TableInstance,
  TableOptions,
  TableState
} from './types.js';

const defaultGetRowId = <TData>(_: TData, index: number): RowId => String(index);

export function createTable<TData>(options: TableOptions<TData>): TableInstance<TData> {
  let resolvedOptions = options;

  const initialStateFromFeatures = (options.features ?? []).reduce(
    (state, feature) => feature.getInitialState?.(state) ?? state,
    mergeTableState(defaultTableState, options.initialState)
  );
  const store = createTableStore(initialStateFromFeatures);

  const getMemoizedColumns = memo(createColumns<TData>);
  const getMemoizedVisibleColumns = memo(
    (
      columns: ReturnType<typeof createColumns<TData>>,
      columnVisibility: TableState['columnVisibility']
    ) => columns.filter((column) => columnVisibility[column.id] !== false)
  );
  const getMemoizedState = memo(
    (baseState: TableState, controlledState: Partial<TableState> | undefined) =>
      controlledState ? mergeTableState(baseState, controlledState) : baseState
  );
  const getMemoizedRowModel = memo(
    (
      data: readonly TData[],
      columns: ReturnType<typeof createColumns<TData>>,
      visibleColumns: ReturnType<typeof createColumns<TData>>,
      getRowId: (row: TData, index: number) => RowId
    ) => createCoreRowModel(data, columns, () => visibleColumns, getRowId)
  );

  const table: TableInstance<TData> = {
    getOptions: () => resolvedOptions,
    setOptions: (nextOptions) => {
      resolvedOptions = nextOptions;
    },
    getState: () => getMemoizedState([store.getState(), resolvedOptions.state]),
    setState: (updater) => {
      const previousState = table.getState();
      const nextState = mergeTableState(
        defaultTableState,
        resolveUpdater(updater, previousState)
      );

      resolvedOptions.onStateChange?.(nextState);

      if (!resolvedOptions.state) {
        store.setState(nextState);
      }
    },
    subscribe: store.subscribe,
    getAllColumns: () => getMemoizedColumns([resolvedOptions.columns]),
    getVisibleColumns: () => {
      const state = table.getState();
      return getMemoizedVisibleColumns([
        table.getAllColumns(),
        state.columnVisibility
      ]);
    },
    getHeaderGroups: () => {
      const headers = table.getVisibleColumns().map((column): Header<TData> => ({
        id: column.id,
        column
      }));

      return [{ id: 'header', headers }];
    },
    getRowModel: (): RowModel<TData> => {
      const getRowId = resolvedOptions.getRowId ?? defaultGetRowId;

      return getMemoizedRowModel([
        resolvedOptions.data,
        table.getAllColumns(),
        table.getVisibleColumns(),
        getRowId
      ]);
    },
    getCellContext: <TValue>(cell: Cell<TData, TValue>): CellContext<TData, TValue> => ({
      table,
      row: cell.row,
      column: cell.column,
      cell,
      getValue: cell.getValue
    }),
    getHeaderContext: <TValue>(
      header: Header<TData, TValue>
    ): HeaderContext<TData, TValue> => ({
      table,
      column: header.column,
      header
    })
  };

  (options.features ?? []).forEach((feature) => feature.createTable?.(table));

  return table;
}

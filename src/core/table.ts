import { createColumns } from './column.js';
import { resolveTableFeatures } from './features.js';
import { memo } from './memo.js';
import { createCoreRowModel } from './row-model.js';
import { createVisibleColumns } from '../features/column-visibility/index.js';
import { createFilteredRowModel } from '../features/filtering/index.js';
import { createPaginationRowModel } from '../features/pagination/index.js';
import { getNextRowSelectionState } from '../features/row-selection/index.js';
import { createSortedRowModel } from '../features/sorting/index.js';
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
  PaginationState,
  Row,
  RowId,
  RowModel,
  RowSelectionState,
  SortingState,
  TableInstance,
  TableOptions,
  TableState
} from './types.js';

const defaultGetRowId = <TData>(_: TData, index: number): RowId => String(index);

export function createTableX<TData>(options: TableOptions<TData>): TableInstance<TData> {
  let resolvedOptions = options;
  const features = resolveTableFeatures(options.features);

  const initialStateFromFeatures = features.reduce(
    (state, feature) => feature.getInitialState?.(state) ?? state,
    mergeTableState(defaultTableState, options.initialState)
  );
  const store = createTableStore(initialStateFromFeatures);

  const getMemoizedColumns = memo(createColumns<TData>);
  const getMemoizedVisibleColumns = memo(
    (
      columns: ReturnType<typeof createColumns<TData>>,
      columnVisibility: TableState['columnVisibility']
    ) => createVisibleColumns(columns, columnVisibility)
  );
  const getMemoizedState = memo(
    (baseState: TableState, controlledState: Partial<TableState> | undefined) =>
      controlledState ? mergeTableState(baseState, controlledState) : baseState
  );
  const getMemoizedHeaderGroups = memo(
    (columns: ReturnType<typeof createColumns<TData>>): HeaderGroup<TData>[] => [
      {
        id: 'header',
        headers: columns.map((column): Header<TData> => ({
          id: column.id,
          column
        }))
      }
    ]
  );
  let table: TableInstance<TData>;
  const getCurrentVisibleColumns = () => table.getVisibleColumns();
  const getMemoizedCoreRowModel = memo(
    (
      data: readonly TData[],
      columns: ReturnType<typeof createColumns<TData>>,
      getRowId: (row: TData, index: number) => RowId
    ) => createCoreRowModel(data, columns, getCurrentVisibleColumns, getRowId)
  );
  const visibleCellCache = new WeakMap<
    Row<TData>,
    WeakMap<ReturnType<typeof createColumns<TData>>, Cell<TData>[]>
  >();
  const getVisibleCellsForRow = (
    row: Row<TData>,
    visibleColumns: ReturnType<typeof createColumns<TData>>
  ) => {
    let rowCache = visibleCellCache.get(row);

    if (!rowCache) {
      rowCache = new WeakMap();
      visibleCellCache.set(row, rowCache);
    }

    const cachedCells = rowCache.get(visibleColumns);

    if (cachedCells) {
      return cachedCells;
    }

    const visibleColumnIds = new Set(visibleColumns.map((column) => column.id));
    const cells = row
      .getAllCells()
      .filter((cell) => visibleColumnIds.has(cell.column.id));

    rowCache.set(visibleColumns, cells);
    return cells;
  };
  const getMemoizedFilteredRowModel = memo(
    (
      rowModel: RowModel<TData>,
      columns: ReturnType<typeof createColumns<TData>>,
      columnFilters: TableState['columnFilters'],
      manualFiltering: boolean | undefined
    ) =>
      manualFiltering
        ? rowModel
        : createFilteredRowModel(rowModel, columns, columnFilters)
  );
  const getMemoizedSortedRowModel = memo(
    (
      rowModel: RowModel<TData>,
      columns: ReturnType<typeof createColumns<TData>>,
      sorting: TableState['sorting'],
      manualSorting: boolean | undefined
    ) =>
      manualSorting
        ? rowModel
        : createSortedRowModel(rowModel, columns, sorting)
  );
  const getMemoizedPaginationRowModel = memo(
    (
      rowModel: RowModel<TData>,
      pagination: TableState['pagination'],
      manualPagination: boolean | undefined
    ) =>
      manualPagination ? rowModel : createPaginationRowModel(rowModel, pagination)
  );

  const updateState = (updater: (previous: TableState) => TableState) => {
    const previousState = table.getState();
    const nextState = mergeTableState(defaultTableState, updater(previousState));

    resolvedOptions.onStateChange?.(nextState);
    store.setState(nextState);
  };

  table = {
    getOptions: () => resolvedOptions,
    setOptions: (nextOptions) => {
      resolvedOptions = nextOptions;
    },
    getState: () => getMemoizedState([store.getState(), resolvedOptions.state]),
    setState: (updater) => {
      updateState((previousState) => resolveUpdater(updater, previousState));
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
    getVisibleCells: (row) => getVisibleCellsForRow(row, table.getVisibleColumns()),
    getHeaderGroups: () => getMemoizedHeaderGroups([table.getVisibleColumns()]),
    getCoreRowModel: (): RowModel<TData> => {
      const getRowId = resolvedOptions.getRowId ?? defaultGetRowId;

      return getMemoizedCoreRowModel([
        resolvedOptions.data,
        table.getAllColumns(),
        getRowId
      ]);
    },
    getFilteredRowModel: () =>
      getMemoizedFilteredRowModel([
        table.getCoreRowModel(),
        table.getAllColumns(),
        table.getState().columnFilters,
        resolvedOptions.manualFiltering
      ]),
    getSortedRowModel: () =>
      getMemoizedSortedRowModel([
        table.getFilteredRowModel(),
        table.getAllColumns(),
        table.getState().sorting,
        resolvedOptions.manualSorting
      ]),
    getPaginationRowModel: () =>
      getMemoizedPaginationRowModel([
        table.getSortedRowModel(),
        table.getState().pagination,
        resolvedOptions.manualPagination
      ]),
    getRowModel: () => table.getPaginationRowModel(),
    setSorting: (updater) => {
      resolvedOptions.onSortingChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        sorting: resolveUpdater<SortingState>(updater, previousState.sorting)
      }));
    },
    setPagination: (updater) => {
      resolvedOptions.onPaginationChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        pagination: resolveUpdater<PaginationState>(
          updater,
          previousState.pagination
        )
      }));
    },
    setColumnFilters: (updater) => {
      resolvedOptions.onColumnFiltersChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        columnFilters: resolveUpdater(updater, previousState.columnFilters)
      }));
    },
    setRowSelection: (updater) => {
      resolvedOptions.onRowSelectionChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        rowSelection: resolveUpdater<RowSelectionState>(
          updater,
          previousState.rowSelection
        )
      }));
    },
    toggleRowSelected: (rowId, selected) => {
      table.setRowSelection((previousState) =>
        getNextRowSelectionState(previousState, rowId, selected)
      );
    },
    getIsRowSelected: (rowId) => table.getState().rowSelection[rowId] === true,
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

  features.forEach((feature) => feature.createTable?.(table));

  return table;
}

export { createTableX as createTable };

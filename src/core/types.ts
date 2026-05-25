export type RowId = string;

export type Updater<TValue> = TValue | ((previous: TValue) => TValue);

export type AccessorFn<TData, TValue> = (
  row: TData,
  index: number
) => TValue;

export type CellRenderer<TData, TValue> = (ctx: CellContext<TData, TValue>) => unknown;
export type HeaderRenderer<TData, TValue> = (ctx: HeaderContext<TData, TValue>) => unknown;

export interface ColumnDef<TData, TValue = unknown> {
  id?: string;
  accessorKey?: keyof TData & string;
  accessorFn?: AccessorFn<TData, TValue>;
  header?: string | HeaderRenderer<TData, TValue>;
  cell?: CellRenderer<TData, TValue>;
  meta?: Record<string, unknown>;
}

export interface Column<TData, TValue = unknown> {
  id: string;
  columnDef: ColumnDef<TData, TValue>;
  getValue: AccessorFn<TData, TValue>;
}

export interface Row<TData> {
  id: RowId;
  index: number;
  original: TData;
  getValue: <TValue = unknown>(columnId: string) => TValue;
  getAllCells: () => Cell<TData>[];
  getVisibleCells: () => Cell<TData>[];
}

export interface Cell<TData, TValue = unknown> {
  id: string;
  row: Row<TData>;
  column: Column<TData, TValue>;
  getValue: () => TValue;
  renderValue: () => TValue;
}

export interface Header<TData, TValue = unknown> {
  id: string;
  column: Column<TData, TValue>;
}

export interface HeaderGroup<TData> {
  id: string;
  headers: Header<TData>[];
}

export interface RowModel<TData> {
  rows: Row<TData>[];
  flatRows: Row<TData>[];
  rowsById: Map<RowId, Row<TData>>;
}

export interface TableState {
  columnVisibility: Record<string, boolean>;
}

export interface TableOptions<TData> {
  data: readonly TData[];
  columns: readonly ColumnDef<TData, any>[];
  state?: Partial<TableState>;
  initialState?: Partial<TableState>;
  onStateChange?: (updater: Updater<TableState>) => void;
  getRowId?: (row: TData, index: number) => RowId;
  features?: readonly TableFeature<TData>[];
}

export interface ResolvedTableOptions<TData> extends TableOptions<TData> {
  state?: Partial<TableState>;
}

export interface CellContext<TData, TValue> {
  table: TableInstance<TData>;
  row: Row<TData>;
  column: Column<TData, TValue>;
  cell: Cell<TData, TValue>;
  getValue: () => TValue;
}

export interface HeaderContext<TData, TValue> {
  table: TableInstance<TData>;
  column: Column<TData, TValue>;
  header: Header<TData, TValue>;
}

export interface TableFeature<TData> {
  name: string;
  getInitialState?: (state: TableState) => TableState;
  createTable?: (table: TableInstance<TData>) => void;
}

export interface TableInstance<TData> {
  getOptions: () => ResolvedTableOptions<TData>;
  setOptions: (options: TableOptions<TData>) => void;
  getState: () => TableState;
  setState: (updater: Updater<TableState>) => void;
  subscribe: (listener: () => void) => () => void;
  getAllColumns: () => Column<TData>[];
  getVisibleColumns: () => Column<TData>[];
  getHeaderGroups: () => HeaderGroup<TData>[];
  getRowModel: () => RowModel<TData>;
  getCellContext: <TValue>(cell: Cell<TData, TValue>) => CellContext<TData, TValue>;
  getHeaderContext: <TValue>(header: Header<TData, TValue>) => HeaderContext<TData, TValue>;
}

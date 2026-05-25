import { describe, expect, it, vi } from 'vitest';
import { createTableX } from './table.js';
import { createColumnHelper } from './column-helper.js';
import type { PaginationState, SortingState } from './types.js';

type Person = {
  id: string;
  name: string;
  role: string;
  score: number;
};

const data: Person[] = [
  { id: 'a', name: 'Avery', role: 'Design', score: 90 },
  { id: 'b', name: 'Blair', role: 'Engineering', score: 80 },
  { id: 'c', name: 'Casey', role: 'Engineering', score: 90 },
  { id: 'd', name: 'Devon', role: 'Support', score: 70 }
];

const column = createColumnHelper<Person>();

const columns = [
  column.accessor('name', { header: 'Name' }),
  column.accessor('role', { header: 'Role' }),
  column.accessor('score', { header: 'Score' })
];

describe('createTableX', () => {
  it('caches accessor values per row and column', () => {
    const accessorFn = vi.fn((row: Person) => row.score * 2);
    const table = createTableX({
      data,
      getRowId: (row) => row.id,
      columns: [
        column.accessor('name', { header: 'Name' }),
        column.accessor(accessorFn, {
          id: 'doubleScore',
          header: 'Double score'
        })
      ]
    });
    const [row] = table.getCoreRowModel().rows;

    expect(row?.getValue('doubleScore')).toBe(180);
    expect(row?.getValue('doubleScore')).toBe(180);
    expect(row?.getAllCells()[1]?.getValue()).toBe(180);
    expect(accessorFn).toHaveBeenCalledTimes(1);
  });

  it('keeps sorting stable for equal values', () => {
    const table = createTableX({
      data,
      columns,
      getRowId: (row) => row.id,
      initialState: {
        sorting: [{ id: 'score', desc: true }],
        pagination: { pageIndex: 0, pageSize: 10 }
      }
    });

    expect(table.getRowModel().rows.map((row) => row.id)).toEqual([
      'a',
      'c',
      'b',
      'd'
    ]);
  });

  it('filters before sorting and pagination', () => {
    const table = createTableX({
      data,
      columns,
      getRowId: (row) => row.id,
      initialState: {
        columnFilters: [{ id: 'role', value: 'engineering' }],
        sorting: [{ id: 'score', desc: false }],
        pagination: { pageIndex: 0, pageSize: 1 }
      }
    });

    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual([
      'b',
      'c'
    ]);
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(['b']);
  });

  it('skips client pagination when manualPagination is enabled', () => {
    const table = createTableX({
      data,
      columns,
      manualPagination: true,
      initialState: {
        pagination: { pageIndex: 1, pageSize: 1 }
      }
    });

    expect(table.getRowModel().rows).toHaveLength(data.length);
  });

  it('calls controlled feature callbacks without forcing controlled state forward', () => {
    const onSortingChange = vi.fn();
    const sorting: SortingState = [];
    const table = createTableX({
      data,
      columns,
      state: { sorting },
      onSortingChange
    });

    table.setSorting([{ id: 'score', desc: true }]);

    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'score', desc: true }]);
    expect(table.getState().sorting).toBe(sorting);
  });

  it('does not rebuild the core row model when only column visibility changes', () => {
    const table = createTableX({
      data,
      columns,
      getRowId: (row) => row.id
    });
    const before = table.getCoreRowModel();

    table.setState((previous) => ({
      ...previous,
      columnVisibility: { role: false }
    }));

    expect(table.getCoreRowModel()).toBe(before);
    expect(table.getVisibleCells(before.rows[0]!).map((cell) => cell.column.id)).toEqual([
      'name',
      'score'
    ]);
  });

  it('emits pagination updaters and updates uncontrolled pagination', () => {
    const onPaginationChange = vi.fn();
    const table = createTableX({
      data,
      columns,
      getRowId: (row) => row.id,
      onPaginationChange,
      initialState: {
        pagination: { pageIndex: 0, pageSize: 2 }
      }
    });
    const updater = (previous: PaginationState) => ({
      ...previous,
      pageIndex: previous.pageIndex + 1
    });

    table.setPagination(updater);

    expect(onPaginationChange).toHaveBeenCalledWith(updater);
    expect(table.getState().pagination).toEqual({ pageIndex: 1, pageSize: 2 });
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(['c', 'd']);
  });
});

# react-table-x

Headless, extensible, high-performance table engine for React.

`react-table-x` is designed as a table engine first and a UI library never. It
owns table state, row models, column normalization, memoization boundaries, and
feature composition, while consumers keep complete control over markup and
styling.

## Basic Usage

To run the local example:

```bash
npm run example
```

Then open `http://127.0.0.1:5173`.

To run the core test suite:

```bash
npm test
```

```tsx
import { TableX, createColumnHelper, useTableX } from 'react-table-x';

type Person = {
  id: string;
  name: string;
  age: number;
};

const table = useTableX<Person>({
  data,
  getRowId: (row) => row.id,
  columns: [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'age',
      header: 'Age',
      cell: ({ getValue }) => getValue<number>()
    }
  ]
});

return (
  <TableX table={table} emptyState="No rows found." />
);
```

For stronger column inference, use a column helper:

```tsx
const column = createColumnHelper<Person>();

const columns = [
  column.accessor('name', {
    header: 'Name'
  }),
  column.accessor((row) => row.age, {
    id: 'age',
    header: 'Age'
  })
];
```

Phase 1 also includes client-side sorting, filtering, pagination, and row
selection. Server-side pagination/sorting/filtering can opt out of client row
transforms with flags such as `manualPagination: true`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the Phase 1 architecture
direction.

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TableX, useTableX, type ColumnDef } from '../../../src/index.ts';
import './styles.css';

type Person = {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Away' | 'Offline';
  score: number;
};

const data: Person[] = [
  { id: '1', name: 'Avery Stone', role: 'Design Systems', status: 'Active', score: 92 },
  { id: '2', name: 'Mira Patel', role: 'Data Platform', status: 'Away', score: 81 },
  { id: '3', name: 'Noah Kim', role: 'Frontend Infra', status: 'Active', score: 88 },
  { id: '4', name: 'Leah Brooks', role: 'Product Engineering', status: 'Offline', score: 74 },
];

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'role',
    header: 'Role'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <span className="status">{getValue<string>()}</span>
  },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: ({ getValue }) => <strong>{getValue<number>()}</strong>
  }
];

function App() {
  const [hideRole, setHideRole] = useState(false);
  const table = useTableX<Person>({
    data,
    columns,
    getRowId: (row) => row.id,
    state: {
      columnVisibility: {
        role: !hideRole
      }
    }
  });

  return (
    <main>
      <header>
        <div>
          <p>react-table-x</p>
          <h1>Headless table example</h1>
        </div>
        <label>
          <input
            type="checkbox"
            checked={hideRole}
            onChange={(event) => setHideRole(event.target.checked)}
          />
          Hide role
        </label>
      </header>

      <TableX table={table} emptyState="No rows found." />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

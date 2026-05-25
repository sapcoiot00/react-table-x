import { createColumnHelper } from './column-helper.js';

type Person = {
  id: string;
  name: string;
  score: number;
};

const column = createColumnHelper<Person>();

column.accessor('name', {
  cell: ({ getValue }) => {
    const value: string = getValue();
    return value.toUpperCase();
  }
});

column.accessor('score', {
  cell: ({ getValue }) => {
    const value: number = getValue();
    return value.toFixed(1);
  }
});

column.accessor((row) => row.name.length, {
  id: 'nameLength',
  cell: ({ getValue }) => {
    const value: number = getValue();
    return value;
  }
});

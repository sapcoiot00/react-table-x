# react-table-x Architecture

## Design Goals

`react-table-x` is a headless table engine. The core package must never depend
on React or DOM rendering. React is only an adapter around the reusable engine.

Phase 1 prioritizes:

- predictable performance boundaries
- type-safe column and row primitives
- controlled and uncontrolled state
- feature composition without a monolithic table component
- immutable source data handling
- a small API surface that can grow into advanced grid behavior

## Package Boundaries

```txt
src/
  core/      Framework-agnostic table engine
  react/     React adapter and React-specific rendering helpers
```

### Core

The core owns:

- table instance creation
- option normalization
- state store and subscriptions
- column normalization
- row model generation
- memoization
- feature hooks

The core must not import React.

### React

The React adapter owns:

- `useTableX`
- subscribing React renders to table state with `useSyncExternalStore`
- React rendering helpers such as `flexRender`

The adapter must not contain table business logic.

## Table Instance

The table instance is a stable object with methods:

- `getState`
- `setState`
- `getAllColumns`
- `getVisibleColumns`
- `getHeaderGroups`
- `getRowModel`

This keeps rendering fully user-owned while still giving consumers a coherent
headless API.

## State Model

State supports both modes:

- uncontrolled: the internal store owns state
- controlled: `options.state` is merged over internal state and
  `onStateChange` receives updates

Features extend the shared `TableState` shape over time. Phase 1 starts with
`columnVisibility` because it proves the state pipeline without coupling the
engine to a specific UI.

## Row Model Pipeline

The row model is computed from:

- immutable `data`
- normalized columns
- visible columns
- `getRowId`

The original data array and row objects are never mutated. Accessed cell values
are cached per row so repeated render reads do not repeatedly execute accessors.

Future feature row models should compose as pipeline stages:

```txt
core rows -> filtered rows -> sorted rows -> grouped rows -> paginated rows
```

Each stage should be independently memoized and optional.

## Feature System

Features are plain objects that can:

- extend initial state
- attach behavior to the table instance

This avoids a growing central table class and lets advanced behavior land as
independent modules.

Example future features:

- sorting
- filtering
- grouping
- column sizing
- row selection
- pinning
- virtualization integration

## Performance Rules

- Preserve table instance identity in adapters.
- Memoize derived columns, visible columns, and row models.
- Treat user data as immutable input.
- Do not put rendering logic in the core.
- Prefer feature-local recomputation over invalidating the entire table.
- Keep state updates explicit and subscribable.

## API Direction

Primary API:

```tsx
const table = useTableX({
  data,
  columns
});
```

The table object exposes enough structure to render any UI, but no UI is
prescribed by the library.

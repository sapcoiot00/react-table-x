import { columnVisibilityFeature } from '../features/column-visibility/index.js';
import type { TableFeature } from './types.js';

const builtInFeatures = [columnVisibilityFeature] as const;

export function resolveTableFeatures<TData>(
  features?: readonly TableFeature<TData>[]
): TableFeature<TData>[] {
  return [
    ...(builtInFeatures as readonly TableFeature<TData>[]),
    ...(features ?? [])
  ];
}

import type { ReactNode } from 'react';

export function flexRender<TContext>(
  renderer: unknown,
  context: TContext
): ReactNode {
  return typeof renderer === 'function'
    ? (renderer as (context: TContext) => ReactNode)(context)
    : (renderer as ReactNode);
}

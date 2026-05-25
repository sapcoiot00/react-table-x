export interface Memo<TDeps extends readonly unknown[], TValue> {
  (deps: TDeps): TValue;
}

export function memo<TDeps extends readonly unknown[], TValue>(
  getValue: (...deps: TDeps) => TValue
): Memo<TDeps, TValue> {
  let initialized = false;
  let previousDeps: TDeps | undefined;
  let previousValue: TValue;

  return (deps) => {
    if (
      initialized &&
      previousDeps &&
      deps.length === previousDeps.length &&
      deps.every((dep, index) => Object.is(dep, previousDeps?.[index]))
    ) {
      return previousValue;
    }

    initialized = true;
    previousDeps = deps;
    previousValue = getValue(...deps);
    return previousValue;
  };
}

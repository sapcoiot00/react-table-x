import type { RowId, RowSelectionState } from '../../core/types.js';

export function getNextRowSelectionState(
  state: RowSelectionState,
  rowId: RowId,
  selected?: boolean
): RowSelectionState {
  const nextSelected = selected ?? !state[rowId];
  const nextState = { ...state };

  if (nextSelected) {
    nextState[rowId] = true;
  } else {
    delete nextState[rowId];
  }

  return nextState;
}

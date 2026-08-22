import type { Dispatch, SetStateAction } from "react";
import {
  buildPersistentViewStateKey,
  clearPersistentViewState,
  usePersistentViewState,
} from "../../../../core/ui-state/persistence";

type InitialValue<T> = T | (() => T);

export function useSessionStorageState<T>(
  key: string,
  initialValue: InitialValue<T>
): [T, Dispatch<SetStateAction<T>>] {
  const persistentState = usePersistentViewState(key, initialValue, {
    storage: "session",
    rawKey: true,
  });

  return [persistentState.value, persistentState.setValue];
}

export function removeSessionStorageState(key: string) {
  clearPersistentViewState(key, {
    storage: "session",
    rawKey: true,
  });
}

export { buildPersistentViewStateKey, usePersistentViewState };


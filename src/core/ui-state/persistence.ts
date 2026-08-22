import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

type InitialValue<T> = T | (() => T);
type StorageTarget = "session" | "local";

interface PersistentViewStateOptions<T> {
  storage?: StorageTarget;
  namespace?: string;
  version?: number;
  rawKey?: boolean;
  serializer?: (value: T) => string;
  parser?: (raw: string) => T;
}

interface PersistentViewStateResult<T> {
  key: string;
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  reset: () => void;
  clear: () => void;
}

function resolveInitialValue<T>(initialValue: InitialValue<T>): T {
  return initialValue instanceof Function ? initialValue() : initialValue;
}

function resolveStorage(storage: StorageTarget) {
  if (typeof window === "undefined") {
    return null;
  }

  return storage === "local" ? window.localStorage : window.sessionStorage;
}

export function buildPersistentViewStateKey(
  key: string,
  options: Pick<PersistentViewStateOptions<unknown>, "namespace" | "version" | "rawKey"> = {}
) {
  if (options.rawKey) {
    return key;
  }

  const namespaceSegments = ["democra", "ui"];
  if (options.namespace) {
    namespaceSegments.push(options.namespace);
  }

  namespaceSegments.push(key);

  if (typeof options.version === "number") {
    namespaceSegments.push(`v${options.version}`);
  }

  return namespaceSegments.join(".");
}

function readPersistentViewState<T>(
  key: string,
  initialValue: InitialValue<T>,
  options: PersistentViewStateOptions<T>
) {
  const fallback = resolveInitialValue(initialValue);
  const storage = resolveStorage(options.storage ?? "session");

  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return options.parser ? options.parser(raw) : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function clearPersistentViewState(
  key: string,
  options: Pick<PersistentViewStateOptions<unknown>, "namespace" | "storage" | "version" | "rawKey"> = {}
) {
  const storage = resolveStorage(options.storage ?? "session");
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(buildPersistentViewStateKey(key, options));
  } catch {
    // noop
  }
}

export function usePersistentViewState<T>(
  key: string,
  initialValue: InitialValue<T>,
  options: PersistentViewStateOptions<T> = {}
): PersistentViewStateResult<T> {
  const storageKey = useMemo(
    () => buildPersistentViewStateKey(key, options),
    [key, options.namespace, options.rawKey, options.version]
  );

  const [value, setValue] = useState<T>(() =>
    readPersistentViewState(storageKey, initialValue, options)
  );

  useEffect(() => {
    const storage = resolveStorage(options.storage ?? "session");
    if (!storage) {
      return;
    }

    try {
      const serialized = options.serializer
        ? options.serializer(value)
        : JSON.stringify(value);
      storage.setItem(storageKey, serialized);
    } catch {
      // noop
    }
  }, [options.serializer, options.storage, storageKey, value]);

  const clear = useCallback(() => {
    clearPersistentViewState(key, options);
    setValue(resolveInitialValue(initialValue));
  }, [initialValue, key, options]);

  const reset = useCallback(() => {
    setValue(resolveInitialValue(initialValue));
  }, [initialValue]);

  return {
    key: storageKey,
    value,
    setValue,
    reset,
    clear,
  };
}


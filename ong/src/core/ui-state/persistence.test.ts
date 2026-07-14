import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import {
  buildPersistentViewStateKey,
  clearPersistentViewState,
  usePersistentViewState,
} from "./persistence";

// En este entorno de test (happy-dom sin --localstorage-file) window.localStorage
// no esta disponible, a diferencia de window.sessionStorage que si funciona.
// Se instala un polyfill minimo en memoria solo para estos tests.
if (typeof window !== "undefined" && !window.localStorage) {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();

    get length(): number {
      return this.store.size;
    }

    clear(): void {
      this.store.clear();
    }

    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null;
    }

    key(index: number): string | null {
      return Array.from(this.store.keys())[index] ?? null;
    }

    removeItem(key: string): void {
      this.store.delete(key);
    }

    setItem(key: string, value: string): void {
      this.store.set(key, String(value));
    }
  }

  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

describe("buildPersistentViewStateKey", () => {
  it("usa el prefijo por defecto democra.ui cuando no hay opciones", () => {
    expect(buildPersistentViewStateKey("filtros")).toBe("democra.ui.filtros");
  });

  it("agrega el namespace cuando se provee", () => {
    expect(buildPersistentViewStateKey("filtros", { namespace: "proyectos" })).toBe(
      "democra.ui.proyectos.filtros"
    );
  });

  it("agrega la version cuando se provee", () => {
    expect(buildPersistentViewStateKey("filtros", { version: 2 })).toBe(
      "democra.ui.filtros.v2"
    );
  });

  it("combina namespace y version en el orden correcto", () => {
    expect(
      buildPersistentViewStateKey("filtros", { namespace: "proyectos", version: 3 })
    ).toBe("democra.ui.proyectos.filtros.v3");
  });

  it("devuelve la key sin modificar cuando rawKey es true, ignorando namespace y version", () => {
    expect(
      buildPersistentViewStateKey("mi-key-cruda", {
        namespace: "proyectos",
        version: 2,
        rawKey: true,
      })
    ).toBe("mi-key-cruda");
  });
});

describe("clearPersistentViewState", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("elimina la clave de sessionStorage por defecto", () => {
    window.sessionStorage.setItem("democra.ui.filtros", JSON.stringify({ a: 1 }));

    clearPersistentViewState("filtros");

    expect(window.sessionStorage.getItem("democra.ui.filtros")).toBeNull();
  });

  it("elimina la clave de localStorage cuando storage es local", () => {
    window.localStorage.setItem("democra.ui.filtros", JSON.stringify({ a: 1 }));

    clearPersistentViewState("filtros", { storage: "local" });

    expect(window.localStorage.getItem("democra.ui.filtros")).toBeNull();
  });

  it("no lanza error si la clave no existe", () => {
    expect(() => clearPersistentViewState("no-existe")).not.toThrow();
  });
});

describe("usePersistentViewState", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("usa el valor inicial cuando no hay nada guardado", () => {
    const { result } = renderHook(() =>
      usePersistentViewState("contador", 0)
    );

    expect(result.current.value).toBe(0);
    expect(result.current.key).toBe("democra.ui.contador");
  });

  it("acepta una funcion como valor inicial (lazy init)", () => {
    const { result } = renderHook(() =>
      usePersistentViewState("contador", () => 42)
    );

    expect(result.current.value).toBe(42);
  });

  it("lee el valor previamente guardado en sessionStorage", () => {
    window.sessionStorage.setItem("democra.ui.contador", JSON.stringify(9));

    const { result } = renderHook(() => usePersistentViewState("contador", 0));

    expect(result.current.value).toBe(9);
  });

  it("persiste el nuevo valor en sessionStorage al usar setValue", () => {
    const { result } = renderHook(() => usePersistentViewState("contador", 0));

    act(() => {
      result.current.setValue(5);
    });

    expect(result.current.value).toBe(5);
    expect(window.sessionStorage.getItem("democra.ui.contador")).toBe("5");
  });

  it("usa localStorage cuando storage es local", () => {
    const { result } = renderHook(() =>
      usePersistentViewState("contador", 0, { storage: "local" })
    );

    act(() => {
      result.current.setValue(7);
    });

    expect(window.localStorage.getItem("democra.ui.contador")).toBe("7");
    expect(window.sessionStorage.getItem("democra.ui.contador")).toBeNull();
  });

  it("reset() vuelve al valor inicial sin borrar el storage", () => {
    const { result } = renderHook(() => usePersistentViewState("contador", 0));

    act(() => {
      result.current.setValue(5);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe(0);
  });

  it("clear() borra el storage y vuelve al valor inicial (el efecto de persistencia luego re-escribe ese valor inicial)", () => {
    const { result } = renderHook(() => usePersistentViewState("contador", 0));

    act(() => {
      result.current.setValue(5);
    });
    act(() => {
      result.current.clear();
    });

    // clear() llama a clearPersistentViewState (remueve la clave) y resetea
    // el estado al valor inicial. Pero el useEffect de persistencia se
    // dispara de nuevo al cambiar `value`, y vuelve a escribir el valor
    // inicial serializado en el storage — por eso termina en "0", no en null.
    expect(result.current.value).toBe(0);
    expect(window.sessionStorage.getItem("democra.ui.contador")).toBe("0");
  });

  it("usa serializer y parser personalizados en lugar de JSON", () => {
    const { result } = renderHook(() =>
      usePersistentViewState("fecha", new Date(2024, 0, 1), {
        serializer: (value: Date) => value.toISOString(),
        parser: (raw: string) => new Date(raw),
      })
    );

    act(() => {
      result.current.setValue(new Date(2024, 5, 15));
    });

    const stored = window.sessionStorage.getItem("democra.ui.fecha");
    expect(stored).toBe(new Date(2024, 5, 15).toISOString());
  });

  it("recupera el valor por defecto si el JSON guardado esta corrupto", () => {
    window.sessionStorage.setItem("democra.ui.contador", "{invalido");

    const { result } = renderHook(() => usePersistentViewState("contador", 0));

    expect(result.current.value).toBe(0);
  });
});

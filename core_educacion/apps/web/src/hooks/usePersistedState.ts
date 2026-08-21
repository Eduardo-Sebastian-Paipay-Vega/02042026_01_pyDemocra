import { useState, useEffect } from 'react';

/**
 * Un hook personalizado que funciona exactamente igual que \`useState\`, pero
 * guarda el valor automáticamente en el \`localStorage\` del navegador.
 *
 * De esta manera, si la pestaña de Chrome entra en suspensión (Ahorro de memoria)
 * o si el usuario recarga la página, el estado (ej. un formulario) no se perderá.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Inicializamos leyendo de localStorage
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error leyendo localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Cada vez que cambia el estado, guardamos en localStorage
  useEffect(() => {
    try {
      // Opcional: si el estado está vacío (ej. después de enviar un formulario), limpiamos la clave
      if (state === defaultValue || state === '') {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.warn(`Error guardando en localStorage key "${key}":`, error);
    }
  }, [key, state, defaultValue]);

  return [state, setState];
}

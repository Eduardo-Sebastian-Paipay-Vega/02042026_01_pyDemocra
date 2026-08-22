import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export default function InteractiveList() {
  const [items, setItems] = useState<Task[]>([
    { id: 1, text: 'Instalar Tailwind CSS', completed: true },
    { id: 2, text: 'Configurar componentes Shadcn UI', completed: true },
    { id: 3, text: 'Implementar modelo 3D interactivo', completed: false },
    { id: 4, text: 'Revisar arquitectura del sistema', completed: false }
  ]);
  const [parent] = useAutoAnimate<HTMLUListElement>();
  const [inputValue, setInputValue] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setItems([...items, { id: Date.now(), text: inputValue, completed: false }]);
      setInputValue('');
    }
  };

  const remove = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const toggle = (id: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl w-full max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="bg-indigo-500 text-white p-1 rounded-md">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          Tareas del Proyecto
        </h2>
        <p className="text-slate-400 text-sm">
          Impulsado por <code className="text-cyan-400">@formkit/auto-animate</code> para transiciones fluidas.
        </p>
      </div>

      <form onSubmit={add} className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nueva tarea..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <ul ref={parent} className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
              item.completed 
                ? 'bg-slate-800/40 border-slate-800 text-slate-500' 
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => toggle(item.id)}
            >
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500" />
              )}
              <span className={item.completed ? 'line-through decoration-slate-600' : ''}>
                {item.text}
              </span>
            </div>
            <button
              onClick={() => remove(item.id)}
              className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-center text-slate-500 py-6 border border-dashed border-slate-700 rounded-lg">
            No hay tareas pendientes.
          </li>
        )}
      </ul>
    </div>
  );
}

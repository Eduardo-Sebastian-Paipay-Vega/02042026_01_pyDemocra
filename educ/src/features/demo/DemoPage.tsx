import React, { Suspense } from 'react';
import HeroSection from '../../components/ui/HeroSection';
import InteractiveList from '../../components/ui/InteractiveList';
import Scene3D from '../../components/3d/Scene3D';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DemoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <nav className="p-4 flex items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Dashboard</span>
        </button>
      </nav>

      <HeroSection />

      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-2">Integración de Shadcn & Auto-Animate</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Este componente demuestra cómo utilizar listas interactivas y componentes de Shadcn UI de manera conjunta, logrando transiciones fluidas con cero esfuerzo de configuración utilizando <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">@formkit/auto-animate</code>.
            </p>
          </div>
          
          <InteractiveList />
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-2">Entorno 3D WebGL</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Visualización en tiempo real potenciada por <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-400">@react-three/fiber</code>. Este canvas puede cargar objetos, manejar luces dinámicas y responder a eventos del usuario de manera declarativa dentro de React.
            </p>
          </div>
          
          <Suspense fallback={<div className="w-full h-[500px] flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800 animate-pulse">Cargando motor 3D...</div>}>
            <Scene3D />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Box, Play, RotateCw, ZoomIn, Layers, Zap } from 'lucide-react';
import { motion } from 'motion/react';

// RF-043: Laboratorios 3D WebGL (SimulaciÃ³n Inmersiva)

export const Lab3DWebGL = () => {
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    const spin = setInterval(() => setRotation(r => (r + 1) % 360), 50);
    return () => { clearTimeout(timer); clearInterval(spin); };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Box className="text-cyan-500 h-8 w-8" />
            Laboratorio 3D WebGL
          </h2>
          <p className="text-muted-foreground mt-1">
            Simulador de motor V8. Manipula variables en tiempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="card p-2 rounded-xl text-slate-300 hover:bg-white/5 transition">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="card p-2 rounded-xl text-slate-300 hover:bg-white/5 transition">
            <RotateCw className="w-5 h-5" />
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl transition font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <Play className="w-4 h-4" /> Iniciar SimulaciÃ³n
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">
        
        {/* WebGL Canvas Placeholder */}
        <div className="lg:col-span-3 card relative overflow-hidden flex items-center justify-center">
          
          {loading ? (
            <div className="flex flex-col items-center gap-4 text-cyan-500">
              <RotateCw className="w-8 h-8 animate-spin" />
              <span className="text-sm font-medium animate-pulse">Cargando Assets 3D (34 MB)...</span>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-black to-slate-900">
              
              {/* Fake 3D Object rendering wireframe */}
              <motion.div 
                className="w-64 h-64 border border-cyan-500/30 rounded-lg relative flex items-center justify-center"
                style={{ rotateX: rotation, rotateY: rotation * 0.5, transformStyle: 'preserve-3d' }}
              >
                <div className="absolute w-full h-full border border-cyan-400/50 rounded-full" style={{ transform: 'rotateX(45deg)' }}></div>
                <div className="absolute w-full h-full border border-purple-500/50 rounded-full" style={{ transform: 'rotateY(45deg)' }}></div>
                <Box className="w-16 h-16 text-cyan-400 opacity-50" />
              </motion.div>
              
              <div className="absolute bottom-6 left-6 text-xs text-muted-foreground bg-black/50 p-2 rounded backdrop-blur-sm border border-border">
                Render Engine: Three.js (WebGL 2.0)<br/>
                FPS: 60 | Triangles: 245K
              </div>
            </div>
          )}
          
        </div>

        {/* Telemetry / Controls */}
        <div className="lg:col-span-1 card p-6 flex flex-col gap-6">
          
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-cyan-400" />
              Variables de Entorno
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>PresiÃ³n (Bar)</span>
                  <span className="font-bold">2.4</span>
                </div>
                <input type="range" className="w-full accent-cyan-500" defaultValue="40" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Temperatura (Â°C)</span>
                  <span className="font-bold">95.0</span>
                </div>
                <input type="range" className="w-full accent-red-500" defaultValue="70" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>RPM Motor</span>
                  <span className="font-bold">3400</span>
                </div>
                <input type="range" className="w-full accent-purple-500" defaultValue="60" />
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-yellow-400" />
              TelemetrÃ­a en Vivo
            </h3>
            <div className="h-32 border border-border rounded-xl bg-black/40 p-2 flex items-end gap-1 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="w-full bg-cyan-500/50 rounded-t-sm"
                  animate={{ height: `${Math.random() * 80 + 20}%` }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default Lab3DWebGL;


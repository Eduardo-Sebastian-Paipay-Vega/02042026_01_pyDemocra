import React, { useEffect, useRef } from 'react';
import { Network, Users, Brain, Zap, Plus, Minus, Search } from 'lucide-react';

// RF-026: Grafos de Conocimiento Institucional (Knowledge Graph)

export const KnowledgeGraphView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock simple canvas drawing for the graph visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const draw = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw connections
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      const nodes: { x: number, y: number, size: number, color: string }[] = [];
      for (let i = 0; i < 20; i++) {
        const radius = 100 + Math.sin(time + i) * 50;
        const angle = (i / 20) * Math.PI * 2 + time * 0.2;
        nodes.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          size: 3 + Math.random() * 5,
          color: i % 3 === 0 ? '#3b82f6' : (i % 2 === 0 ? '#a855f7' : '#22c55e')
        });
      }

      // Center Node
      nodes.push({ x: centerX, y: centerY, size: 15, color: '#ef4444' });

      // Connect nodes
      nodes.forEach((node, i) => {
        nodes.forEach((target, j) => {
          if (i !== j && Math.random() > 0.85) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = node.color;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-120px)] flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Network className="text-indigo-500 h-8 w-8" />
            Knowledge Graph (Neo4j)
          </h2>
          <p className="text-muted-foreground mt-1">
            Visualización topológica del flujo de conocimiento y afinidad cognitiva de toda la institución.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar nodo (alumno, tema)..." className="card rounded-full pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-indigo-500 w-64" />
          </div>
          <div className="flex items-center gap-1 card rounded-lg p-1">
            <button className="p-1.5 hover:bg-white/10 rounded text-slate-300"><Plus size={16}/></button>
            <button className="p-1.5 hover:bg-white/10 rounded text-slate-300"><Minus size={16}/></button>
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex-1 card-inner rounded-2xl border border-border relative overflow-hidden">
        
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-black/50 p-2 rounded-lg backdrop-blur-sm border border-border">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> Estudiantes (Nodos)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-black/50 p-2 rounded-lg backdrop-blur-sm border border-border">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div> Temas / Habilidades
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-black/50 p-2 rounded-lg backdrop-blur-sm border border-border">
            <div className="w-3 h-3 rounded-full bg-green-500"></div> Docentes (Hubs)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-black/50 p-2 rounded-lg backdrop-blur-sm border border-border">
            <div className="w-3 h-3 rounded-full bg-red-500"></div> Institución
          </div>
        </div>

        {/* Canvas for Graph */}
        <canvas 
          ref={canvasRef} 
          width={1000} 
          height={600} 
          className="w-full h-full object-cover opacity-80 mix-blend-screen"
        />

      </div>
    </div>
  );
};

export default KnowledgeGraphView;

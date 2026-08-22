import { motion } from 'framer-motion';
import { Layers, Cuboid, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-20 px-6 sm:px-12 lg:px-24">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6"
        >
          Educación Inmersiva <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            Impulsada por IA y 3D
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10"
        >
          Explora los nuevos componentes de alto rendimiento integrados en el sistema. 
          Animaciones fluidas, renderizado WebGL avanzado e interactividad de siguiente generación.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-6"
        >
          <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 text-slate-200">
            <Cuboid className="w-5 h-5 text-cyan-400" />
            <span>WebGL 3D</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 text-slate-200">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Framer Motion</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 text-slate-200">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Tailwind v4</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

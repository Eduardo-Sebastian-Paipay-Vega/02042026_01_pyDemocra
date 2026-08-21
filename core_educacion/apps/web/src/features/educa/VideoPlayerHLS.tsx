import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, Maximize, SkipForward, SkipBack, Settings, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-003: ReproducciÃ³n Multimedia HLS

export const VideoPlayerHLS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg"><BookOpen className="text-primary w-5 h-5" /></div>
        <div>
          <h2 className="text-2xl font-bold text-white">El principio de todo</h2>
          <p className="text-muted-foreground text-sm">MÃ³dulo 2: Conceptos Fundamentales</p>
        </div>
      </div>

      {/* Video Container Mock */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-2xl group">
        
        {/* Mock Video Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black"></div>
        
        {/* Mock Watermark / Title inside video */}
        <div className="absolute top-4 left-4 text-white/50 font-bold tracking-widest text-sm">
          EDUCACION OS
        </div>

        {/* Play Button Overlay */}
        {!isPlaying && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <button 
              onClick={() => setIsPlaying(true)}
              className="w-20 h-20 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_rgba(var(--primary),0.5)]"
            >
              <Play className="w-8 h-8 ml-2" />
            </button>
          </motion.div>
        )}

        {/* Controls Bar (Visible on hover or when playing) */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : ''}`}>
          
          {/* Progress Bar */}
          <div className="mb-4 group/progress cursor-pointer">
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary relative" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-white">
              <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-primary transition-colors">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button className="hover:text-primary transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button className="hover:text-primary transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 ml-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <div className="w-16 h-1 bg-white/20 rounded-full">
                  <div className="w-3/4 h-full bg-white rounded-full"></div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground ml-2 font-medium">12:04 / 45:00</span>
            </div>

            <div className="flex items-center gap-4 text-white">
              <button className="hover:text-primary transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="hover:text-primary transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-card/30 backdrop-blur-md rounded-xl border border-border">
        <h3 className="font-semibold text-white mb-2">TranscripciÃ³n AutomÃ¡tica (IA)</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          <span className="text-primary font-medium">12:00</span> - "Como hemos visto, la infraestructura basada en grafos permite una adaptabilidad instantÃ¡nea. Esto no es solo teorÃ­a, es la aplicaciÃ³n directa de..."
        </p>
      </div>
    </div>
  );
};

export default VideoPlayerHLS;


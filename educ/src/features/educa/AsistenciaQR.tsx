import React, { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, Users, Clock, AlertTriangle, Fingerprint } from 'lucide-react';
import { motion } from 'motion/react';

// RF-044: QR DinÃ¡mico de Asistencia CriptogrÃ¡fica

export const AsistenciaQR = () => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [attendance, setAttendance] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Simulamos que un alumno mÃ¡s se registrÃ³ tras el ciclo de QR
          setAttendance(a => Math.min(30, a + Math.floor(Math.random() * 3)));
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <QrCode className="text-emerald-500 h-8 w-8" />
            Asistencia CriptogrÃ¡fica
          </h2>
          <p className="text-muted-foreground mt-1">
            Proyecta este código dinÃ¡mico. Los estudiantes usarÃ¡n su *Sovereign Wallet* para marcar asistencia.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[var(--s2)] border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <ShieldCheck className="w-5 h-5" />
            Anti-Fraude Activo
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* QR Projector */}
        <div className="lg:col-span-1 card p-8 flex flex-col items-center justify-center text-center">
          <div className="mb-6 relative">
            {/* Fake QR Block */}
            <motion.div 
              className="w-48 h-48 bg-white p-2 rounded-xl border-4 border-emerald-500/50 relative"
              animate={{ opacity: [1, 0.8, 1], scale: [1, 1.02, 1] }}
              transition={{ duration: 10, repeat: Infinity }}
            >
              <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-90 filter grayscale contrast-200"></div>
              
              {/* Scan Line effect */}
              <motion.div 
                className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">FÃ­sica Avanzada - 10B</h3>
          <p className="text-slate-400 text-sm mb-6 flex items-center justify-center gap-2">
            <Fingerprint className="w-4 h-4" /> Hash: 0x8f4...2a9
          </p>

          <div className="w-full">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>El QR expira y rota en:</span>
              <span className="text-emerald-400 font-bold">{timeLeft}s</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / 10) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </div>
        </div>

        {/* Live Status */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <Users className="w-4 h-4 text-emerald-500" /> Registrados
              </div>
              <div className="text-4xl font-bold text-white">
                {attendance} <span className="text-lg text-slate-500 font-normal">/ 30</span>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <Clock className="w-4 h-4 text-yellow-500" /> Hora LÃ­mite
              </div>
              <div className="text-4xl font-bold text-white">
                08:15 <span className="text-lg text-slate-500 font-normal">AM</span>
              </div>
            </div>
          </div>

          <div className="card p-6 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-white">Feed de Asistencia en Vivo</h3>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                Sync Blockchain: Ok
              </span>
            </div>

            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
                      A
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">Alumno verificado</div>
                      <div className="text-[10px] text-muted-foreground font-mono">Tx: 0x{Math.random().toString(16).substr(2, 8)}...</div>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Presente
                  </div>
                </div>
              ))}
            </div>

            {/* EWS Warning */}
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
              <div className="text-sm text-orange-200">
                <span className="font-bold">Alerta Temprana (EWS):</span> Faltan 5 minutos para el lÃ­mite y hay 3 alumnos con alto riesgo de inasistencia recurrente que aÃºn no registran.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AsistenciaQR;


import React, { useState } from 'react';
import { CreditCard, DollarSign, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// RF-008: Pasarela de Pagos Integrada (Stripe / Yape simulado)

export const PasarelaPagos = () => {
  const [method, setMethod] = useState<'card' | 'yape' | null>('card');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const handlePay = () => {
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-emerald-500 h-8 w-8" />
            Centro de Pagos
          </h2>
          <p className="text-muted-foreground mt-1">
            Plataforma financiera segura (PCI-DSS) para pensiones y cuotas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Deudas y Cuotas */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Estado de Cuenta</h3>
            
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center mb-4">
              <div>
                <div className="text-xs text-emerald-400 font-bold mb-1">TOTAL A PAGAR</div>
                <div className="text-3xl font-black text-white">S/ 450.00</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Vencimiento</div>
                <div className="text-sm font-bold text-slate-200">15 de Septiembre</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-border">
                <div>
                  <div className="text-sm font-bold text-white">Pensión Septiembre 2026</div>
                  <div className="text-xs text-slate-400">Alumno: Marcos Rojas</div>
                </div>
                <div className="font-mono text-slate-200">S/ 450.00</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Transacción 100% encriptada. No almacenamos los datos de su tarjeta.
          </div>
        </div>

        {/* Payment Gateway */}
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--s2)] border border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">¡Pago Exitoso!</h3>
              <p className="text-slate-400 mb-6">Se ha procesado S/ 450.00 correctamente.</p>
              
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-xl transition border border-border">
                <Download className="w-4 h-4" />
                Descargar Boleta (PDF)
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Método de Pago</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => setMethod('card')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition
 ${method === 'card' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-border text-slate-400 hover:bg-white/10'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Tarjeta</span>
                </button>
                <button 
                  onClick={() => setMethod('yape')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition
 ${method === 'yape' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-border text-slate-400 hover:bg-white/10'}`}
                >
                  <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white font-black text-xs">Y</div>
                  <span className="text-xs font-bold uppercase tracking-wider">Yape / Plin</span>
                </button>
              </div>

              {method === 'card' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-slate-400 font-bold mb-1 block">Número de Tarjeta</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-black/50 border border-border rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 font-bold mb-1 block">Vencimiento</label>
                      <input type="text" placeholder="MM/YY" className="w-full bg-black/50 border border-border rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-bold mb-1 block">CVC</label>
                      <input type="text" placeholder="123" className="w-full bg-black/50 border border-border rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>
              )}

              {method === 'yape' && (
                <div className="mb-6 p-6 flex flex-col items-center justify-center bg-black/50 border border-border rounded-xl">
                  <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center mb-4 border-4 border-purple-500">
                    <span className="text-black font-black text-xs">QR CODE AQUI</span>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Escanea el código QR desde tu aplicativo Yape o Plin para confirmar el pago automático.</p>
                </div>
              )}

              <button 
                onClick={handlePay}
                disabled={status === 'processing'}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold p-4 rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {status === 'processing' ? (
                  <span className="animate-pulse">Procesando...</span>
                ) : (
                  <>Pagar S/ 450.00</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default PasarelaPagos;

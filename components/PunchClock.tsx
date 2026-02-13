
import React, { useState, useRef, useEffect } from 'react';
import { PunchType, EntryModality, Employee } from '../types';

interface PunchClockProps {
  employees: Employee[];
  onPunch: (code: string, options?: { manualData?: { type: PunchType; timestamp: string }, modality?: EntryModality }) => { success: boolean; message: string; employeeName?: string; type?: string };
}

const PunchClock: React.FC<PunchClockProps> = ({ onPunch }) => {
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [manualType, setManualType] = useState<PunchType>(PunchType.IN);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }).replace(':', ':'));

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 4) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      let result;
      if (mode === 'AUTO') {
        result = onPunch(code, { modality: EntryModality.PIN });
      } else {
        const timestamp = new Date(`${manualDate}T${manualTime}:00`).toISOString();
        result = onPunch(code, { manualData: { type: manualType, timestamp }, modality: EntryModality.PIN });
      }

      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        setCode('');
      } else {
        setStatus({ type: 'error', message: result.message });
      }
      
      setIsProcessing(false);
      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
      inputRef.current?.focus();
    }, 600);
  };

  const handleKeypad = (val: string) => {
    if (code.length < 4) {
      setCode(prev => prev + val);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const clearCode = () => {
    setCode('');
    inputRef.current?.focus();
  };

  const backspace = () => {
    setCode(prev => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 animate-fade-in">
      <div className="flex gap-2 mb-6 bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl">
        <button 
          onClick={() => setMode('AUTO')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${mode === 'AUTO' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          Automático
        </button>
        <button 
          onClick={() => setMode('MANUAL')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${mode === 'MANUAL' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          Manual
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="bg-slate-900 dark:bg-slate-950 p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          
          <h2 className="text-white text-xl font-bold mb-6 uppercase tracking-wider">
            {mode === 'AUTO' ? 'Código PIN' : 'Registo Manual'}
          </h2>

          {mode === 'MANUAL' && (
            <div className="grid grid-cols-1 gap-4 mb-8 text-left animate-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setManualType(PunchType.IN)}
                  className={`py-3 rounded-xl border-2 font-black text-[10px] transition-all ${manualType === PunchType.IN ? 'bg-green-600 border-green-500 text-white' : 'border-slate-800 text-slate-500'}`}
                >
                  ENTRADA
                </button>
                <button 
                  type="button"
                  onClick={() => setManualType(PunchType.OUT)}
                  className={`py-3 rounded-xl border-2 font-black text-[10px] transition-all ${manualType === PunchType.OUT ? 'bg-red-600 border-red-500 text-white' : 'border-slate-800 text-slate-500'}`}
                >
                  SAÍDA
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="date" 
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-xs focus:ring-2 ring-indigo-500 transition-all"
                />
                <input 
                  type="time" 
                  value={manualTime}
                  onChange={e => setManualTime(e.target.value)}
                  className="bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-xs focus:ring-2 ring-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          <div className="relative max-w-[260px] mx-auto">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              value={code}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="••••"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-4 py-5 text-4xl text-center text-white font-mono tracking-[0.5em] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 shadow-inner"
              autoComplete="off"
            />
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={code.length < 4 || isProcessing}
            className={`mt-8 w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${
              code.length < 4 || isProcessing 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 shadow-indigo-500/20'
            }`}
          >
            {isProcessing ? 'A processar...' : 'Confirmar Ponto'}
          </button>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 transition-colors">
          {status.type && (
            <div className={`mb-8 p-4 rounded-xl flex items-center gap-4 animate-in zoom-in duration-300 ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              <p className="text-xs font-bold leading-tight flex-1">{status.message}</p>
              <button onClick={() => setStatus({type: null, message: ''})} className="text-current opacity-50 hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => handleKeypad(n.toString())}
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xl font-bold transition-all active:scale-90 border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                {n}
              </button>
            ))}
            <button
              onClick={clearCode}
              className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 text-red-500 text-[10px] font-black uppercase transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700"
            >
              Limpar
            </button>
            <button
              onClick={() => handleKeypad('0')}
              className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xl font-bold transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              0
            </button>
            <button
              onClick={backspace}
              className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-center mt-8 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">
        Sistema de Ponto • Registo Seguro
      </p>
    </div>
  );
};

export default PunchClock;


import React, { useState } from 'react';

interface PunchClockProps {
  onPunch: (code: string) => { success: boolean; message: string; employeeName?: string; type?: string };
}

const PunchClock: React.FC<PunchClockProps> = ({ onPunch }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 4) return;
    
    setIsProcessing(true);
    // Simulate a bit of processing for effect
    setTimeout(() => {
      const result = onPunch(code);
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        setCode('');
      } else {
        setStatus({ type: 'error', message: result.message });
      }
      setIsProcessing(false);
      
      // Clear status after 5 seconds
      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    }, 800);
  };

  const handleKeypad = (val: string) => {
    if (code.length < 8) setCode(prev => prev + val);
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-900 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Registrar Ponto</h2>
          <p className="text-indigo-300 text-sm mt-2">Digite seu código de acesso abaixo</p>
          <div className="mt-6 flex justify-center">
            <div className="bg-indigo-800 rounded-lg px-6 py-4 text-3xl font-mono tracking-[0.5em] w-48 h-16 flex items-center justify-center border-2 border-indigo-700 shadow-inner">
              {code.padEnd(4, '•').substring(0, 4)}
            </div>
          </div>
        </div>

        <div className="p-8">
          {status.type && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-bounce ${
              status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={status.type === 'success' ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
              </svg>
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => handleKeypad(n.toString())}
                className="h-16 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-2xl font-semibold transition-all active:scale-95 flex items-center justify-center shadow-sm"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setCode('')}
              className="h-16 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold uppercase transition-all flex items-center justify-center"
            >
              Limpar
            </button>
            <button
              onClick={() => handleKeypad('0')}
              className="h-16 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-2xl font-semibold transition-all flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={code.length < 4 || isProcessing}
              className={`h-16 rounded-xl text-white text-sm font-bold uppercase transition-all flex items-center justify-center shadow-lg ${
                code.length < 4 || isProcessing ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isProcessing ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchClock;

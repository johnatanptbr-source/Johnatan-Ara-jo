
import React, { useMemo, useState } from 'react';
import { Punch, Employee } from '../types';

interface HistoryViewProps {
  punches: Punch[];
  employees: Employee[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ punches, employees }) => {
  const [exportRange, setExportRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const sortedPunches = useMemo(() => {
    return [...punches].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [punches]);

  const handleExportCSV = () => {
    const startDate = new Date(exportRange.start);
    const endDate = new Date(exportRange.end);
    endDate.setHours(23, 59, 59, 999);

    const filteredPunches = punches.filter(p => {
      const punchDate = new Date(p.timestamp);
      return punchDate >= startDate && punchDate <= endDate;
    });

    if (filteredPunches.length === 0) {
      alert('Nenhum registro encontrado no período selecionado.');
      return;
    }

    // CSV Header
    const headers = ['Data', 'Hora', 'Funcionario', 'Cargo', 'Tipo', 'Codigo'];
    
    // CSV Rows
    const rows = filteredPunches.map(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      const dateObj = new Date(p.timestamp);
      return [
        dateObj.toLocaleDateString('pt-BR'),
        dateObj.toLocaleTimeString('pt-BR'),
        emp?.name || 'Ex-Funcionario',
        emp?.role || 'N/A',
        p.type === 'IN' ? 'ENTRADA' : 'SAIDA',
        emp?.code || 'N/A'
      ].map(val => `"${val}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_ponto_${exportRange.start}_a_${exportRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Registros</h2>
          <p className="text-slate-500 text-sm">Log completo de todas as entradas e saídas</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Início</label>
            <input 
              type="date" 
              value={exportRange.start}
              onChange={(e) => setExportRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
            <input 
              type="date" 
              value={exportRange.end}
              onChange={(e) => setExportRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-[38px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Funcionário</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Status Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPunches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum registro encontrado ainda.
                  </td>
                </tr>
              ) : (
                sortedPunches.map(punch => {
                  const emp = employees.find(e => e.id === punch.employeeId);
                  return (
                    <tr key={punch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                        {new Date(punch.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{emp?.name || 'Ex-Funcionário'}</span>
                        <p className="text-[10px] text-slate-400">{emp?.role}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          punch.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {punch.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 italic">
                        Confirmado via código
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;

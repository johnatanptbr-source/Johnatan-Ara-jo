
import React, { useMemo, useState } from 'react';
import { Punch, Employee, PunchType, AbsenceRecord, EntryMethod, EmployeeStatus, EntryModality } from '../types';

interface HistoryViewProps {
  punches: Punch[];
  employees: Employee[];
  records: AbsenceRecord[];
  onEditPunch: (punch: Punch) => void;
  onAddPunch: (punch: Punch) => void;
  onDeletePunch: (punchId: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onIgnoreAbsence: (empId: string, date: string) => void;
  onDeleteAllPunches: () => void;
  onDeleteAllRecords: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ 
  punches, employees, records, 
  onEditPunch, onAddPunch, onDeletePunch, onDeleteRecord, onIgnoreAbsence, onDeleteAllPunches, onDeleteAllRecords 
}) => {
  const [activeTab, setActiveTab] = useState<'PUNCHES' | 'OCCURRENCES'>('PUNCHES');
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | EntryMethod>('ALL');
  
  const [editingPunch, setEditingPunch] = useState<Punch | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [exportRange, setExportRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const getPunchEmployee = (punch: Punch) => employees.find(e => e.id === punch.employeeId);

  // Filtro de Pontos - Mais Antigo Primeiro
  const filteredPunches = useMemo(() => {
    const start = new Date(exportRange.start);
    const end = new Date(exportRange.end);
    end.setHours(23, 59, 59, 999);

    return punches
      .filter(p => {
        const d = new Date(p.timestamp);
        const emp = getPunchEmployee(p);
        const matchesSearch = !searchTerm || emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMethod = methodFilter === 'ALL' || p.entryMethod === methodFilter;
        return d >= start && d <= end && matchesSearch && matchesMethod;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [punches, exportRange, searchTerm, employees, methodFilter]);

  // Filtro de Ocorrências (Faltas/Férias) - Mais Antigo Primeiro
  const consolidatedOccurrences = useMemo(() => {
    const start = new Date(exportRange.start);
    const end = new Date(exportRange.end);
    end.setHours(23, 59, 59, 999);

    const results: any[] = [];
    
    // 1. Registos Manuais (RH) - Ficam para sempre no histórico
    records.forEach(r => {
      const recDate = new Date(r.date);
      if (recDate >= start && recDate <= end && r.type !== 'IGNORED_ABSENCE') {
        const emp = employees.find(e => e.id === r.employeeId);
        if (!searchTerm || emp?.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({ ...r, source: 'MANUAL', empName: emp?.name || '---' });
        }
      }
    });

    // 2. Deteções Automáticas (Sistema)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (d >= new Date()) continue; // Não deteta no futuro

        employees.forEach(emp => {
            const hasPunch = punches.some(p => p.employeeId === emp.id && p.timestamp.startsWith(dateStr));
            const hasManualRecord = records.some(r => r.employeeId === emp.id && (r.date === dateStr || (r.endDate && dateStr >= r.date && dateStr <= r.endDate)));
            const isIgnored = records.some(r => r.employeeId === emp.id && r.date === dateStr && r.type === 'IGNORED_ABSENCE');

            if (!hasPunch && !hasManualRecord && !isIgnored && emp.status === EmployeeStatus.ACTIVE) {
                if (!searchTerm || emp.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({
                        id: `auto-${emp.id}-${dateStr}`,
                        employeeId: emp.id,
                        date: dateStr,
                        type: 'ABSENCE',
                        reason: 'Deteção Automática (Sem Registo)',
                        source: 'AUTO',
                        empName: emp.name
                    });
                }
            }
        });
    }
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, punches, employees, exportRange, searchTerm]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPunch) { onEditPunch(editingPunch); setEditingPunch(null); }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    onAddPunch({
      id: Math.random().toString(36).substr(2, 9),
      employeeId: data.get('employeeId') as string,
      type: data.get('type') as PunchType,
      timestamp: new Date(`${data.get('date')}T${data.get('time')}:00`).toISOString(),
      entryMethod: data.get('method') as EntryMethod,
      modality: EntryModality.PIN
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Relatórios de Assiduidade</h2>
          <p className="text-slate-500 text-sm italic">Informação organizada cronologicamente (Antigo → Novo)</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => activeTab === 'PUNCHES' ? onDeleteAllPunches() : onDeleteAllRecords()} className="flex-1 md:flex-none bg-rose-50 text-rose-600 border border-rose-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">Limpar Tudo</button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg">Novo Registo Manual</button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button onClick={() => setActiveTab('PUNCHES')} className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'PUNCHES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Histórico de Pontos</button>
        <button onClick={() => setActiveTab('OCCURRENCES')} className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'OCCURRENCES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Faltas e Férias Guardadas</button>
      </div>

      {/* FILTROS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex gap-2">
            <input type="date" value={exportRange.start} onChange={e => setExportRange({...exportRange, start: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px]" />
            <input type="date" value={exportRange.end} onChange={e => setExportRange({...exportRange, end: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px]" />
        </div>
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar Colaborador..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] outline-none border border-slate-100 dark:border-slate-700" />
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value as any)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold">
            <option value="ALL">Todos os Métodos</option>
            <option value={EntryMethod.AUTO}>Automático</option>
            <option value={EntryMethod.MANUAL}>Manual (RH)</option>
        </select>
        <button onClick={() => { setSearchTerm(''); setMethodFilter('ALL'); }} className="w-full py-2 text-[9px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">Resetar Filtros</button>
      </div>

      {/* TABELA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Data/Período</th>
              <th className="px-6 py-4">Colaborador</th>
              <th className="px-6 py-4 text-center">Tipo</th>
              <th className="px-6 py-4">{activeTab === 'PUNCHES' ? 'Origem' : 'Detalhes do Registo'}</th>
              <th className="px-6 py-4 text-right">Ações de Controlo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeTab === 'PUNCHES' ? (
              filteredPunches.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 text-[10px] font-mono font-bold text-indigo-600">
                    {new Date(p.timestamp).toLocaleString('pt-PT')}
                  </td>
                  <td className="px-6 py-4 font-bold text-[11px]">{getPunchEmployee(p)?.name || '---'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${p.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                      {p.type === 'IN' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[8px] font-black uppercase border px-2 py-0.5 rounded">
                      {p.entryMethod === EntryMethod.MANUAL ? 'Manual' : 'Automático'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => setEditingPunch(p)} className="p-1.5 text-slate-400 hover:text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => onDeletePunch(p.id)} className="p-1.5 text-slate-400 hover:text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </td>
                </tr>
              ))
            ) : (
              consolidatedOccurrences.map(r => (
                <tr key={r.id} className={`transition-colors ${r.source === 'AUTO' ? 'bg-rose-50/30 dark:bg-rose-900/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                  <td className="px-6 py-4 text-[10px] font-mono font-bold">
                    {r.date} {r.endDate ? `até ${r.endDate}` : ''}
                  </td>
                  <td className="px-6 py-4 font-bold text-[11px]">{r.empName}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${r.type === 'VACATION' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {r.type === 'VACATION' ? 'Férias' : 'Falta'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-500 italic">{r.reason}</td>
                  <td className="px-6 py-4 text-right">
                    {r.source === 'MANUAL' ? (
                      <button onClick={() => onDeleteRecord(r.id)} className="p-1.5 text-slate-400 hover:text-rose-500" title="Apagar Histórico Permanente"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    ) : (
                      <button onClick={() => onIgnoreAbsence(r.employeeId, r.date)} className="px-3 py-1 bg-white border border-rose-200 text-rose-500 rounded-lg text-[8px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Limpar Deteção</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDITAR */}
      {editingPunch && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center"><h3 className="font-black uppercase">Editar Registo de Ponto</h3></div>
            <form onSubmit={handleSaveEdit} className="p-8 space-y-6">
              <select value={editingPunch.employeeId} onChange={e => setEditingPunch({...editingPunch, employeeId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-bold border border-slate-200">
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <select value={editingPunch.type} onChange={e => setEditingPunch({...editingPunch, type: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-bold border border-slate-200"><option value={PunchType.IN}>Entrada</option><option value={PunchType.OUT}>Saída</option></select>
                <select value={editingPunch.entryMethod} onChange={e => setEditingPunch({...editingPunch, entryMethod: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-bold border border-slate-200"><option value={EntryMethod.AUTO}>Auto</option><option value={EntryMethod.MANUAL}>Manual</option></select>
              </div>
              <input type="datetime-local" value={new Date(new Date(editingPunch.timestamp).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={e => setEditingPunch({...editingPunch, timestamp: new Date(e.target.value).toISOString()})} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-mono font-bold border border-slate-200" />
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-xs">Atualizar Base de Dados</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR MANUAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-indigo-50"><h3 className="font-black uppercase text-indigo-600">Inserir Ponto Manual (Retroativo)</h3></div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-4">
                <select name="employeeId" required className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-bold border border-slate-200">
                    <option value="">Escolher Colaborador...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs" />
                    <input type="time" name="time" required defaultValue={new Date().toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <select name="type" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs"><option value={PunchType.IN}>Entrada</option><option value={PunchType.OUT}>Saída</option></select>
                    <select name="method" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs"><option value={EntryMethod.MANUAL}>Manual (RH)</option><option value={EntryMethod.AUTO}>Auto (PIN)</option></select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-xs">Criar Registo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;


import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Punch, AbsenceRecord, EmployeeStatus, EntryMethod, PunchType } from '../types';
import { GeminiService } from '../services/gemini';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  employees: Employee[];
  punches: Punch[];
  records: AbsenceRecord[];
  theme: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ employees, punches, records, theme }) => {
  const [summary, setSummary] = useState<string>('A gerar resumo inteligente...');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const todayPunches = punches.filter(p => p.timestamp.startsWith(today));
  
  const totalEmployees = employees.length;
  const vacationEmployees = employees.filter(e => e.status === EmployeeStatus.VACATION);
  const onVacationCount = vacationEmployees.length;
  
  // Lógica de Falta Automática: Ativo mas sem entrada hoje
  const activeEmployees = employees.filter(e => e.status === EmployeeStatus.ACTIVE);
  const clockedInIds = Array.from(new Set(todayPunches.filter(p => p.type === 'IN').map(p => p.employeeId)));
  const automaticAbsences = activeEmployees.filter(e => !clockedInIds.includes(e.id));
  const absentCount = automaticAbsences.length + employees.filter(e => e.status === EmployeeStatus.ABSENT).length;

  useEffect(() => {
    const getSummary = async () => {
      const res = await GeminiService.generateDailySummary(employees, punches);
      setSummary(res || "Resumo indisponível.");
    };
    getSummary();
  }, [employees, punches]);

  // ORDENADO POR MAIS ANTIGO (Crescente)
  const allPunchesSorted = useMemo(() => {
    return [...punches].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [punches]);

  const chartData = [
    { name: 'Presentes', value: clockedInIds.length, color: '#4F46E5' },
    { name: 'Faltas Auto', value: automaticAbsences.length, color: '#EF4444' },
    { name: 'Férias', value: onVacationCount, color: '#F59E0B' },
  ];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  const getEmployeeById = (id: string) => employees.find(e => e.id === id);

  const textColor = theme === 'dark' ? '#cbd5e1' : '#64748b';
  const gridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Consola de Gestão</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium capitalize">
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Equipa', value: totalEmployees, sub: 'Colaboradores', icon: '👤', color: 'indigo' },
          { label: 'Presentes', value: clockedInIds.length, sub: 'Entrada hoje', icon: '✅', color: 'green' },
          { label: 'Faltas Auto', value: automaticAbsences.length, sub: 'Sem ponto hoje', icon: '⚠️', color: 'red' },
          { label: 'Em Férias', value: onVacationCount, sub: 'Ausentes', icon: '🌴', color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">Estado</span>
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[350px]">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Gráfico de Assiduidade Diária</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: textColor, fontSize: 10, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: textColor, fontSize: 10}} />
              <Tooltip cursor={{fill: theme === 'dark' ? '#1e293b' : '#f8fafc'}} contentStyle={{backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', borderRadius: '12px', border: 'none'}} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-indigo-600 dark:bg-indigo-900 text-white p-6 rounded-2xl shadow-xl flex flex-col border border-indigo-500/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">AI RH Insights</h3>
          </div>
          <p className="text-indigo-50 text-sm leading-relaxed flex-1 italic font-medium">"{summary}"</p>
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-200">
            <span>Gestão Automática</span>
            <button onClick={() => setSummary('A atualizar...')} className="bg-white/10 px-3 py-1 rounded-full">Atualizar</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* BOX FÉRIAS */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors flex flex-col">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-3">
             <span className="text-xl">🌴</span>
             <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Atualmente em Férias</h3>
          </div>
          <div className="p-4 flex-1">
            {vacationEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <p className="text-xs font-medium italic">Sem férias registadas.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {vacationEmployees.map(emp => (
                  <li key={emp.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{emp.name}</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase">{formatDate(emp.vacationStart)} a {formatDate(emp.vacationEnd)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* TABELA DE ASSIDUIDADE COM FALTA AUTOMÁTICA */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Controlo de Assiduidade Inteligente</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Estado Atualizado em Tempo Real</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[9px] font-black uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Colaborador</th>
                  <th className="px-6 py-4 text-center">Estado de Presença</th>
                  <th className="px-6 py-4 text-center">Entrada</th>
                  <th className="px-6 py-4 text-center">Saída</th>
                  <th className="px-6 py-4 text-center">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map(emp => {
                  const empPunches = todayPunches.filter(p => p.employeeId === emp.id);
                  const punchIn = empPunches.find(p => p.type === 'IN');
                  const punchOut = empPunches.find(p => p.type === 'OUT');
                  const isManual = empPunches.some(p => p.entryMethod === EntryMethod.MANUAL);
                  
                  // Lógica Visual de Estado
                  let displayStatus = emp.status;
                  let statusColor = 'bg-slate-100 text-slate-500';
                  let statusLabel = 'Afastado';

                  if (emp.status === EmployeeStatus.VACATION) {
                    statusLabel = 'Férias';
                    statusColor = 'bg-amber-100 text-amber-700';
                  } else if (punchIn) {
                    statusLabel = 'Presente';
                    statusColor = 'bg-green-100 text-green-700';
                  } else if (emp.status === EmployeeStatus.ACTIVE) {
                    statusLabel = 'Falta (Auto)';
                    statusColor = 'bg-red-100 text-red-700 animate-pulse';
                  }

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{emp.name}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase">{emp.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase inline-block min-w-[85px] ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-xs text-indigo-600">
                        {punchIn ? new Date(punchIn.timestamp).toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-xs text-rose-600">
                        {punchOut ? new Date(punchOut.timestamp).toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {empPunches.length > 0 ? (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${isManual ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                            {isManual ? 'Manual' : 'Automático'}
                          </span>
                        ) : <span className="text-slate-300">---</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* LOG GLOBAL COMPLETO - MAIS ANTIGO PRIMEIRO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Registos Cronológicos (Antigo → Recente)</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Dados: {allPunchesSorted.length} Pontos</p>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[9px] font-black uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Data e Hora</th>
                <th className="px-6 py-3">Colaborador</th>
                <th className="px-6 py-3 text-center">Ação</th>
                <th className="px-6 py-3 text-center">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allPunchesSorted.map(p => {
                const emp = getEmployeeById(p.employeeId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {new Date(p.timestamp).toLocaleString('pt-PT', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-200 text-xs">{emp?.name || '---'}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${p.type === PunchType.IN ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {p.type === PunchType.IN ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${p.entryMethod === EntryMethod.MANUAL ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {p.entryMethod === EntryMethod.MANUAL ? 'Manual' : 'Auto'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

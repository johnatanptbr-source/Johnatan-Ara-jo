
import React, { useState, useEffect } from 'react';
import { Employee, Punch, AbsenceRecord, EmployeeStatus } from '../types';
import { GeminiService } from '../services/gemini';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  employees: Employee[];
  punches: Punch[];
  records: AbsenceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ employees, punches }) => {
  const [summary, setSummary] = useState<string>('Gerando resumo inteligente...');
  
  const today = new Date().toISOString().split('T')[0];
  const todayPunches = punches.filter(p => p.timestamp.startsWith(today));
  
  const totalEmployees = employees.length;
  const vacationEmployees = employees.filter(e => e.status === EmployeeStatus.VACATION);
  const onVacation = vacationEmployees.length;
  const absentCount = employees.filter(e => e.status === EmployeeStatus.ABSENT).length;
  
  // Who clocked in today
  const clockedInIds = Array.from(new Set(todayPunches.filter(p => p.type === 'IN').map(p => p.employeeId)));
  const activeCount = clockedInIds.length;
  const missingCount = employees.filter(e => e.status === EmployeeStatus.ACTIVE && !clockedInIds.includes(e.id)).length;

  useEffect(() => {
    const getSummary = async () => {
      const res = await GeminiService.generateDailySummary(employees, punches);
      setSummary(res || "Resumo indisponível.");
    };
    getSummary();
  }, [employees, punches]);

  const chartData = [
    { name: 'Presentes', value: activeCount, color: '#4F46E5' },
    { name: 'Faltando', value: missingCount, color: '#EF4444' },
    { name: 'Férias', value: onVacation, color: '#F59E0B' },
    { name: 'Afastados', value: absentCount, color: '#6B7280' },
  ];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não definida';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Painel de Hoje</h2>
        <span className="text-sm text-slate-500 font-medium">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Funcionários', value: totalEmployees, sub: 'Registrados', icon: '👤', color: 'indigo' },
          { label: 'Presentes Agora', value: activeCount, sub: 'Registraram entrada', icon: '✅', color: 'green' },
          { label: 'Faltas Pendentes', value: missingCount, sub: 'Ativos sem ponto', icon: '⚠️', color: 'red' },
          { label: 'Em Férias', value: onVacation, sub: 'Afastamento legal', icon: '🌴', color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded bg-${stat.color}-50 text-${stat.color}-600`}>HOJE</span>
            </div>
            <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
            <span className="text-sm font-medium text-slate-500">{stat.label}</span>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Visão de Frequência</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gemini Summary */}
        <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-700 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">Resumo Inteligente</h3>
          </div>
          <p className="text-indigo-100 text-sm leading-relaxed flex-1 italic">
            "{summary}"
          </p>
          <div className="mt-4 pt-4 border-t border-indigo-800 flex justify-between items-center text-xs text-indigo-400">
            <span>Powered by Gemini 3</span>
            <button onClick={() => setSummary('Gerando novo resumo...')} className="hover:text-white transition-colors">
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Vacation List */}
      {onVacation > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="text-xl">🌴</span> Equipe em Férias
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Funcionário</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Início</th>
                  <th className="px-6 py-4">Retorno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vacationEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                          {emp.name.substring(0,2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{emp.role}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(emp.vacationStart)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(emp.vacationEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Status por Funcionário</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Funcionário</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ponto de Entrada</th>
                <th className="px-6 py-4">Ponto de Saída</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => {
                const empPunches = todayPunches.filter(p => p.employeeId === emp.id);
                const punchIn = empPunches.find(p => p.type === 'IN');
                const punchOut = empPunches.find(p => p.type === 'OUT');
                
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {emp.name.substring(0,2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{emp.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        emp.status === EmployeeStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                        emp.status === EmployeeStatus.VACATION ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {emp.status === EmployeeStatus.ACTIVE ? 'Ativo' :
                         emp.status === EmployeeStatus.VACATION ? 'Férias' : 'Faltando'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {punchIn ? new Date(punchIn.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--'}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {punchOut ? new Date(punchOut.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--'}
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

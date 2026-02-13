
import React, { useState } from 'react';
import { Employee, EmployeeStatus } from '../types';

interface EmployeeManagerProps {
  employees: Employee[];
  onAdd: (emp: Omit<Employee, 'id' | 'status'>) => void;
  onUpdateStatus: (id: string, status: EmployeeStatus, vStart?: string, vEnd?: string, aDate?: string, aReason?: string) => void;
  onDelete: (id: string) => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, onAdd, onUpdateStatus, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [vacationDates, setVacationDates] = useState({ start: '', end: '' });
  const [absenceData, setAbsenceData] = useState({ date: new Date().toISOString().split('T')[0], reason: '' });
  const [formData, setFormData] = useState({ name: '', role: '', code: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role || !formData.code) return;
    onAdd(formData);
    setFormData({ name: '', role: '', code: '' });
    setIsModalOpen(false);
  };

  const handleOpenVacationModal = (id: string) => {
    setSelectedEmpId(id);
    const emp = employees.find(e => e.id === id);
    setVacationDates({
      start: emp?.vacationStart || '',
      end: emp?.vacationEnd || ''
    });
    setIsVacationModalOpen(true);
  };

  const handleOpenAbsenceModal = (id: string) => {
    setSelectedEmpId(id);
    const emp = employees.find(e => e.id === id);
    setAbsenceData({
      date: emp?.absenceDate || new Date().toISOString().split('T')[0],
      reason: emp?.absenceReason || ''
    });
    setIsAbsenceModalOpen(true);
  };

  const handleSaveVacation = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmpId && vacationDates.start && vacationDates.end) {
      onUpdateStatus(selectedEmpId, EmployeeStatus.VACATION, vacationDates.start, vacationDates.end);
      setIsVacationModalOpen(false);
      setSelectedEmpId(null);
    }
  };

  const handleSaveAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmpId && absenceData.date) {
      onUpdateStatus(selectedEmpId, EmployeeStatus.ABSENT, undefined, undefined, absenceData.date, absenceData.reason);
      setIsAbsenceModalOpen(false);
      setSelectedEmpId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gerenciar Equipe</h2>
          <p className="text-slate-500 text-sm">Adicione funcionários e controle afastamentos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Funcionário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg">
                {emp.name.substring(0,2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{emp.name}</h3>
                <p className="text-xs text-slate-500">{emp.role}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cód</span>
                <span className="text-sm font-mono font-bold text-indigo-600">{emp.code}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 uppercase">Status Atual</span>
                  {emp.status === EmployeeStatus.ABSENT && emp.absenceDate && (
                    <span className="text-[10px] text-red-400 font-medium">Falta em: {new Date(emp.absenceDate).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  emp.status === EmployeeStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                  emp.status === EmployeeStatus.VACATION ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {emp.status === EmployeeStatus.ACTIVE ? 'Ativo' :
                   emp.status === EmployeeStatus.VACATION ? 'Férias' : 'Faltando'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdateStatus(emp.id, EmployeeStatus.ACTIVE)}
                  className={`py-2 text-[10px] font-bold uppercase rounded border transition-colors ${
                    emp.status === EmployeeStatus.ACTIVE ? 'bg-green-600 border-green-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Ativo
                </button>
                <button
                  onClick={() => handleOpenVacationModal(emp.id)}
                  className={`py-2 text-[10px] font-bold uppercase rounded border transition-colors ${
                    emp.status === EmployeeStatus.VACATION ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Férias
                </button>
                <button
                  onClick={() => handleOpenAbsenceModal(emp.id)}
                  className={`py-2 text-[10px] font-bold uppercase rounded border transition-colors ${
                    emp.status === EmployeeStatus.ABSENT ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Falta
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
              <button 
                onClick={() => { if(confirm('Excluir funcionário?')) onDelete(emp.id); }}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Absence Modal */}
      {isAbsenceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Registrar Falta</h3>
              <button onClick={() => setIsAbsenceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveAbsence} className="p-6 space-y-4">
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-2">
                <p className="text-xs text-red-700 leading-tight">
                  Marcar como 'Faltando' impedirá que o funcionário registre o ponto até que seu status seja redefinido para 'Ativo'.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data da Falta</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={absenceData.date}
                  onChange={e => setAbsenceData({ ...absenceData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Justificativa (Opcional)</label>
                <textarea
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none h-20"
                  value={absenceData.reason}
                  onChange={e => setAbsenceData({ ...absenceData, reason: e.target.value })}
                  placeholder="Ex: Problemas de saúde, atraso no transporte..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 transition-all mt-4"
              >
                Confirmar Registro de Falta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Vacation Modal */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Definir Período</h3>
              <button onClick={() => setIsVacationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveVacation} className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                <p className="text-xs text-amber-700 leading-tight">
                  Este funcionário será marcado como em férias e não poderá bater ponto durante o período.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Início</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={vacationDates.start}
                  onChange={e => setVacationDates({ ...vacationDates, start: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Retorno</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={vacationDates.end}
                  onChange={e => setVacationDates({ ...vacationDates, end: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-200 transition-all mt-4"
              >
                Confirmar Férias
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Cadastrar Funcionário</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ex: Auxiliar Administrativo"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código de Ponto (4 dígitos)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono tracking-widest"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all mt-4"
              >
                Cadastrar Agora
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;

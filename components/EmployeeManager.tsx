
import React, { useState, useRef } from 'react';
import { Employee, EmployeeStatus, AbsenceRecord } from '../types';

interface EmployeeManagerProps {
  employees: Employee[];
  records: AbsenceRecord[];
  onAdd: (emp: Omit<Employee, 'id'>) => void;
  onEdit: (emp: Employee) => void;
  onDeleteAll: () => void;
  onUpdateStatus: (id: string, status: EmployeeStatus, vStart?: string, vEnd?: string, aDate?: string, aReason?: string) => void;
  onDelete: (id: string) => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, records, onAdd, onEdit, onDeleteAll, onUpdateStatus, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const [vacationDates, setVacationDates] = useState({ start: '', end: '' });
  const [absenceData, setAbsenceData] = useState({ date: new Date().toISOString().split('T')[0], reason: '' });
  const [formData, setFormData] = useState<Omit<Employee, 'id'> & { id?: string }>({ 
    name: '', 
    role: '', 
    code: '', 
    status: EmployeeStatus.ACTIVE,
    avatar: '' 
  });

  const [exportDates, setExportDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.code.includes(searchTerm)
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role || !formData.code) return;
    
    if (isEditMode && formData.id) {
      onEdit(formData as Employee);
    } else {
      onAdd(formData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', role: '', code: '', status: EmployeeStatus.ACTIVE, avatar: '' });
    setIsModalOpen(false);
    setIsEditMode(false);
  };

  const handleEditClick = (emp: Employee) => {
    setFormData(emp);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteAllDirect = () => {
    if (employees.length === 0) return;
    if (confirm("Deseja APAGAR DEFINITIVAMENTE todos os funcionários e registros? Esta ação é irreversível.")) {
      onDeleteAll();
    }
  };

  const toggleShowCode = (id: string) => {
    setShowCodes(prev => ({ ...prev, [id]: !prev[id] }));
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

  const handleExportRecordsCSV = () => {
    const startDate = new Date(exportDates.start);
    const endDate = new Date(exportDates.end);
    endDate.setHours(23, 59, 59, 999);

    const filteredRecords = records.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    if (filteredRecords.length === 0) {
      alert('Nenhuma ocorrência encontrada no período selecionado.');
      return;
    }

    const headers = ['Data Registro', 'Funcionario', 'Cargo', 'Tipo Ocorrencia', 'Detalhes/Justificativa'];
    const rows = filteredRecords.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return [
        new Date(r.date).toLocaleDateString('pt-BR'),
        emp?.name || 'Ex-Funcionario',
        emp?.role || 'N/A',
        r.type === 'VACATION' ? 'FERIAS' : 'FALTA',
        r.reason || ''
      ].map(val => `"${val}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_ocorrencias_${exportDates.start}_a_${exportDates.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestão de Colaboradores</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Administração de senhas e status da equipe</p>
        </div>
        <div className="flex flex-wrap w-full md:w-auto gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-200 transition-all active:scale-95 border border-indigo-200/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Relatório Ocorrências
          </button>
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-4 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleDeleteAllDirect}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2.5 rounded-xl transition-all shadow-lg active:scale-90"
            title="Excluir Todos os Dados"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          <button
            onClick={() => { setIsEditMode(false); setIsModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg text-sm active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col group overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center text-indigo-600 font-bold">
                {emp.avatar ? <img src={emp.avatar} className="w-full h-full object-cover" /> : emp.name.substring(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{emp.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{emp.role}</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 block uppercase">Senha</span>
                <span className="text-xs font-mono font-bold text-indigo-600 cursor-pointer" onClick={() => toggleShowCode(emp.id)}>
                   {showCodes[emp.id] ? emp.code : '••••'}
                </span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  emp.status === EmployeeStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                  emp.status === EmployeeStatus.VACATION ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {emp.status === EmployeeStatus.ACTIVE ? 'Ativo' :
                   emp.status === EmployeeStatus.VACATION ? 'Férias' : 'Faltando'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => onUpdateStatus(emp.id, EmployeeStatus.ACTIVE)} className={`py-1.5 text-[9px] font-black uppercase rounded border transition-colors ${emp.status === EmployeeStatus.ACTIVE ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-500'}`}>Ativo</button>
                <button onClick={() => handleOpenVacationModal(emp.id)} className={`py-1.5 text-[9px] font-black uppercase rounded border transition-colors ${emp.status === EmployeeStatus.VACATION ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-slate-500'}`}>Férias</button>
                <button onClick={() => handleOpenAbsenceModal(emp.id)} className={`py-1.5 text-[9px] font-black uppercase rounded border transition-colors ${emp.status === EmployeeStatus.ABSENT ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 text-slate-500'}`}>Falta</button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEditClick(emp)} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase flex items-center gap-1">Editar</button>
              <button onClick={() => { if(confirm("Remover definitivamente?")) onDelete(emp.id); }} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase flex items-center gap-1">Remover</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">{isEditMode ? 'Editar Cadastro' : 'Novo Colaborador'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-800"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-4">
                 <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                    {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black uppercase cursor-pointer transition-opacity">
                      Mudar Foto
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                 </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Nome Completo</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Cargo</label>
                <input type="text" required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Senha (4 dígitos)</label>
                <input type="password" required maxLength={4} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-center font-mono tracking-widest" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg mt-4 uppercase text-xs tracking-widest">Salvar</button>
            </form>
          </div>
        </div>
      )}

      {isVacationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-scale-in">
             <h3 className="text-xl font-bold mb-4">Programar Férias</h3>
             <form onSubmit={handleSaveVacation} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Início</label>
                  <input type="date" required value={vacationDates.start} onChange={e => setVacationDates({ ...vacationDates, start: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Fim</label>
                  <input type="date" required value={vacationDates.end} onChange={e => setVacationDates({ ...vacationDates, end: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsVacationModalOpen(false)} className="flex-1 py-2 text-xs font-bold text-slate-400">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold uppercase">Confirmar</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {isAbsenceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-scale-in">
             <h3 className="text-xl font-bold mb-4">Registrar Falta</h3>
             <form onSubmit={handleSaveAbsence} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Data</label>
                  <input type="date" required value={absenceData.date} onChange={e => setAbsenceData({ ...absenceData, date: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Justificativa</label>
                  <textarea value={absenceData.reason} onChange={e => setAbsenceData({ ...absenceData, reason: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none h-20" placeholder="Motivo da falta..."></textarea>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsAbsenceModalOpen(false)} className="flex-1 py-2 text-xs font-bold text-slate-400">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold uppercase">Confirmar</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-scale-in">
            <h3 className="text-xl font-bold mb-4">Relatório de Ocorrências</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1">Início</label><input type="date" value={exportDates.start} onChange={e => setExportDates({...exportDates, start: e.target.value})} className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs" /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1">Fim</label><input type="date" value={exportDates.end} onChange={e => setExportDates({...exportDates, end: e.target.value})} className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs" /></div>
              </div>
              <button onClick={handleExportRecordsCSV} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold uppercase">Baixar Excel</button>
              <button onClick={() => setIsExportModalOpen(false)} className="w-full text-xs font-bold text-slate-400 py-1">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;


import React, { useState, useEffect } from 'react';
import { AppView, Employee, Punch, AbsenceRecord, EmployeeStatus, PunchType, EntryMethod, EntryModality } from './types';
import { StorageService } from './services/storage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PunchClock from './components/PunchClock';
import EmployeeManager from './components/EmployeeManager';
import HistoryView from './components/HistoryView';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [punches, setPunches] = useState<Punch[]>([]);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(StorageService.getTheme());

  useEffect(() => {
    setEmployees(StorageService.getEmployees());
    setPunches(StorageService.getPunches());
    setRecords(StorageService.getRecords());
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAddEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: Math.random().toString(36).substr(2, 9),
    };
    const updated = [...employees, newEmp];
    setEmployees(updated);
    StorageService.saveEmployees(updated);
  };

  const handleEditEmployee = (updatedEmp: Employee) => {
    const updated = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setEmployees(updated);
    StorageService.saveEmployees(updated);
  };

  const handleDeleteAllEmployees = () => {
    if (confirm("Deseja apagar TUDO (Colaboradores, Pontos e Registos)?")) {
      setEmployees([]);
      setPunches([]);
      setRecords([]);
      StorageService.saveEmployees([]);
      StorageService.savePunches([]);
      StorageService.saveRecords([]);
      setIsAuthorized(false); 
      setView('DASHBOARD');
    }
  };

  const handleDeleteAllPunches = () => {
    if (confirm("Deseja apagar TODO o histórico de pontos registados?")) {
      setPunches([]);
      StorageService.savePunches([]);
    }
  };

  const handleDeleteAllRecords = () => {
    if (confirm("Deseja apagar TODOS os registos de faltas e férias?")) {
      setRecords([]);
      StorageService.saveRecords([]);
      const resetEmployees = employees.map(e => ({...e, status: EmployeeStatus.ACTIVE}));
      setEmployees(resetEmployees);
      StorageService.saveEmployees(resetEmployees);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    const updated = records.filter(r => r.id !== recordId);
    setRecords(updated);
    StorageService.saveRecords(updated);
  };

  const handleIgnoreAbsence = (empId: string, date: string) => {
    const newRecord: AbsenceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: empId,
      date: date,
      type: 'IGNORED_ABSENCE',
      reason: 'Falta Limpa pelo Admin'
    };
    const updated = [...records, newRecord];
    setRecords(updated);
    StorageService.saveRecords(updated);
  };

  const handleUpdateStatus = (
    id: string, 
    status: EmployeeStatus, 
    vStart?: string, 
    vEnd?: string,
    aDate?: string,
    aReason?: string
  ) => {
    const updatedEmployees = employees.map(e => {
      if (e.id !== id) return e;
      return { 
        ...e, 
        status, 
        vacationStart: status === EmployeeStatus.VACATION ? vStart : undefined, 
        vacationEnd: status === EmployeeStatus.VACATION ? vEnd : undefined,
        absenceDate: status === EmployeeStatus.ABSENT ? aDate : undefined,
        absenceReason: status === EmployeeStatus.ABSENT ? aReason : undefined
      };
    });
    setEmployees(updatedEmployees);
    StorageService.saveEmployees(updatedEmployees);

    if (status !== EmployeeStatus.ACTIVE) {
      const newRecord: AbsenceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: id,
        date: status === EmployeeStatus.VACATION ? (vStart || new Date().toISOString().split('T')[0]) : (aDate || new Date().toISOString().split('T')[0]),
        endDate: status === EmployeeStatus.VACATION ? vEnd : undefined,
        type: status === EmployeeStatus.VACATION ? 'VACATION' : 'ABSENCE',
        reason: status === EmployeeStatus.VACATION ? `Período de Férias: ${vStart} até ${vEnd}` : aReason
      };
      const updatedRecords = [...records, newRecord];
      setRecords(updatedRecords);
      StorageService.saveRecords(updatedRecords);
    }
  };

  const handlePunch = (code: string, options?: { manualData?: { type: PunchType; timestamp: string, method?: EntryMethod }, modality?: EntryModality }) => {
    const employee = employees.find(e => e.code === code);
    if (!employee) return { success: false, message: 'Identificação não reconhecida!' };
    
    const { manualData, modality = EntryModality.PIN } = options || {};
    const now = manualData ? new Date(manualData.timestamp) : new Date();
    
    const newPunch: Punch = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      type: manualData ? manualData.type : PunchType.IN,
      timestamp: now.toISOString(),
      entryMethod: manualData?.method || (manualData ? EntryMethod.MANUAL : EntryMethod.AUTO),
      modality: modality
    };

    if (!manualData) {
        const todayStr = now.toISOString().split('T')[0];
        const todayPunches = punches.filter(p => p.employeeId === employee.id && p.timestamp.startsWith(todayStr));
        newPunch.type = todayPunches.length % 2 === 0 ? PunchType.IN : PunchType.OUT;
    }

    const updatedPunches = [...punches, newPunch];
    setPunches(updatedPunches);
    StorageService.savePunches(updatedPunches);

    return { success: true, message: `${newPunch.type === PunchType.IN ? 'ENTRADA' : 'SAÍDA'} registada para ${employee.name}.` };
  };

  const handleEditPunch = (updatedPunch: Punch) => {
    const updated = punches.map(p => p.id === updatedPunch.id ? updatedPunch : p);
    setPunches(updated);
    StorageService.savePunches(updated);
  };

  const handleAddPunchDirect = (punch: Punch) => {
    const updated = [...punches, punch];
    setPunches(updated);
    StorageService.savePunches(updated);
  };

  const handleDeletePunch = (punchId: string) => {
    const updated = punches.filter(p => p.id !== punchId);
    setPunches(updated);
    StorageService.savePunches(updated);
  };

  const checkPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '2303') {
      setIsAuthorized(true);
      setPinError(false);
      setPinInput(''); 
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const renderView = () => {
    if ((view === 'EMPLOYEES' || view === 'HISTORY') && !isAuthorized) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4 uppercase">Acesso Restrito</h2>
            <form onSubmit={checkPin} className="space-y-4">
              <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Código" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:text-white rounded-xl text-center text-2xl tracking-[0.5em]" autoFocus />
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Entrar</button>
            </form>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'DASHBOARD': return <Dashboard employees={employees} punches={punches} records={records} theme={theme} />;
      case 'PUNCH': return <PunchClock employees={employees} onPunch={handlePunch} />;
      case 'EMPLOYEES': return <EmployeeManager employees={employees} records={records} onAdd={handleAddEmployee} onEdit={handleEditEmployee} onDeleteAll={handleDeleteAllEmployees} onUpdateStatus={handleUpdateStatus} onDelete={(id) => setEmployees(employees.filter(e => e.id !== id))} />;
      case 'HISTORY': return (
        <HistoryView 
          employees={employees} 
          punches={punches} 
          records={records}
          onEditPunch={handleEditPunch}
          onAddPunch={handleAddPunchDirect}
          onDeletePunch={handleDeletePunch}
          onDeleteRecord={handleDeleteRecord}
          onIgnoreAbsence={handleIgnoreAbsence}
          onDeleteAllPunches={handleDeleteAllPunches}
          onDeleteAllRecords={handleDeleteAllRecords}
        />
      );
      default: return <Dashboard employees={employees} punches={punches} records={records} theme={theme} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar currentView={view} setView={(v) => { setView(v); if (v !== 'EMPLOYEES' && v !== 'HISTORY') setIsAuthorized(false); }} theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;

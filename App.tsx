
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Employee, Punch, AbsenceRecord, EmployeeStatus } from './types';
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

  // Load Initial Data
  useEffect(() => {
    setEmployees(StorageService.getEmployees());
    setPunches(StorageService.getPunches());
    setRecords(StorageService.getRecords());
  }, []);

  const handleAddEmployee = (emp: Omit<Employee, 'id' | 'status'>) => {
    const newEmp: Employee = {
      ...emp,
      id: Math.random().toString(36).substr(2, 9),
      status: EmployeeStatus.ACTIVE
    };
    const updated = [...employees, newEmp];
    setEmployees(updated);
    StorageService.saveEmployees(updated);
  };

  const handleUpdateStatus = (
    id: string, 
    status: EmployeeStatus, 
    vStart?: string, 
    vEnd?: string,
    aDate?: string,
    aReason?: string
  ) => {
    const updated = employees.map(e => {
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
    setEmployees(updated);
    StorageService.saveEmployees(updated);
  };

  const handlePunch = (code: string) => {
    const employee = employees.find(e => e.code === code);
    if (!employee) return { success: false, message: 'Código inválido!' };
    
    if (employee.status !== EmployeeStatus.ACTIVE) {
      return { success: false, message: `Funcionário em estado de ${employee.status === EmployeeStatus.VACATION ? 'Férias' : 'Falta/Afastamento'}` };
    }

    const today = new Date().toISOString().split('T')[0];
    const empTodayPunches = punches.filter(p => p.employeeId === employee.id && p.timestamp.startsWith(today));
    
    const lastPunch = empTodayPunches[empTodayPunches.length - 1];
    const nextType = lastPunch?.type === 'IN' ? 'OUT' : 'IN';

    const newPunch: Punch = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      type: nextType as any,
      timestamp: new Date().toISOString()
    };

    const updatedPunches = [...punches, newPunch];
    setPunches(updatedPunches);
    StorageService.savePunches(updatedPunches);

    return { 
      success: true, 
      message: `${nextType === 'IN' ? 'Entrada' : 'Saída'} registrada para ${employee.name}`,
      employeeName: employee.name,
      type: nextType
    };
  };

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD':
        return <Dashboard employees={employees} punches={punches} records={records} />;
      case 'PUNCH':
        return <PunchClock onPunch={handlePunch} />;
      case 'EMPLOYEES':
        return (
          <EmployeeManager 
            employees={employees} 
            onAdd={handleAddEmployee} 
            onUpdateStatus={handleUpdateStatus}
            onDelete={(id) => {
              const updated = employees.filter(e => e.id !== id);
              setEmployees(updated);
              StorageService.saveEmployees(updated);
            }}
          />
        );
      case 'HISTORY':
        return <HistoryView employees={employees} punches={punches} />;
      default:
        return <Dashboard employees={employees} punches={punches} records={records} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar currentView={view} setView={setView} />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;

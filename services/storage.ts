
import { Employee, Punch, AbsenceRecord, EmployeeStatus } from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'tk_employees',
  PUNCHES: 'tk_punches',
  RECORDS: 'tk_records'
};

const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Carlos Silva', code: '1234', role: 'Desenvolvedor', status: EmployeeStatus.ACTIVE },
  { id: '2', name: 'Ana Souza', code: '5678', role: 'Designer', status: EmployeeStatus.ACTIVE },
  { id: '3', name: 'Roberto Lima', code: '0000', role: 'Gerente', status: EmployeeStatus.VACATION }
];

export const StorageService = {
  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : INITIAL_EMPLOYEES;
  },
  saveEmployees: (employees: Employee[]) => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },
  getPunches: (): Punch[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PUNCHES);
    return data ? JSON.parse(data) : [];
  },
  savePunches: (punches: Punch[]) => {
    localStorage.setItem(STORAGE_KEYS.PUNCHES, JSON.stringify(punches));
  },
  getRecords: (): AbsenceRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },
  saveRecords: (records: AbsenceRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }
};

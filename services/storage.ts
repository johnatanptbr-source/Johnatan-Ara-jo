
import { Employee, Punch, AbsenceRecord, EmployeeStatus, EmailConfig } from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'tk_employees',
  PUNCHES: 'tk_punches',
  RECORDS: 'tk_records',
  THEME: 'tk_theme',
  EMAIL_CONFIG: 'tk_email_config'
};

// Sistema limpo sem colaboradores de exemplo
const INITIAL_EMPLOYEES: Employee[] = [];

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  targetEmail: '',
  scheduleTime: '20:00',
  enabled: false
};

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
  },
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
  },
  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },
  getEmailConfig: (): EmailConfig => {
    const data = localStorage.getItem(STORAGE_KEYS.EMAIL_CONFIG);
    return data ? JSON.parse(data) : DEFAULT_EMAIL_CONFIG;
  },
  saveEmailConfig: (config: EmailConfig) => {
    localStorage.setItem(STORAGE_KEYS.EMAIL_CONFIG, JSON.stringify(config));
  }
};

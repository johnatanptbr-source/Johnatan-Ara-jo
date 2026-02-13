
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  VACATION = 'VACATION',
  ABSENT = 'ABSENT'
}

export enum EntryModality {
  PIN = 'PIN',
  FACE = 'FACE'
}

export interface Employee {
  id: string;
  name: string;
  code: string;
  role: string;
  status: EmployeeStatus;
  avatar?: string;
  vacationStart?: string;
  vacationEnd?: string;
  absenceDate?: string;
  absenceReason?: string;
}

export enum PunchType {
  IN = 'IN',
  OUT = 'OUT'
}

export enum EntryMethod {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL'
}

export interface Punch {
  id: string;
  employeeId: string;
  type: PunchType;
  timestamp: string;
  entryMethod: EntryMethod;
  modality: EntryModality;
}

export interface AbsenceRecord {
  id: string;
  employeeId: string;
  date: string;
  endDate?: string; // Para férias
  type: 'VACATION' | 'ABSENCE' | 'IGNORED_ABSENCE';
  reason?: string;
}

export interface EmailConfig {
  targetEmail: string;
  scheduleTime: string;
  enabled: boolean;
  lastSentDate?: string;
}

export type AppView = 'DASHBOARD' | 'PUNCH' | 'EMPLOYEES' | 'HISTORY';

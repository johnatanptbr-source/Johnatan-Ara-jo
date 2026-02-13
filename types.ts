
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  VACATION = 'VACATION',
  ABSENT = 'ABSENT'
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

export interface Punch {
  id: string;
  employeeId: string;
  type: PunchType;
  timestamp: string;
}

export interface AbsenceRecord {
  id: string;
  employeeId: string;
  date: string;
  type: 'VACATION' | 'ABSENCE';
  reason?: string;
}

export type AppView = 'DASHBOARD' | 'PUNCH' | 'EMPLOYEES' | 'HISTORY';

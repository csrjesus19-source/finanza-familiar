export type TransactionType = 'income' | 'expense';

export enum Category {
  VIVIENDA = 'Vivienda',
  TRANSPORTE = 'Transporte',
  SERVICIOS = 'Servicios',
  ALIMENTOS = 'Alimentos',
  TRANSFERENCIAS = 'Transferencias',
  DIEZMOS = 'Diezmos',
  SALARIO = 'Salario',
  NEGOCIO = 'Negocio',
  OTROS_INGRESOS = 'Otros Ingresos',
  OTROS_GASTOS = 'Otros Gastos'
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: Category | string;
  description: string;
  type: TransactionType;
  createdBy: string;
  company?: string; // New field for Company Name / Source
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  fixedExpenses: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface FamilyProfile {
  familyName: string;
  members: string[];
  pin: string; // Security PIN
}
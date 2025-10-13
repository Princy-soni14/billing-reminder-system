
export interface Company {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  phone: string;
  contactPerson?: string;
  paymentTermsDays: number;
  totalPendingAmount: number;
  autoRemindersEnabled: boolean;
  createdAt: string;
}

export interface CompanyCC {
  id: string;
  companyId: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Bill {
  id: string;
  companyId: string;
  date: string;
  billNo: string;
  poNo: string;
  type: string;
  dueDays: number;
  billAmount: number;
  pendingAmount: number;
  balanceAmount: number;
  lastReminderSent?: string;
  reminderCount: number;
  isReminderPaused: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ReminderLog {
  id: string;
  companyId: string;
  billIds: string[];
  companyName: string;
  billNumbers: string[];
  sentAt: string;
  type: 'manual' | 'automatic';
  status: 'sent' | 'failed';
  emailTo: string;
  emailCC: string[];
}

export interface SearchFilters {
  searchTerm: string;
  searchField: 'all' | 'billNo' | 'amount' | 'companyName' | 'dueDays';
}
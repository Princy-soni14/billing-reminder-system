import { Company, Bill, User, CompanyCC, EmailTemplate } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'admin@company.com',
    fullName: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01'
  },
  {
    id: 'user-002',
    email: 'accounts@company.com',
    fullName: 'Accounts Manager',
    role: 'user',
    createdAt: '2024-01-01'
  },
  {
    id: 'user-003',
    email: 'finance@company.com',
    fullName: 'Finance Officer',
    role: 'user',
    createdAt: '2024-01-01'
  }
];

export const mockCompanies: Company[] = [
  {
    id: 'comp-001',
    name: 'Sentiment AI Pvt Ltd',
    email: 'sentiimenta.ai@gmail.com',
    address: 'J-14 Kishan Glory B.H Pratham Rivera Atladra',
    city: 'VADODARA',
    state: 'Gujarat',
    pincode: '391775',
    phone: '+917802032338',
    contactPerson: 'Mr. Dhrumil Patel',
    paymentTermsDays: 30,
    totalPendingAmount: 47920.00,
    autoRemindersEnabled: true,
    createdAt: '2024-01-15'
  },
  {
    id: 'comp-002',
    name: 'Tech Solutions India',
    email: 'info@techsolutions.in',
    address: 'Plot 45, Tech Park, Whitefield',
    city: 'BANGALORE',
    state: 'Karnataka',
    pincode: '560066',
    phone: '+918012345678',
    contactPerson: 'Ms. Priya Sharma',
    paymentTermsDays: 45,
    totalPendingAmount: 125600.00,
    autoRemindersEnabled: true,
    createdAt: '2024-02-10'
  },
  {
    id: 'comp-003',
    name: 'Digital Marketing Hub',
    email: 'contact@dmhub.com',
    address: '12th Floor, Business Tower, Andheri East',
    city: 'MUMBAI',
    state: 'Maharashtra',
    pincode: '400069',
    phone: '+912226789012',
    contactPerson: 'Mr. Rajesh Kumar',
    paymentTermsDays: 15,
    totalPendingAmount: 68450.00,
    autoRemindersEnabled: false,
    createdAt: '2024-03-05'
  },
  {
    id: 'comp-004',
    name: 'CloudNine Systems',
    email: 'accounts@cloudnine.tech',
    address: 'Sector 62, Industrial Area',
    city: 'NOIDA',
    state: 'Uttar Pradesh',
    pincode: '201309',
    phone: '+911203456789',
    contactPerson: 'Ms. Anita Desai',
    paymentTermsDays: 60,
    totalPendingAmount: 89320.00,
    autoRemindersEnabled: true,
    createdAt: '2024-01-20'
  },
  {
    id: 'comp-005',
    name: 'Green Energy Corp',
    email: 'billing@greenenergy.co.in',
    address: 'Phase 2, Industrial Estate',
    city: 'PUNE',
    state: 'Maharashtra',
    pincode: '411026',
    phone: '+912067891234',
    contactPerson: 'Mr. Vijay Patel',
    paymentTermsDays: 30,
    totalPendingAmount: 234560.00,
    autoRemindersEnabled: true,
    createdAt: '2024-02-28'
  }
];

export const mockCompanyCC: CompanyCC[] = [
  {
    id: 'cc-001',
    companyId: 'comp-001',
    email: 'accounts@sentimentai.com',
    name: 'Accounts Department',
    createdAt: '2024-01-15'
  },
  {
    id: 'cc-002',
    companyId: 'comp-001',
    email: 'finance@sentimentai.com',
    name: 'Finance Team',
    createdAt: '2024-01-15'
  },
  {
    id: 'cc-003',
    companyId: 'comp-002',
    email: 'cfo@techsolutions.in',
    name: 'CFO',
    createdAt: '2024-02-10'
  },
  {
    id: 'cc-004',
    companyId: 'comp-002',
    email: 'payments@techsolutions.in',
    name: 'Payment Team',
    createdAt: '2024-02-10'
  },
  {
    id: 'cc-005',
    companyId: 'comp-004',
    email: 'finance@cloudnine.tech',
    createdAt: '2024-01-20'
  }
];

export const mockBills: Bill[] = [
  {
    id: 'bill-001',
    companyId: 'comp-001',
    date: '03/07/2025',
    billNo: 'SmAI/1299/25-26',
    poNo: 'SmAI/C/0522/25-26',
    type: 'Sale',
    dueDays: 65,
    billAmount: 1394.00,
    pendingAmount: 1394.00,
    balanceAmount: 1394.00,
    reminderCount: 0,
    isReminderPaused: false
  },
  {
    id: 'bill-002',
    companyId: 'comp-001',
    date: '04/07/2025',
    billNo: 'SmAI/1315/25-26',
    poNo: 'SmAI/C/0522/25-26',
    type: 'Sale',
    dueDays: 64,
    billAmount: 1604.00,
    pendingAmount: 1604.00,
    balanceAmount: 2998.00,
    reminderCount: 1,
    isReminderPaused: false,
    lastReminderSent: '2025-01-10'
  },
  {
    id: 'bill-003',
    companyId: 'comp-001',
    date: '05/07/2025',
    billNo: 'SmAI/1325/25-26',
    poNo: 'SmAI/C/0522/25-26',
    type: 'Sale',
    dueDays: 63,
    billAmount: 3717.00,
    pendingAmount: 3717.00,
    balanceAmount: 6715.00,
    reminderCount: 0,
    isReminderPaused: false
  },
  {
    id: 'bill-004',
    companyId: 'comp-001',
    date: '14/07/2025',
    billNo: 'SmAI/1411/25-26',
    poNo: 'SmAI/C/0591/25-26',
    type: 'Sale',
    dueDays: 54,
    billAmount: 33399.00,
    pendingAmount: 33399.00,
    balanceAmount: 40114.00,
    reminderCount: 2,
    isReminderPaused: true,
    lastReminderSent: '2025-01-08'
  },
  {
    id: 'bill-005',
    companyId: 'comp-001',
    date: '19/07/2025',
    billNo: 'SmAI/1473/25-26',
    poNo: 'SmAI/C/25-26',
    type: 'Sale',
    dueDays: 49,
    billAmount: 7806.00,
    pendingAmount: 7806.00,
    balanceAmount: 47920.00,
    reminderCount: 0,
    isReminderPaused: false
  },
  {
    id: 'bill-006',
    companyId: 'comp-002',
    date: '15/06/2025',
    billNo: 'TS/2401/25-26',
    poNo: 'PO-TS-001',
    type: 'Sale',
    dueDays: 93,
    billAmount: 45600.00,
    pendingAmount: 45600.00,
    balanceAmount: 45600.00,
    reminderCount: 3,
    isReminderPaused: false,
    lastReminderSent: '2025-01-05'
  },
  {
    id: 'bill-007',
    companyId: 'comp-002',
    date: '28/06/2025',
    billNo: 'TS/2445/25-26',
    poNo: 'PO-TS-002',
    type: 'Sale',
    dueDays: 80,
    billAmount: 80000.00,
    pendingAmount: 80000.00,
    balanceAmount: 125600.00,
    reminderCount: 2,
    isReminderPaused: false,
    lastReminderSent: '2025-01-12'
  },
  {
    id: 'bill-008',
    companyId: 'comp-003',
    date: '20/08/2025',
    billNo: 'DMH/801/25-26',
    poNo: 'DMH-PO-551',
    type: 'Sale',
    dueDays: 27,
    billAmount: 23450.00,
    pendingAmount: 23450.00,
    balanceAmount: 23450.00,
    reminderCount: 1,
    isReminderPaused: false,
    lastReminderSent: '2025-01-14'
  },
  {
    id: 'bill-009',
    companyId: 'comp-003',
    date: '25/08/2025',
    billNo: 'DMH/815/25-26',
    poNo: 'DMH-PO-562',
    type: 'Sale',
    dueDays: 22,
    billAmount: 45000.00,
    pendingAmount: 45000.00,
    balanceAmount: 68450.00,
    reminderCount: 0,
    isReminderPaused: false
  },
  {
    id: 'bill-010',
    companyId: 'comp-004',
    date: '10/05/2025',
    billNo: 'CN/501/25-26',
    poNo: 'CN-PO-2025-01',
    type: 'Sale',
    dueDays: 129,
    billAmount: 67320.00,
    pendingAmount: 67320.00,
    balanceAmount: 67320.00,
    reminderCount: 4,
    isReminderPaused: false,
    lastReminderSent: '2025-01-09'
  },
  {
    id: 'bill-011',
    companyId: 'comp-004',
    date: '22/07/2025',
    billNo: 'CN/722/25-26',
    poNo: 'CN-PO-2025-02',
    type: 'Sale',
    dueDays: 46,
    billAmount: 22000.00,
    pendingAmount: 22000.00,
    balanceAmount: 89320.00,
    reminderCount: 0,
    isReminderPaused: false
  },
  {
    id: 'bill-012',
    companyId: 'comp-005',
    date: '05/06/2025',
    billNo: 'GE/601/25-26',
    poNo: 'GE-2025-001',
    type: 'Sale',
    dueDays: 103,
    billAmount: 156000.00,
    pendingAmount: 156000.00,
    balanceAmount: 156000.00,
    reminderCount: 5,
    isReminderPaused: false,
    lastReminderSent: '2025-01-13'
  },
  {
    id: 'bill-013',
    companyId: 'comp-005',
    date: '18/07/2025',
    billNo: 'GE/718/25-26',
    poNo: 'GE-2025-002',
    type: 'Sale',
    dueDays: 50,
    billAmount: 78560.00,
    pendingAmount: 78560.00,
    balanceAmount: 234560.00,
    reminderCount: 1,
    isReminderPaused: false,
    lastReminderSent: '2025-01-11'
  }
];

export const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'template-001',
    name: 'Standard Payment Reminder',
    subject: 'Payment Reminder - Pending Invoices - {{companyName}}',
    body: `Dear {{companyName}},

This is a friendly reminder regarding your pending invoice payments.

Below are the details of pending invoices:

{{billsTable}}

Total Pending Amount: ₹{{totalAmount}}

Please process the payment at your earliest convenience to avoid any service interruptions.

If you have already made the payment, please ignore this reminder or contact us with payment details.

Thank you for your business.

Best Regards,
Accounts Department`,
    isDefault: true,
    createdAt: '2024-01-01'
  },
  {
    id: 'template-002',
    name: 'Urgent Payment Notice',
    subject: 'URGENT: Payment Overdue - {{companyName}}',
    body: `Dear {{companyName}},

This is an URGENT notice regarding your overdue payments.

Below are the details of overdue invoices:

{{billsTable}}

Total Outstanding: ₹{{totalAmount}}

Your account is significantly overdue. Please arrange immediate payment to avoid service suspension.

Contact our accounts department immediately at accounts@yourcompany.com or call us at +91-XXXXXXXXXX.

Immediate action required.

Accounts Department`,
    isDefault: false,
    createdAt: '2024-01-01'
  }
];

export const mockCompany = mockCompanies[0];

export const emailTemplate = {
  subject: 'Payment Reminder - Pending Invoices - {{companyName}}',
  body: `Dear {{companyName}},

This is a friendly reminder regarding your pending invoice payments.

Below are the details of pending invoices:

{{billsTable}}

Total Pending Amount: ₹{{totalAmount}}

Please process the payment at your earliest convenience to avoid any service interruptions.

If you have already made the payment, please ignore this reminder or contact us with payment details.

Thank you for your business.

Best Regards,
Accounts Department`
};

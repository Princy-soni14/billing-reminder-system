import { Bill, Company } from '../types';

export const exportBillsToCSV = (bills: Bill[], companies: Company[]) => {
  const headers = [
    'Bill No',
    'Company Name',
    'Bill Date',
    'PO No',
    'Type',
    'Bill Amount',
    'Pending Amount',
    'Due Days',
    'Reminder Count',
    'Last Reminder Sent',
    'Status'
  ];

  const rows = bills.map(bill => {
    const company = companies.find(c => c.id === bill.companyId);
    return [
      bill.billNo,
      company?.name || 'Unknown',
      bill.date,
      bill.poNo,
      bill.type,
      bill.billAmount.toFixed(2),
      bill.pendingAmount.toFixed(2),
      bill.dueDays,
      bill.reminderCount,
      bill.lastReminderSent || 'Never',
      bill.isReminderPaused ? 'Paused' : 'Active'
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `bills_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportCompaniesToCSV = (companies: Company[]) => {
  const headers = [
    'Company Name',
    'Email',
    'Address',
    'City',
    'State',
    'Pincode',
    'Phone',
    'Contact Person',
    'Payment Terms (Days)',
    'Total Pending Amount',
    'Auto Reminders',
    'Created At'
  ];

  const rows = companies.map(company => [
    company.name,
    company.email,
    company.address,
    company.city,
    company.state || '',
    company.pincode || '',
    company.phone,
    company.contactPerson || '',
    company.paymentTermsDays,
    company.totalPendingAmount.toFixed(2),
    company.autoRemindersEnabled ? 'Yes' : 'No',
    company.createdAt
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `companies_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateBillsTemplateCSV = () => {
  const headers = [
    'Bill No',
    'Company ID',
    'Bill Date (DD/MM/YYYY)',
    'PO No',
    'Type',
    'Bill Amount',
    'Pending Amount'
  ];

  const exampleRow = [
    'INV/001/2025',
    'comp-001',
    '01/01/2025',
    'PO-001',
    'Sale',
    '10000.00',
    '10000.00'
  ];

  const csvContent = [
    headers.join(','),
    exampleRow.map(cell => `"${cell}"`).join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'bills_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateCompaniesTemplateCSV = () => {
  const headers = [
    'Company Name',
    'Email',
    'Address',
    'City',
    'State',
    'Pincode',
    'Phone',
    'Contact Person',
    'Payment Terms (Days)'
  ];

  const exampleRow = [
    'Example Company Ltd',
    'contact@example.com',
    '123 Business Street',
    'Mumbai',
    'Maharashtra',
    '400001',
    '+919876543210',
    'Mr. John Doe',
    '30'
  ];

  const csvContent = [
    headers.join(','),
    exampleRow.map(cell => `"${cell}"`).join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'companies_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

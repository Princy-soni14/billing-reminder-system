import React from 'react';
import { Building2, Phone, MapPin, Edit, Plus, Mail } from 'lucide-react';
import { Company } from '../types';

interface CompanySelectorProps {
  company: Company;
  companies?: Company[]; // 👈 optional list for admin
  onCompanyChange?: (company: Company) => void;
  onAddCompany: () => void;
  onEditCompany: () => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ 
  company, 
  companies = [], 
  onCompanyChange, 
  onAddCompany, 
  onEditCompany 
}) => {

  const isAdmin = companies.length > 1; // if there are multiple companies, user is admin

  return (
    <div>
      {/* Admin-only dropdown for switching companies */}
      {isAdmin && onCompanyChange && (
        <div className="flex justify-end mb-3">
          <select
            onChange={(e) => {
              const selected = companies.find((c) => c.id === e.target.value);
              if (selected) onCompanyChange(selected);
            }}
            value={company?.id || ''}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* UI */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{company.name}</h2>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">{company.email}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-green-500" />
                  <span>{company.address}, {company.city}</span>
                  {company.state && <span>, {company.state}</span>}
                  {company.pincode && <span> - {company.pincode}</span>}
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-purple-500" />
                  <span>{company.phone}</span>
                  {company.contactPerson && (
                    <span className="ml-2 text-gray-500">({company.contactPerson})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pending Amount</p>
              <p className="text-3xl font-bold text-red-600">
                ₹{company.totalPendingAmount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                company.autoRemindersEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                Auto Reminders {company.autoRemindersEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={onEditCompany}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-md"
                  title="Edit Company"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={onAddCompany}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors shadow-md"
                  title="Add New Company"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySelector;

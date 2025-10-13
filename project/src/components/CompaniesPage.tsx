import React, { useState } from 'react';
import { Building2, Plus, CreditCard as Edit2, Trash2, Mail, Phone, MapPin, Users } from 'lucide-react';
import { Company } from '../types';
import toast from 'react-hot-toast';

interface CompaniesPageProps {
  companies: Company[];
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
  onManageCC: (company: Company) => void;
}

const CompaniesPage: React.FC<CompaniesPageProps> = ({
  companies,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
  onManageCC
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (company: Company) => {
    if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
      onDeleteCompany(company.id);
      toast.success(`Company "${company.name}" deleted successfully`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>Companies</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">Manage all your company contacts and details</p>
        </div>
        <button
          onClick={onAddCompany}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-lg font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Add Company</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search companies by name, email, or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{company.name}</h3>
                  <p className="text-xs text-gray-500">ID: {company.id}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{company.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{company.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">{company.city}, {company.state}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-600">Payment Terms:</span>
                <span className="font-semibold text-gray-800">{company.paymentTermsDays} days</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-600">Pending Amount:</span>
                <span className="font-semibold text-green-600">₹{company.totalPendingAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onManageCC(company)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition text-sm"
                  title="Manage CC Emails"
                >
                  <Users className="h-4 w-4" />
                  <span>CC</span>
                </button>
                <button
                  onClick={() => onEditCompany(company)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition text-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(company)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No companies found</p>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;

import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, MapPin, User, Save } from 'lucide-react';
import { Company } from '../types';

interface EditCompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCompany: (company: Company) => void;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({ 
  company,
  isOpen, 
  onClose, 
  onUpdateCompany 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    contactPerson: '',
    paymentTermsDays: 30,
    autoRemindersEnabled: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        email: company.email,
        address: company.address,
        city: company.city,
        state: company.state || '',
        pincode: company.pincode || '',
        phone: company.phone,
        contactPerson: company.contactPerson || '',
        paymentTermsDays: company.paymentTermsDays || 30,
        autoRemindersEnabled: company.autoRemindersEnabled
      });
    }
  }, [company]);

  if (!isOpen || !company) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onUpdateCompany({
        ...company,
        ...formData
      });
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Edit Company</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter company name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="company@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+91-XXXXXXXXXX"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Mr. John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter complete address"
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="City"
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="000000"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="autoRemindersEnabled"
                checked={formData.autoRemindersEnabled}
                onChange={handleChange}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="font-medium text-gray-700">Enable Automatic Reminders</span>
            </label>
            <p className="mt-1 text-sm text-gray-600">
              Automatically send payment reminders via n8n webhook
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg flex items-center space-x-2 transition-all font-medium shadow-lg"
            >
              <Save className="h-4 w-4" />
              <span>Update Company</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCompanyModal;
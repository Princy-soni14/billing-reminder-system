import React, { useState } from 'react';
import { X, Building2, Mail, Phone, MapPin, User, Save } from 'lucide-react';
import { Company } from '../types';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (company: Omit<Company, 'id' | 'totalPendingAmount' | 'createdAt'>) => void;
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddCompany 
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

  if (!isOpen) return null;

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
      // 🔒 Send only fields expected by onAddCompany (parent adds id/createdAt/totalPendingAmount)
      const companyData: Omit<Company, 'id' | 'totalPendingAmount' | 'createdAt'> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        phone: formData.phone.trim(),
        contactPerson: formData.contactPerson.trim(),
        paymentTermsDays: Number(formData.paymentTermsDays) || 30,
        autoRemindersEnabled: !!formData.autoRemindersEnabled,
      };

      onAddCompany(companyData);

      // reset the form
      setFormData({
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Add New Company</h3>
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
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'company-name-error' : undefined}
                className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter company name"
                autoComplete="organization"
                required
              />
              {errors.name && <p id="company-name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="company-email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address *
              </label>
              <input
                id="company-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'company-email-error' : undefined}
                className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="company@example.com"
                autoComplete="email"
                required
              />
              {errors.email && <p id="company-email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="company-phone" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number *
              </label>
              <input
                id="company-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'company-phone-error' : undefined}
                className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+91-XXXXXXXXXX"
                autoComplete="tel"
                required
              />
              {errors.phone && <p id="company-phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="contact-person" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Contact Person
              </label>
              <input
                id="contact-person"
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Mr. John Doe"
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="company-address" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Address *
            </label>
            <textarea
              id="company-address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'company-address-error' : undefined}
              className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter complete address"
              autoComplete="street-address"
              required
            />
            {errors.address && <p id="company-address-error" className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="company-city" className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                id="company-city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? 'company-city-error' : undefined}
                className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="City"
                autoComplete="address-level2"
                required
              />
              {errors.city && <p id="company-city-error" className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="company-state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                id="company-state"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="State"
                autoComplete="address-level1"
              />
            </div>

            <div>
              <label htmlFor="company-pincode" className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                id="company-pincode"
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="000000"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="payment-terms" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms (Days) *
              </label>
              <input
                id="payment-terms"
                type="number"
                name="paymentTermsDays"
                value={formData.paymentTermsDays}
                onChange={handleChange}
                min={1}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="30"
              />
              <p className="mt-1 text-xs text-gray-500">Number of days before payment is due</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <label htmlFor="auto-reminders" className="flex items-center space-x-3">
                <input
                  id="auto-reminders"
                  type="checkbox"
                  name="autoRemindersEnabled"
                  checked={formData.autoRemindersEnabled}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700">Enable Auto Reminders</span>
              </label>
              <p className="mt-1 text-xs text-gray-600">
                Send automatic reminders via webhook
              </p>
            </div>
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg flex items-center space-x-2 transition-all font-medium shadow-lg"
            >
              <Save className="h-4 w-4" />
              <span>Add Company</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyModal;

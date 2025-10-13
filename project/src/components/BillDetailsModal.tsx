import React from 'react';
import { X, Calendar, DollarSign, FileText, Clock, Mail } from 'lucide-react';
import { Bill } from '../types';

interface BillDetailsModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onSendReminder: (billId: string, type: 'manual') => void;
}

const BillDetailsModal: React.FC<BillDetailsModalProps> = ({ 
  bill, 
  isOpen, 
  onClose, 
  onSendReminder 
}) => {
  if (!isOpen || !bill) return null;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Bill Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Bill Number</p>
                  <p className="font-semibold text-gray-900">{bill.billNo}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Bill Date</p>
                  <p className="font-semibold text-gray-900">{bill.date}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">PO Number</p>
                  <p className="font-semibold text-gray-900">{bill.poNo}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Bill Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(bill.billAmount)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending Amount</p>
                  <p className="font-semibold text-red-600">{formatCurrency(bill.pendingAmount)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Due Days</p>
                  <p className="font-semibold text-yellow-600">{bill.dueDays} days overdue</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Reminder History</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Reminders Sent:</span>
                <span className="font-semibold">{bill.reminderCount}</span>
              </div>
              {bill.lastReminderSent && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Reminder:</span>
                  <span className="font-semibold">{new Date(bill.lastReminderSent).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Reminder Status:</span>
                <span className={`font-semibold ${bill.isReminderPaused ? 'text-red-600' : 'text-green-600'}`}>
                  {bill.isReminderPaused ? 'Paused' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSendReminder(bill.id, 'manual');
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span>Send Reminder</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillDetailsModal;
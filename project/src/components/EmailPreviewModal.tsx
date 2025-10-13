import React from 'react';
import { X, Mail, Send } from 'lucide-react';
import { Bill } from '../types';
import { emailTemplate } from '../data/mockData';

interface EmailPreviewModalProps {
  bill: Bill | null;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSendEmail: () => void;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ 
  bill, 
  companyName,
  isOpen, 
  onClose,
  onSendEmail
}) => {
  if (!isOpen || !bill) return null;

  const processTemplate = (template: string) => {
    return template
      .replace(/{{companyName}}/g, companyName)
      .replace(/{{billNo}}/g, bill.billNo)
      .replace(/{{billDate}}/g, bill.date)
      .replace(/{{billAmount}}/g, bill.billAmount.toLocaleString())
      .replace(/{{dueDays}}/g, bill.dueDays.toString());
  };

  const emailSubject = processTemplate(emailTemplate.subject);
  const emailBody = processTemplate(emailTemplate.body);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Email Preview</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold">To:</span> {companyName}
              </div>
              <div>
                <span className="font-semibold">From:</span> Accounts Department
              </div>
              <div>
                <span className="font-semibold">Type:</span> Payment Reminder
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="font-semibold text-gray-900">{emailSubject}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
                {emailBody}
              </pre>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">n8n Webhook Configuration</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Webhook URL:</span> https://your-n8n-instance.com/webhook/payment-reminder</div>
              <div><span className="font-medium">Method:</span> POST</div>
              <div><span className="font-medium">Content-Type:</span> application/json</div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSendEmail();
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>Send Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewModal;
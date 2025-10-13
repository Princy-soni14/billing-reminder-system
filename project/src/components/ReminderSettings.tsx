import React, { useState } from 'react';
import { Settings, Bell, BellOff, Clock, Mail } from 'lucide-react';
import { Company } from '../types';

interface ReminderSettingsProps {
  company: Company;
  onUpdateSettings: (settings: any) => void;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({ company, onUpdateSettings }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(company.autoRemindersEnabled);
  const [reminderFrequency, setReminderFrequency] = useState(7);
  const [reminderTime, setReminderTime] = useState('09:00');

  const handleSaveSettings = () => {
    onUpdateSettings({
      autoRemindersEnabled,
      reminderFrequency,
      reminderTime
    });
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Reminder Settings</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 transition-colors"
        >
          {isExpanded ? 'Hide' : 'Configure'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6 border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={autoRemindersEnabled}
                  onChange={(e) => setAutoRemindersEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  {autoRemindersEnabled ? (
                    <Bell className="h-4 w-4 text-green-600" />
                  ) : (
                    <BellOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium text-gray-700">Enable Automatic Reminders</span>
                </div>
              </label>
              <p className="mt-1 text-sm text-gray-600">
                Automatically send reminders via n8n webhook
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Reminder Frequency (Days)
              </label>
              <select
                value={reminderFrequency}
                onChange={(e) => setReminderFrequency(parseInt(e.target.value))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                disabled={!autoRemindersEnabled}
              >
                <option value={3}>Every 3 days</option>
                <option value={7}>Every 7 days</option>
                <option value={14}>Every 14 days</option>
                <option value={30}>Every 30 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Reminder Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                disabled={!autoRemindersEnabled}
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Settings
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">n8n Webhook Integration</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Configure your n8n workflow to receive POST requests at:
            </p>
            <code className="block bg-yellow-100 p-2 rounded text-sm font-mono">
              https://your-n8n-instance.com/webhook/payment-reminder
            </code>
            <p className="text-sm text-yellow-700 mt-2">
              The webhook will receive JSON data with bill details, company information, and email template.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderSettings;
import React, { useState, useEffect } from 'react';
import { X, Mail, Save, Plus, Edit3, Trash2, Eye } from 'lucide-react';
import { EmailTemplate } from '../types';
import { defaultEmailTemplates } from '../data/mockData';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (template: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  existingTemplates: EmailTemplate[];
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveTemplate,
  onDeleteTemplate,
  existingTemplates
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultEmailTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    if (existingTemplates.length > 0) {
      setTemplates(existingTemplates);
    }
  }, [existingTemplates]);

  if (!isOpen) return null;

  const handleNewTemplate = () => {
    setFormData({
      name: '',
      subject: '',
      body: ''
    });
    setSelectedTemplate(null);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body
    });
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    const template: EmailTemplate = {
      id: selectedTemplate?.id || `template-${Date.now()}`,
      name: formData.name,
      subject: formData.subject,
      body: formData.body,
      isDefault: false,
      createdAt: selectedTemplate?.createdAt || new Date().toISOString()
    };

    onSaveTemplate(template);
    
    if (selectedTemplate) {
      setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? template : t));
    } else {
      setTemplates(prev => [...prev, template]);
    }
    
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      onDeleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const previewTemplate = (template: EmailTemplate) => {
    const processedSubject = template.subject
      .replace(/{{companyName}}/g, 'Sample Company Ltd')
      .replace(/{{billNo}}/g, 'INV-001')
      .replace(/{{billDate}}/g, '01/01/2024')
      .replace(/{{billAmount}}/g, '10,000')
      .replace(/{{dueDays}}/g, '30');

    const processedBody = template.body
      .replace(/{{companyName}}/g, 'Sample Company Ltd')
      .replace(/{{billNo}}/g, 'INV-001')
      .replace(/{{billDate}}/g, '01/01/2024')
      .replace(/{{billAmount}}/g, '10,000')
      .replace(/{{dueDays}}/g, '30');

    return { subject: processedSubject, body: processedBody };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Email Templates</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {!isEditing ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-800">Manage Templates</h4>
                <button
                  onClick={handleNewTemplate}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Template</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {templates.map((template) => {
                  const preview = previewTemplate(template);
                  return (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-semibold text-gray-800">{template.name}</h5>
                          {template.isDefault && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit Template"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          {!template.isDefault && (
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Template"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Subject:</p>
                        <p className="text-sm text-gray-600">{preview.subject}</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
                        <p className="text-xs text-gray-600 line-clamp-3">{preview.body.substring(0, 150)}...</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 mb-2">Available Variables</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <code className="bg-blue-100 px-2 py-1 rounded">{'{{companyName}}'}</code>
                  <code className="bg-blue-100 px-2 py-1 rounded">{'{{billNo}}'}</code>
                  <code className="bg-blue-100 px-2 py-1 rounded">{'{{billDate}}'}</code>
                  <code className="bg-blue-100 px-2 py-1 rounded">{'{{billAmount}}'}</code>
                  <code className="bg-blue-100 px-2 py-1 rounded">{'{{dueDays}}'}</code>
                  <code className="bg-blue-100 px-2 py-1 rounded">{'{{poNo}}'}</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-800">
                  {selectedTemplate ? 'Edit Template' : 'Create New Template'}
                </h4>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back to Templates
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  rows={12}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-mono text-sm"
                  placeholder="Enter email body content"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg flex items-center space-x-2 transition-all font-medium shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateModal;
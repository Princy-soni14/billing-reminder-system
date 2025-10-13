import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Mail } from 'lucide-react';
import { Company, CompanyCC } from '../types';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface ManageCCModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  ccEmails: CompanyCC[];
  onAddCC: (companyId: string, email: string, name?: string) => void;
  onDeleteCC: (ccId: string) => void;
}

const ManageCCModal: React.FC<ManageCCModalProps> = ({
  isOpen,
  onClose,
  company,
  ccEmails,
  onAddCC,
  onDeleteCC,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedEmails, setFetchedEmails] = useState<CompanyCC[]>([]);

  // 🚀 Fetch CC emails from Firestore when modal opens
  useEffect(() => {
    if (!isOpen || !company?.id) return;

    const fetchCCEmails = async () => {
      setLoading(true);
      try {
        const ccRef = collection(db, 'companies', company.id, 'ccEmails');
        const snapshot = await getDocs(ccRef);
        const ccList = snapshot.docs.map((doc) => ({
          id: doc.id,
          companyId: company.id,
          ...(doc.data() as Omit<CompanyCC, 'id' | 'companyId'>),
        }));
        setFetchedEmails(ccList);
      } catch (error) {
        console.error('Error fetching CC emails:', error);
        toast.error('Failed to load CC emails');
      } finally {
        setLoading(false);
      }
    };

    fetchCCEmails();
  }, [isOpen, company]);

  if (!isOpen) return null;

  // 📨 Add new CC email (Firestore + local)
  const handleAddCC = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (
      [...ccEmails, ...fetchedEmails].some(
        (cc) => cc.email.toLowerCase() === email.toLowerCase()
      )
    ) {
      toast.error('This email is already in the CC list');
      return;
    }

    try {
      const newCC: Omit<CompanyCC, 'id'> = {
        companyId: company.id,
        email,
        name,
        createdAt: new Date().toISOString(),
      };

      // Firestore add
      const ccRef = collection(db, 'companies', company.id, 'ccEmails');
      const docRef = await addDoc(ccRef, {
        email: newCC.email,
        name: newCC.name,
        createdAt: newCC.createdAt,
      });

      // Local update
      const addedCC: CompanyCC = { id: docRef.id, ...newCC };
      setFetchedEmails((prev) => [...prev, addedCC]);
      onAddCC(company.id, email, name);
      toast.success(`Added ${email}`);
      setEmail('');
      setName('');
    } catch (error) {
      console.error('Error adding CC:', error);
      toast.error('Failed to add CC email');
    }
  };

  // 🗑️ Delete CC email (Firestore + local)
  const handleDelete = async (ccId: string, ccEmail: string) => {
    if (!window.confirm(`Remove ${ccEmail} from CC list?`)) return;

    try {
      const ccDocRef = doc(db, 'companies', company.id, 'ccEmails', ccId);
      await deleteDoc(ccDocRef);
      setFetchedEmails((prev) => prev.filter((cc) => cc.id !== ccId));
      onDeleteCC(ccId);
      toast.success(`Removed ${ccEmail}`);
    } catch (error) {
      console.error('Error deleting CC:', error);
      toast.error('Failed to delete CC email');
    }
  };

  const allCCEmails = [...new Map([...fetchedEmails, ...ccEmails].map((cc) => [cc.id, cc])).values()];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage CC Emails</h2>
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-blue-100 mt-2">Company: {company.name}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form
            onSubmit={handleAddCC}
            className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <h3 className="font-semibold text-gray-800 mb-4">Add CC Email</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contact name"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              <span>{loading ? 'Adding...' : 'Add to CC List'}</span>
            </button>
          </form>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Mail className="h-5 w-5 text-gray-600" />
              <span>CC Email List ({allCCEmails.length})</span>
            </h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : allCCEmails.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No CC emails added yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Add emails to send copies of reminders
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {allCCEmails.map((cc) => (
                  <div
                    key={cc.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{cc.email}</p>
                        {cc.name && <p className="text-sm text-gray-500">{cc.name}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(cc.id, cc.email)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition"
                      title="Remove from CC list"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageCCModal;

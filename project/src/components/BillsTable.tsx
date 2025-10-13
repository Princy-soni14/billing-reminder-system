import React, { useState } from "react";
import {
  Calendar,
  Mail,
  Pause,
  Play,
  AlertCircle,
  Eye,
  Search,
  Download,
} from "lucide-react";
import { Bill, Company } from "../types";
import { CSVLink } from "react-csv";

interface BillsTableProps {
  bills: Bill[];
  companies: Company[];
  onSendReminder: (billId: string, type: "manual" | "automatic") => void;
  onToggleReminderPause: (billId: string) => void;
  onBillSelect: (bill: Bill) => void;
}

const BillsTable: React.FC<BillsTableProps> = ({
  bills,
  companies,
  onSendReminder,
  onToggleReminderPause,
  onBillSelect,
}) => {
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<
    "all" | "billNo" | "amount" | "companyName" | "dueDays"
  >("all");

  // ----------------------------------------
  // 🔸 Filter + Export helpers
  // ----------------------------------------
  const filteredBills = bills.filter((bill) => {
    if (!searchTerm) return true;

    const company = companies.find((c) => c.id === bill.companyId);
    const lower = searchTerm.toLowerCase();

    switch (searchField) {
      case "billNo":
        return bill.billNo?.toLowerCase().includes(lower);
      case "amount":
        return bill.pendingAmount?.toString().includes(searchTerm);
      case "companyName":
        return company?.name?.toLowerCase().includes(lower);
      case "dueDays":
        return bill.dueDays?.toString().includes(searchTerm);
      default:
        return (
          bill.billNo?.toLowerCase().includes(lower) ||
          bill.pendingAmount?.toString().includes(searchTerm) ||
          company?.name?.toLowerCase().includes(lower) ||
          bill.dueDays?.toString().includes(searchTerm)
        );
    }
  });

  const csvData = filteredBills.map((bill) => {
    const company = companies.find((c) => c.id === bill.companyId);
    return {
      Bill_No: bill.billNo,
      Company: company?.name || "Unknown",
      Amount: bill.pendingAmount,
      Due_Days: bill.dueDays,
      Reminder_Count: bill.reminderCount,
      Last_Reminder: bill.lastReminderSent || "-",
      Status: bill.isReminderPaused ? "Paused" : "Active",
    };
  });

  // ----------------------------------------
  // 🔸 Selection & Reminder handlers
  // ----------------------------------------
  const handleSelectBill = (billId: string) => {
    setSelectedBills((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBills.length === filteredBills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(filteredBills.map((bill) => bill.id));
    }
  };

  const sendBulkReminders = () => {
    selectedBills.forEach((billId) => onSendReminder(billId, "manual"));
    setSelectedBills([]);
  };

  const getDueDaysBadge = (dueDays: number) => {
    if (dueDays > 60) return "bg-red-100 text-red-800";
    if (dueDays > 30) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // ----------------------------------------
  // 🔸 UI Rendering
  // ----------------------------------------
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Pending Bills</h3>
          <div className="flex items-center space-x-3">
            {/* 📤 Export CSV */}
            <CSVLink
              data={csvData}
              filename="pending_bills.csv"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </CSVLink>

            {/* 📧 Bulk Reminder */}
            {selectedBills.length > 0 && (
              <button
                onClick={sendBulkReminders}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-lg font-medium"
              >
                <Mail className="h-4 w-4" />
                <span>Send Bulk ({selectedBills.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* 🔍 Search Bar */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Fields</option>
            <option value="billNo">Bill No</option>
            <option value="amount">Amount</option>
            <option value="companyName">Company</option>
            <option value="dueDays">Due Days</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedBills.length === filteredBills.length &&
                    filteredBills.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bill Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reminders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredBills.map((bill) => (
              <tr key={bill.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedBills.includes(bill.id)}
                    onChange={() => handleSelectBill(bill.id)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-bold text-gray-900">{bill.billNo}</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {bill.date}
                    </div>
                    {bill.poNo && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                        {bill.poNo}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDueDaysBadge(
                      bill.dueDays
                    )}`}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {bill.dueDays} days
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-lg font-bold text-red-600">
                    ₹{bill.pendingAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-red-500 font-medium">Pending</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {bill.reminderCount} sent
                    </span>
                    {bill.lastReminderSent && (
                      <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                        Last:{" "}
                        {new Date(bill.lastReminderSent).toLocaleDateString()}
                      </span>
                    )}
                    {bill.isReminderPaused && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                        <Pause className="h-3 w-3 mr-1" />
                        Paused
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSendReminder(bill.id, "manual")}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2 rounded-lg transition-all shadow-md"
                      title="Send Instant Reminder"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleReminderPause(bill.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        bill.isReminderPaused
                          ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
                          : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md"
                      }`}
                      title={
                        bill.isReminderPaused
                          ? "Resume Reminders"
                          : "Pause Reminders"
                      }
                    >
                      {bill.isReminderPaused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onBillSelect(bill)}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-2 rounded-lg transition-all shadow-md"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillsTable;

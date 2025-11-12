import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  Mail,
  FileSpreadsheet,
  Settings,
  LayoutTemplate as Template,
  Building2,
  LogOut,
  Upload,
  ChevronDown,
  UserPlus,
  Edit, // Added for Edit button
  Plus, // Added for Add button
} from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginForm from "./components/LoginForm";
// 🚀 We no longer need CompanySelector, as we've rebuilt its UI here
// import CompanySelector from "./components/CompanySelector"; 
import CompaniesPage from "./components/CompaniesPage";
import AddCompanyModal from "./components/AddCompanyModal";
import EditCompanyModal from "./components/EditCompanyModal";
import ManageCCModal from "./components/ManageCCModal";
import EmailTemplateModal from "./components/EmailTemplateModal";
import BillsTable from "./components/BillsTable";
import BillDetailsModal from "./components/BillDetailsModal";
import EmailPreviewModal from "./components/EmailPreviewModal";
import ReminderSettings from "./components/ReminderSettings";
import BulkUploadModal from "./components/BulkUploadModal";
import { defaultEmailTemplates } from "./data/mockData";
import { EmailService } from "./services/emailService";
import { Bill, Company, ReminderLog, EmailTemplate, CompanyCC } from "./types";
import { collection, getDocs, query, where, addDoc, updateDoc,setDoc,deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import RequireAuth from "./components/RequireAuth";
import { AddUserModal } from "./components/AddUserModal";


// -------------------------------------------------------------
// ⚙️ Main App Content
// -------------------------------------------------------------
function AppContent() {
  const { user, role, companyId, loading, logout } = useAuth();

  // Firestore-backed state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [companyCC, setCompanyCC] = useState<CompanyCC[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(defaultEmailTemplates);

  // UI state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | "ALL">("ALL");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [isEmailTemplateModalOpen, setIsEmailTemplateModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isManageCCModalOpen, setIsManageCCModalOpen] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState<"bills" | "companies">("bills");
  const [currentView, setCurrentView] = useState<"dashboard" | "companies">("dashboard");
  const [companyForCC, setCompanyForCC] = useState<Company | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

// -------------------------------------------------------------
// 🔥 Firestore Fetch Logic (Reusable)
// -------------------------------------------------------------
const fetchData = async () => {
  if (loading) return;

  try {
    // 🚀 UPDATED LOGIC:
    // If you are an admin OR a user without a specific companyId, fetch ALL data.
    if (role === "admin" || (role === "user" && !companyId)) {
      // 1️⃣ Fetch ALL Companies
      const companySnap = await getDocs(collection(db, "companies"));
      const companyData = companySnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Company)
      );
      setCompanies(companyData);

      // 2️⃣ Fetch ALL Bills
      const billsSnap = await getDocs(collection(db, "bills"));
      const billData = billsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Bill)
      );
      setBills(billData);
    } 
    // Otherwise, if you are a user WITH a companyId, fetch only that company's data.
    else if (role === "user" && companyId) {
      // 1️⃣ Fetch Specific Company
      const companyDoc = await getDoc(doc(db, "companies", companyId));
      if (companyDoc.exists()) {
        setCompanies([{ id: companyDoc.id, ...companyDoc.data() } as Company]);
      } else {
        console.warn("⚠️ No company found for ID:", companyId);
        setCompanies([]);
      }

      // 2️⃣ Fetch Specific Bills
      const billsQuery = query(
        collection(db, "bills"),
        where("companyId", "==", companyId)
      );
      const billsSnap = await getDocs(billsQuery);
      const billData = billsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Bill)
      );
      setBills(billData);
    }

    console.log("✅ Firestore data loaded successfully:", { role, companyId });
  } catch (err) {
    console.error("❌ Error fetching Firestore data:", err);
    toast.error("Failed to load data from Firestore");
  }
};

// 🔄 Run automatically when user logs in or changes company
useEffect(() => {
  fetchData();
}, [role, companyId, loading]);

// Expose refreshData for other handlers
const refreshData = async () => {
  const toastId = toast.loading("Refreshing dashboard data...");
  try {
    await fetchData();
    toast.success("✅ Data refreshed successfully!", { id: toastId });
  } catch (error) {
    console.error("❌ Refresh error:", error);
    toast.error("Failed to refresh data.", { id: toastId });
  }
};

  // 🚀 REPLACED: This logic derives the company/bills to show
  
  // Get the selected company object (will be null if "ALL" is chosen)
  const selectedCompany =
    companies.find((c) => c.id === selectedCompanyId) || null;

  // Filter bills based on selection
  const billsToShow =
    selectedCompanyId === "ALL"
      ? bills // Show all bills
      : bills.filter((b) => b.companyId === selectedCompanyId); // Show filtered bills

  // Sort bills by due date (ascending)
  const companyBills = [...billsToShow].sort(
    (a, b) => (a.dueDays || 0) - (b.dueDays || 0)
  );
// -------------------------------------------------------------
// 🧾 Bulk Upload Handler with Sequential IDs (Bills + Companies)
// -------------------------------------------------------------
const handleBulkUpload = async (data: any[], type: "bills" | "companies") => {
  try {
    if (type === "bills") {
      // 1️⃣ Get current bill count to continue numbering
      const billsSnap = await getDocs(collection(db, "bills"));
      const currentCount = billsSnap.size;

      // 2️⃣ Prepare new bills with sequential IDs
      const newBills: Bill[] = data.map((bill, index) => {
        const billNumber = currentCount + index + 1;
        const newId = `bill-${String(billNumber).padStart(3, "0")}`;
        return {
          id: newId,
          billNo: bill["Bill No"] || bill["billNo"] || "",
          companyId: bill["Company ID"] || bill["companyId"] || "",
          companyName: bill["Company Name"] || bill["companyName"] || "",
          billAmount: Number(bill["Bill Amount"] || bill["billAmount"]) || 0,
          pendingAmount: Number(bill["Pending Amount"] || bill["pendingAmount"]) || 0,
          balanceAmount: Number(bill["Balance Amount"] || bill["balanceAmount"]) || 0,
          date: bill["Bill Date (DD/MM/YYYY)"] || bill["date"] || new Date().toISOString(),
          poNo: bill["PO No"] || bill["poNo"] || "",
          type: bill["Type"] || bill["type"] || "",
          dueDays: Number(bill["Due Days"] || bill["dueDays"]) || 0,
          reminderCount: 0,
          isReminderPaused: false,
          lastReminderSent: "",
          uploadedAt: new Date().toISOString(),
        } as Bill;
      });

      // 3️⃣ Save to Firestore
      for (const bill of newBills) {
        await setDoc(doc(db, "bills", bill.id), bill);
      }

      // 4️⃣ Update local state instantly
      setBills((prev) => [...prev, ...newBills]);
      toast.success(`✅ ${newBills.length} Bills uploaded successfully!`);
    }

    // -----------------------------------------------------
    // 🏢 COMPANY BULK UPLOAD (Admin only)
    // -----------------------------------------------------
    else if (type === "companies") {
      const companiesSnap = await getDocs(collection(db, "companies"));
      const currentCount = companiesSnap.size;

      const newCompanies: Company[] = data.map((comp, index) => {
        const compNumber = currentCount + index + 1;
        const newId = `comp-${String(compNumber).padStart(3, "0")}`;
        return {
          id: newId,
          name: comp["Company Name"] || comp["name"] || "",
          email: comp["Email"] || comp["email"] || "",
          address: comp["Address"] || comp["address"] || "",
          city: comp["City"] || comp["city"] || "",
          state: comp["State"] || comp["state"] || "",
          pincode: comp["Pincode"] || comp["pincode"] || "",
          phone: comp["Phone"] || comp["phone"] || "",
          contactPerson: comp["Contact Person"] || comp["contactPerson"] || "",
          paymentTermsDays:
            Number(comp["Payment Terms (Days)"] || comp["paymentTermsDays"]) || 30,
          totalPendingAmount: 0,
          autoRemindersEnabled: true,
          createdAt: new Date().toISOString(),
        } as Company;
      });

      // Save to Firestore
      for (const comp of newCompanies) {
        await setDoc(doc(db, "companies", comp.id), comp);
      }

      // Update local state instantly
      setCompanies((prev) => [...prev, ...newCompanies]);

      toast.success(`🏢 ${newCompanies.length} Companies uploaded successfully!`);
    }

    // ✅ Refresh dashboard after upload
    await refreshData();
  } catch (error) {
    console.error("❌ Bulk upload failed:", error);
    toast.error("Failed to upload data. Please check format and permissions.");
  }
};



  // -------------------------------------------------------------
  // 📨 Handlers
  // -------------------------------------------------------------
  const handleSendReminder = async (billId: string, type: "manual" | "automatic") => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill || !selectedCompany) {
      toast.error("Please select a specific company to send reminders.");
      return;
    };

    if (bill.isReminderPaused && type === "automatic") {
      toast.error("Reminder is paused for this bill");
      return;
    }

    try {
      // We must have a selectedCompany to send a reminder
      const companyForBill = companies.find(c => c.id === bill.companyId);
      if (!companyForBill) {
        toast.error("Could not find company for this bill.");
        return;
      }

      const result = await EmailService.sendReminder(bill, companyForBill, type);

      if (result.success) {
        setBills((prev) =>
          prev.map((b) =>
            b.id === billId
              ? {
                  ...b,
                  reminderCount: b.reminderCount + 1,
                  lastReminderSent: new Date().toISOString().split("T")[0],
                }
              : b
          )
        );
        setReminderLogs((prev) => [...prev, result.log]);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to send reminder");
    }
  };

  const handleSendConsolidatedReminder = async () => {
    if (!selectedCompany) return; // This button is now hidden if no company is selected
    const pendingBills = companyBills.filter((b) => !b.isReminderPaused);
    if (pendingBills.length === 0) {
      toast.error("No active bills to send reminders for");
      return;
    }

    const ccEmails = companyCC.filter((cc) => cc.companyId === selectedCompany.id);

    try {
      const result = await EmailService.sendConsolidatedReminder(
        pendingBills,
        selectedCompany,
        ccEmails,
        "manual"
      );

      if (result.success) {
        setBills((prev) =>
          prev.map((b) =>
            pendingBills.find((pb) => pb.id === b.id)
              ? {
                  ...b,
                  reminderCount: b.reminderCount + 1,
                  lastReminderSent: new Date().toISOString().split("T")[0],
                }
              : b
          )
        );
        setReminderLogs((prev) => [...prev, result.log]);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to send consolidated reminder");
    }
  };

  const handleToggleReminderPause = (billId: string) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId ? { ...b, isReminderPaused: !b.isReminderPaused } : b
      )
    );
    const bill = bills.find((b) => b.id === billId);
    if (bill) {
      toast.success(
        `Reminders ${bill.isReminderPaused ? "resumed" : "paused"} for bill ${bill.billNo}`
      );
    }
  };

  // -------------------------------------------------------------
  // 📊 Dashboard Metrics
  // -------------------------------------------------------------
  const totalPendingBills = companyBills.length;
  const totalOverdueBills = companyBills.filter((b) => b.dueDays > 0).length;
  const totalPendingAmount = companyBills.reduce(
  (sum, b) => sum + Number(b.pendingAmount || 0),
  0
);

  // -------------------------------------------------------------
  // 🖥️ UI Layout
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Navbar */}
<div className="bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* make it wrap and center for mobile */}
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      
      {/* Left: Logo + Title */}
      <div className="flex items-center justify-center sm:justify-start space-x-3 w-full sm:w-auto">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-md">
          <FileSpreadsheet className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent text-center sm:text-left">
          Billing Reminder System
        </h1>
      </div>

      {/* Right: Email + Logout */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[180px] sm:max-w-none">
            {user?.email}
          </span>
        </div>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center space-x-2 transition font-medium w-full sm:w-auto"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm sm:text-base">Logout</span>
        </button>
      </div>
    </div>
  </div>
</div>



      {/* Main Content */}
      <div className="main-container max-w-7xl mx-auto py-6">
       {/* ✅ Responsive Navigation Buttons */}
<div className="mb-6">
  {/* Mobile Toggle */}
  <div className="sm:hidden mb-3">
    <button
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      className="w-full bg-white hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg flex justify-between items-center transition font-medium border"
    >
      <span>Menu</span>
      <ChevronDown className={`h-5 w-5 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
    </button>

    {/* Mobile Dropdown Menu */}
    {isDropdownOpen && (
      <div className="mt-2 bg-white rounded-lg shadow-md border border-gray-200 space-y-2 p-2">
        <button
          onClick={() => setCurrentView("dashboard")}
          className={`w-full text-left px-4 py-2 rounded-lg font-medium ${
            currentView === "dashboard"
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setCurrentView("companies")}
          className={`w-full text-left px-4 py-2 rounded-lg font-medium ${
            currentView === "companies"
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          Companies
        </button>
        <button
          onClick={() => setIsEmailTemplateModalOpen(true)}
          className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
        >
          Templates
        </button>
        <button
          onClick={() => {
            setBulkUploadType("bills");
            setIsBulkUploadModalOpen(true);
          }}
          className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Bulk Upload</span>
        </button>
        {/* 🚀 START: ADD USER BUTTON (MOBILE) */}
      {role === "admin" && (
        <button
          onClick={() => {
            setIsAddUserModalOpen(true);
            setIsDropdownOpen(false); // Close menu
          }}
          className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>User Management</span>
        </button>
      )}
      {/* 🚀 END: ADD USER BUTTON (MOBILE) */}
      </div>
    )}
  </div>

  {/* Desktop Menu */}
  <div className="hidden sm:flex items-center space-x-4 navbar-buttons">
    <button
      onClick={() => setCurrentView("dashboard")}
      className={`px-6 py-3 rounded-lg font-medium transition-all ${
        currentView === "dashboard"
          ? "bg-blue-600 text-white shadow-lg"
          : "bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      Dashboard
    </button>
    <button
      onClick={() => setCurrentView("companies")}
      className={`px-6 py-3 rounded-lg font-medium transition-all ${
        currentView === "companies"
          ? "bg-blue-600 text-white shadow-lg"
          : "bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Building2 className="h-5 w-5 inline mr-1" />
      Companies
    </button>
    <button
      onClick={() => setIsEmailTemplateModalOpen(true)}
      className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg flex items-center space-x-2 transition font-medium"
    >
      <Template className="h-4 w-4" />
      <span>Templates</span>
    </button>
    {/* 🚀 REPLACED: Bulk Upload is now a single button */}
    <button
      onClick={() => {
        setBulkUploadType("bills"); // This ensures the modal opens in "bills" mode
        setIsBulkUploadModalOpen(true);
      }}
      className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg flex items-center space-x-2 transition font-medium"
    >
      <Upload className="h-4 w-4" />
      <span>Bulk Upload</span>
    </button>
    {/* 🚀 START: ADD USER BUTTON (DESKTOP) */}
    {role === "admin" && (
      <button
        onClick={() => setIsAddUserModalOpen(true)}
        className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg flex items-center space-x-2 transition font-medium"
      >
        <UserPlus className="h-4 w-4" />
        <span>User Management</span>
      </button>
    )}
    {/* 🚀 END: ADD USER BUTTON (DESKTOP) */}
  </div>
</div>

        {/* Dashboard or Companies Page */}
        {currentView === "dashboard" ? (
          <>
            {/* Metrics */}
            <div className="stats-grid grid gap-6 mb-8">
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-6">
                <p className="text-sm text-gray-600 font-medium">Total Pending Bills</p>
                <p className="text-4xl font-bold text-blue-600">{totalPendingBills}</p>
              </div>
              <div className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-lg border border-red-100 p-6">
                <p className="text-sm text-gray-600 font-medium">Overdue Bills</p>
                <p className="text-4xl font-bold text-red-600">{totalOverdueBills}</p>
              </div>
              <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-100 p-6">
                <p className="text-sm text-gray-600 font-medium">Total Amount</p>
                <p className="text-4xl font-bold text-green-600">
                  ₹{totalPendingAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 🚀 REPLACED: Company Section (Hybrid UI) */}
            
            {/* --- Master Company Selector --- */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                {/* Dropdown on the left */}
                <div>
                  <label htmlFor="company-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Company
                  </label>
                  <select
                    id="company-select"
                    className="block w-full sm:w-96 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-3"
                    value={selectedCompanyId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedCompanyId(newId as string | "ALL");
                      if (newId !== "ALL") {
                        const newCompany = companies.find(c => c.id === newId);
                        if (newCompany) toast.success(`Switched to ${newCompany.name}`);
                      } else {
                        toast.success("Showing all companies");
                      }
                    }}
                  >
                    <option value="ALL">-- ALL COMPANIES --</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Buttons on the right */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsAddCompanyModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Company
                  </button>
                  {/* Only show Edit if a specific company is selected */}
                  {selectedCompany && (
                    <button 
                      onClick={() => setIsEditCompanyModalOpen(true)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit Selected
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* --- Conditionally Show Details OR "All" Message --- */}
            {selectedCompanyId !== "ALL" && selectedCompany ? (
              <>
                {/* This is the UI you missed (re-created from CompanySelector) */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border-l-4 border-blue-600">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedCompany.name}</h2>
                  <div className="text-gray-600 space-y-1">
                    <p><strong>Address:</strong> {selectedCompany.address}, {selectedCompany.city}, {selectedCompany.state} - {selectedCompany.pincode}</p>
                    <p><strong>Email:</strong> <a href={`mailto:${selectedCompany.email}`} className="text-blue-600 hover:underline">{selectedCompany.email}</a></p>
                    <p><strong>Contact:</strong> {selectedCompany.contactPerson} ({selectedCompany.phone})</p>
                  </div>
                </div>

                <div className="mb-6">
                  <button
                    onClick={handleSendConsolidatedReminder}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all shadow-lg font-medium"
                  >
                    <Mail className="h-5 w-5" />
                    <span>Send Consolidated Reminder ({companyBills.length} Bills)</span>
                  </button>
                </div>

                <ReminderSettings
                  company={selectedCompany}
                  onUpdateSettings={() => toast.success("Reminder settings updated")}
                />
              </>
            ) : (
              <div className="mb-6">
                <p className="text-gray-600">
                  Displaying {companyBills.length} bills from all companies, sorted by due date.
                </p>
              </div>
            )}

            {/* BillsTable (this part is correct) */}
            <BillsTable
              bills={companyBills}
              companies={companies}
              onSendReminder={handleSendReminder}
              onToggleReminderPause={handleToggleReminderPause}
              onBillSelect={(bill) => {
                setSelectedBill(bill);
                setIsDetailsModalOpen(true);
              }}
            />
          </>
        ) : (
          <CompaniesPage
            companies={companies}
            onAddCompany={() => setIsAddCompanyModalOpen(true)}
            onEditCompany={(c) => {
              // ✅ FIXED: Use the ID setter
              setSelectedCompanyId(c.id); 
              setIsEditCompanyModalOpen(true);
            }}
            onDeleteCompany={async (id) => {
              try {
                // Delete the main company doc
                await deleteDoc(doc(db, "companies", id));

                //Delete all bills belonging to this company
                const billsSnapshot = await getDocs(query(collection(db, "bills"), where("companyId", "==", id)));
                for (const billDoc of billsSnapshot.docs) {
                  await deleteDoc(doc(db, "bills", billDoc.id));
                }

                //  Delete all CC emails (subcollection)
                const ccSnapshot = await getDocs(collection(db, "companies", id, "ccEmails"));
                for (const ccDoc of ccSnapshot.docs) {
                  await deleteDoc(ccDoc.ref);
                }

                //  Update local state instantly
                setCompanies((prev) => prev.filter((c) => c.id !== id));

                toast.success(`🗑️ Company and related data deleted successfully!`);
              } catch (error) {
                console.error("Error deleting company:", error);
                toast.error("❌ Failed to delete company. Please try again.");
              }
            }}
            onManageCC={(c) => {
              setCompanyForCC(c);
              setIsManageCCModalOpen(true);
            }}
          />
        )}
      </div>

      {/* ---------------- Modals ---------------- */}
      {/* 🚀 START: ADD USER MODAL */}
    <AddUserModal
      isOpen={isAddUserModalOpen}
      onClose={() => setIsAddUserModalOpen(false)}
    />
    {/* 🚀 END: ADD USER MODAL */}
      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onAddCompany={async (newCompany) => {
          try {
            // ✅ 1. Generate sequential custom ID like comp-001, comp-002
            const snapshot = await getDocs(collection(db, "companies"));
            const total = snapshot.size + 1;
            const newId = `comp-${String(total).padStart(3, "0")}`; // comp-001, comp-002 ...

            // ✅ 2. Create Firestore doc with custom ID
            const docRef = doc(db, "companies", newId);
            await setDoc(docRef, {
              ...(newCompany as Partial<Company>), // ✅ fixes TS type error
              id: newId,
              totalPendingAmount: 0,
              createdAt: new Date().toISOString(),
            });

            // ✅ 3. Update local state instantly
            setCompanies((prev) => [
              ...prev,
              {
                id: newId,
                ...(newCompany as Partial<Company>),
                totalPendingAmount: 0,
                createdAt: new Date().toISOString(),
              } as Company,
            ]);

            toast.success(`✅ Company "${newCompany.name}" added successfully!`);
          } catch (error) {
            console.error("Error adding company:", error);
            toast.error("❌ Failed to add company. Please try again.");
          }
        }}
      />



      <EditCompanyModal
        company={selectedCompany || ({} as Company)} // Pass the derived selectedCompany
        isOpen={isEditCompanyModalOpen}
        onClose={() => setIsEditCompanyModalOpen(false)}
        onUpdateCompany={async (updatedCompany) => {
          try {
            // ✅ Update Firestore document
            const companyRef = doc(db, "companies", updatedCompany.id);
            await updateDoc(companyRef, {
              ...updatedCompany,
              updatedAt: new Date().toISOString(), // optional timestamp
            });

            // ✅ Update local state instantly
            setCompanies((prev) =>
              prev.map((c) => (c.id === updatedCompany.id ? updatedCompany : c))
            );

            // ✅ FIXED: No need to set selectedCompany, it's derived
            // if (selectedCompany?.id === updatedCompany.id) {
            //   setSelectedCompany(updatedCompany); 
            // }

            toast.success(`Company "${updatedCompany.name}" updated successfully!`);
          } catch (error) {
            console.error("Error updating company:", error);
            toast.error("❌ Failed to update company. Please try again.");
          }
        }}
      />


      {companyForCC && (
        <ManageCCModal
          isOpen={isManageCCModalOpen}
          onClose={() => {
            setIsManageCCModalOpen(false);
            setCompanyForCC(null);
          }}
          company={companyForCC}
          ccEmails={companyCC.filter((cc) => cc.companyId === companyForCC.id)}
          onAddCC={async (email, name) => {
            try {
              const newCC: CompanyCC = {
                id: `cc-${Date.now()}`,
                companyId: companyForCC.id,
                email,
                name,
                createdAt: new Date().toISOString(),
              };

              const ccRef = collection(db, "companies", companyForCC.id, "ccEmails");
              const docRef = await addDoc(ccRef, {
                email: newCC.email,
                name: newCC.name,
                createdAt: newCC.createdAt,
              });

              setCompanyCC((prev) => [...prev, { ...newCC, id: docRef.id }]);
              toast.success(`CC email "${email}" added successfully!`);
            } catch (error) {
              console.error("Error adding CC:", error);
              toast.error("Failed to add CC email to Firestore");
            }
          }}
          onDeleteCC={async (ccId) => {
            try {
              const ccDocRef = doc(db, "companies", companyForCC.id, "ccEmails", ccId);
              await deleteDoc(ccDocRef);

              setCompanyCC((prev) => prev.filter((cc) => cc.id !== ccId));
              toast.success("CC email deleted successfully!");
            } catch (error) {
              console.error("Error deleting CC:", error);
              toast.error("Failed to delete CC email from Firestore");
            }
          }}
        />
      )}

      <EmailTemplateModal
        isOpen={isEmailTemplateModalOpen}
        onClose={() => setIsEmailTemplateModalOpen(false)}
        onSaveTemplate={(template) =>
          setEmailTemplates((prev) => [
            ...prev.filter((t) => t.id !== template.id),
            template,
          ])
        }
        onDeleteTemplate={(id) =>
          setEmailTemplates((prev) => prev.filter((t) => t.id !== id))
        }
        existingTemplates={emailTemplates}
      />

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUpload={(data, type) => {
          // 🚀 This function name was wrong, fixed it to 'handleBulkUpload'
          handleBulkUpload(data, type); 
        }}
        type={bulkUploadType}
      />


      <BillDetailsModal
        bill={selectedBill}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onSendReminder={handleSendReminder}
      />

      <EmailPreviewModal
        bill={selectedBill}
        companyName={selectedCompany?.name || ""}
        isOpen={isEmailPreviewOpen}
        onClose={() => setIsEmailPreviewOpen(false)}
        onSendEmail={() => {
          if (selectedBill) handleSendReminder(selectedBill.id, "manual");
        }}
      />
    </div>
  );
}

// -------------------------------------------------------------
// 🌐 App Router Setup
// -------------------------------------------------------------
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/"
            element={
              <RequireAuth allowedRoles={["user", "admin"]}>
                <AppContent />
              </RequireAuth>
            }
          />
          <Route
            path="/companies"
            element={
              <RequireAuth allowedRoles={["admin"]}>
                <AppContent />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;